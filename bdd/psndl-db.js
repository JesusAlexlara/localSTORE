const fs = require("fs");
const path = require("path");
const csv = require("csvtojson");
const request = require("request");

if (!fs.existsSync(path.resolve(__dirname, "../public/img/product-covers"))) {
  fs.mkdirSync(path.resolve(__dirname, "../public/img/product-covers"));
}

const tableHeader =
  "productCode;name;type;region;pkg;contentId;rap;description;uploader\n";

const storeCoverMap = {
  US: "US/en",
  EU: "GB/en",
  JP: "JP/ja",
  HK: "HK/en",
  ALL: "US/en"
};

//store.playstation.com/store/api/chihiro/00_09_000/container//US/en/999/UP9000-NPUA80523_00-TOKYOJUNGLE00001
function getCoverUrl(game, width = 408) {
  return `https://store.playstation.com/store/api/chihiro/00_09_000/container/${
    storeCoverMap[game.region]
  }/999/${game.contentId}/image?w=${width}`;
}

const processedDownloads = new Set();

function downloadCover(game) {
  const url = getCoverUrl(game, 392);
  const dest = path.resolve(
    __dirname,
    `../public/img/product-covers/${game.productCode}.jpg`
  );

  return new Promise((resolve, reject) => {
    if (processedDownloads.has(game.productCode)) {
      resolve(game.productCode);
      return;
    }

    processedDownloads.add(game.productCode);

    const file = fs.createWriteStream(dest);
    const sendReq = request.get(url);

    function onError(error) {
      if (fs.existsSync(dest)) {
        fs.unlink(dest, () => {
          resolve(false);
        });
      } else {
        resolve(false);
      }
    }

    // verify response code
    sendReq.on("response", response => {
      if (response.statusCode !== 200) {
        return onError({ error: response.statusCode, url });
      }
      sendReq.pipe(file);
      resolve(game.productCode);
    });

    // check for request errors
    sendReq.on("error", onError);
    file.on("error", onError);
  });
}

function getAvaliableCovers() {
  return fs
    .readdirSync(path.resolve(__dirname, "../public/img/product-covers"))
    .filter(name => {
      return name.endsWith(".jpg");
    })
    .map(cover => cover.replace(/\.jpg/g, ""));
}

var downloadLocationRegexpMap = {
  "zeus.dl.playstation.net": {
    reg: /zeus.dl.playstation.net\/cdn\/(([A-Z0-9]{6})\/([A-Z0-9]{9})_00)/,
    replace: [/\//, "-"]
  }, // pkg
  "ares.dl.playstation.net": {
    reg: /ares.dl.playstation.net\/cdn\/(([A-Z0-9]{6})\/([A-Z0-9]{9})_00)/,
    replace: [/\//, "-"]
  }, // pkg
  "gs2.ww.prod.dl.playstation.net": {
    reg: /gs2.ww.prod.dl.playstation.net.*([A-Z0-9]{6}-[A-Z0-9]{9}_00-[A-Z0-9]{16})/,
    replace: ["", ""]
  }, // pkg
  "apollo.dl.playstation.net": {
    reg: /apollo.dl.playstation.net\/cdn\/(([A-Z0-9]{6})\/([A-Z0-9]{9})_00)/,
    replace: ["", ""]
  }, // pkg
  "b0.ww.np.dl.playstation.net": {
    reg: /b0.ww.np.dl.playstation.net\/tppkg\/np\/.*\/([A-Z0-9]{6}-[A-Z0-9]{9}_00-[A-Z0-9]{16})/,
    replace: ["", ""]
  }, // pkg
  "poseidon.dl.playstation.net": {
    reg: /poseidon.dl.playstation.net\/cdn\/(([A-Z0-9]{6})\/([A-Z0-9]{9})_00)/,
    replace: [/\//, "-"]
  } // jpg, mp4
};

var getLocation = function(href) {
  var l = document.createElement("a");
  l.href = href;
  return l.host;
};
module.exports = function(cb) {
  const avaliableCovers = getAvaliableCovers();
  console.log("avaliableCovers", avaliableCovers.length);
  console.log("Updating psndl database");
  screenLog("Updating psndl database");
  request.post(
    `http://psndl.net/download-db`,
    { timeout: 145000 },
    (error, response, body) => {
      if (!error && response.statusCode == 200) {
        console.log("Psndl database update loaded");
        csv({ delimiter: ";" })
          .fromString(tableHeader + body)
          .then(results => {
            const fixContentId = results.map(game => {
              if (game.contentId === "" || game.contentId.length < 19) {
                const loc = getLocation(game.pkg);
                const target = downloadLocationRegexpMap[loc];
                const result = game.pkg.match(target.reg);
                if (result && target.replace[0] !== "") {
                  game.contentId = result[1].replace(
                    target.replace[0],
                    target.replace[1]
                  );
                }
              }
              return game;
            });

            results = fixContentId.map(game => {
              let contentId = game.contentId.replace(/\.rap/gi, "");
              if (contentId !== "") {
                const productCode = contentId.split("-")[1].split("_")[0];
                const hasCover = avaliableCovers.includes(productCode);
                return {
                  ...game,
                  contentId,
                  cover: hasCover ? productCode : null
                };
              }
              const hasCover = avaliableCovers.includes(game.productCode);
              return {
                ...game,
                contentId: "",
                cover: hasCover ? game.productCode : null
              };
            });

            const unknownCoverGames = results
              .filter(a => a.cover === null)
              .filter(game => game.contentId !== "");
            const totalCovers = unknownCoverGames.length;
            console.log(
              `Scrapping ${totalCovers} Covers...of ${results.length}`
            );
            screenLog(`Scrapping ${totalCovers} Covers...`);

            let remainingCovers = totalCovers;
            Promise.all(
              unknownCoverGames.map(game => {
                return downloadCover(game).then(gameCoverID => {
                  console.log("Scrapping..." + remainingCovers);
                  if (gameCoverID) {
                    results.find(
                      g => g.contentId === game.contentId
                    ).cover = `${gameCoverID}`;
                  }
                });
              })
            ).then(() => {
              const withCover = results
                .filter(game => game.cover !== null)
                .filter(game => game.type === "PS4")
                .filter(game => game.type === "Theme")
                .filter(game => game.type === "Avatar")
                .filter(game => game.type === "PSP")
                .filter(game => game.type === "PSVita")
                .filter(game => game.type === "EDAT");
              console.log(
                `Writing Database with ${results.length} entries ${
                  withCover.length
                } of them with cover`
              );
              fs.writeFileSync(
                path.resolve(__dirname, "../bdd/localstore-db.json"),
                JSON.stringify(results)
              );

              screenLog(
                `Writing Database with ${results.length} entries ${
                  withCover.length
                } of them with cover`
              );
              cb();
            });
          });
      }
    }
  );
};

function screenLog(text) {
  document.getElementById("ls-initialize-output").innerText = text;
}
