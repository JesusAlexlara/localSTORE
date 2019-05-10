const { DownloaderHelper } = require("node-downloader-helper");
const { getXMB } = require("./localstore.xmb");
const { getDirectory } = require("./localstore.directory");
const { resignPkgWithRap, resignRap } = require("./localstore.resigner");
const jp = require("jsonpath");
const compression = require("compression");
const express = require("express");
const fs = require("fs");
const fsExtra = require("fs-extra");
const moveFile = require("move-file");
const path = require("path");
const ip = require("ip");

function mkDirByPathSync(targetDir, { isRelativeToScript = false } = {}) {
  const sep = path.sep;
  const initDir = path.isAbsolute(targetDir) ? sep : "";
  const baseDir = isRelativeToScript ? __dirname : ".";

  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code === "EEXIST") {
        // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === "ENOENT") {
        // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }

      const caughtErr = ["EACCES", "EPERM", "EISDIR"].indexOf(err.code) > -1;
      if (!caughtErr || (caughtErr && curDir === path.resolve(targetDir))) {
        throw err; // Throw if it's just the last created dir.
      }
    }

    return curDir;
  }, initDir);
}

function readConfig() {
  return JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "./config.json"), "utf8")
  );
}

function writeConfig() {
  fs.writeFileSync(
    __dirname + "/config.json",
    JSON.stringify(serverConfig),
    "utf8"
  );
}

function byteHelper(value) {
  // https://gist.github.com/thomseddon/3511330
  const units = ["b", "kB", "MB", "GB", "TB"],
    number = Math.floor(Math.log(value) / Math.log(1024));
  return (
    (value / Math.pow(1024, Math.floor(number))).toFixed(1) +
    " " +
    units[number]
  );
}

const static = express.static;
const pageSize = 20;
const downloadGlobal = {};
let localstoreDb;
let serverConfig;

const lsFileRegexp = /\[(.+?)\]-\[(ALL|US|EU|JP|HK)-(PS1|PS2|PS3|PSN|DEMO|C00|DLC|EDAT|MINI)\]-\[(([A-Z0-9]{6})-([A-Z0-9]{9})_[A-Z0-9]{2}-(.+?))\]-\[0x([0-9A-F]{32})\]/;

function getServerHost() {
  return `http://${serverConfig.ip}:${serverConfig.port}`;
}

// PKG DOWNLOADS
function getDownloads() {
  return JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, serverConfig.pendingDownloads),
      "utf8"
    )
  );
}

function addDownload(
  { fileName, url, contentId, name, rap, type, region },
  cb
) {
  const pendingDownloads = getDownloads().downloads;
  if (
    pendingDownloads.filter(download => {
      download.url === url;
    }).length === 0
  ) {
    fs.writeFileSync(
      path.resolve(__dirname, serverConfig.pendingDownloads),
      JSON.stringify(
        {
          downloads: pendingDownloads.concat({
            fileName,
            url,
            contentId,
            name,
            rap,
            type,
            region
          })
        },
        null,
        4
      )
    );
    downloadFile({ fileName, url, contentId, name, rap, type, region }, cb);
  }

  return true;
}

function removeDownload(contentId, cb) {
  downloadGlobal[contentId].stop();
  delete downloadGlobal[contentId];
  const pendingDownloads = getDownloads().downloads.filter(function(pending) {
    return pending.contentId !== contentId;
  });
  fs.writeFileSync(
    path.resolve(__dirname, serverConfig.pendingDownloads),
    JSON.stringify({ downloads: pendingDownloads }, null, 4)
  );
  cb();
}

function downloadFile(
  { fileName, url, contentId, name, rap, type, region },
  cb
) {
  const dl = new DownloaderHelper(
    url,
    path.resolve(__dirname, serverConfig.downloadTmpDir),
    {
      override: true,
      fileName: fileName
    }
  )
    .on("start", () => {
      dl.πname = name;
      dl.πcontentId = contentId;
      dl.πcompleted = false;
      dl.πresigner = 0;
    })
    .on("download", () => {})
    .on("progress", stats => {
      const progress = stats.progress.toFixed(1);
      const speed = byteHelper(stats.speed);
      const downloaded = byteHelper(stats.downloaded);
      const total = byteHelper(stats.total);

      dl.πprogress = stats;
      dl.πname = name;
      dl.πcontentId = contentId;
      dl.πcompleted = false;
      dl.πresigner = 0;
    })
    .on("end", () => {
      dl.πprogress = { progress: 100, speed: 100, total: 100, downloaded: 100 };
      dl.πname = name;
      dl.πcontentId = contentId;
      dl.πcompleted = true;
      dl.πresigner = 0;
      removeDownloadedFile(
        {
          fileName,
          url,
          contentId,
          name,
          rap,
          type,
          region
        },
        dl
      );
    })
    .on("error", error => {})
    .on("pause", () => {})
    .on("resume", () => {})
    .on("stop", () => {})
    .on("stateChanged", state => {});
  downloadGlobal[contentId] = dl;
  dl.πname = name;
  dl.πcontentId = contentId;
  dl.πcompleted = false;
  dl.resume();
  cb && cb();
}

function removeDownloadedFile(
  { fileName, url, contentId, name, rap, type, region },
  dl
) {
  const currentDownloads = getDownloads();
  const filtered = currentDownloads.downloads.filter(download => {
    return download.url !== url;
  });

  fs.writeFileSync(
    path.resolve(__dirname, serverConfig.pendingDownloads),
    JSON.stringify({ downloads: filtered }, null, 4)
  );

  switch (type) {
    case "PS1":
    case "PS2":
      dl.πresigner = 1;
      resignPkgWithRap(
        fileName,
        rap,
        contentId,
        serverConfig.downloadTmpDir
      ).then(({ stderr, stdout }) => {
        if (!stderr) {
          const signedFile = fileName.replace(".pkg", ".pkg_signed.pkg");
          const signedRapFile = fileName.replace(".pkg", ".rif.pkg_signed.pkg");

          moveFile.sync(
            path.resolve(
              serverConfig.packagesFolder,
              "resigner/input/pkgs/",
              fileName
            ),
            path.resolve(__dirname, serverConfig.packagesFolder, fileName)
          );

          moveFile.sync(
            path.resolve(
              serverConfig.packagesFolder,
              "resigner/output/pkgs/",
              signedFile
            ),
            path.resolve(__dirname, serverConfig.packagesFolder, signedFile)
          );

          moveFile.sync(
            path.resolve(
              serverConfig.packagesFolder,
              "resigner/output/pkgs/",
              signedRapFile
            ),
            path.resolve(__dirname, serverConfig.packagesFolder, signedRapFile)
          );

          dl.πresigner = 2;
        }
      });
      break;
    case "PSN":
    case "DLC":
      dl.πresigner = 1;
      resignRap(fileName, rap, contentId).then(({ stderr, stdout }) => {
        if (!stderr) {
          const signedRapFile = fileName.replace(".pkg", ".rif.pkg_signed.pkg");

          moveFile.sync(
            path.resolve(__dirname, serverConfig.downloadTmpDir, fileName),
            path.resolve(__dirname, serverConfig.packagesFolder, fileName)
          );

          moveFile.sync(
            path.resolve(
              serverConfig.packagesFolder,
              "resigner/output/pkgs/",
              signedRapFile
            ),
            path.resolve(__dirname, serverConfig.packagesFolder, signedRapFile)
          );

          dl.πresigner = 2;
        }
      });

      break;
    default:
      moveFile.sync(
        path.resolve(__dirname, serverConfig.downloadTmpDir, fileName),
        path.resolve(__dirname, serverConfig.packagesFolder, fileName)
      );
      dl.πresigner = 2;
      break;
  }
}

function startDownloadQueue() {
  const downloads = getDownloads();
  downloads.downloads.forEach(download => {
    downloadFile(download);
  });
}

// MIDDLEWARE
function getProgressResponse(req, res) {
  if (Object.keys(downloadGlobal).length > 0) {
    const progress = Object.entries(downloadGlobal).reduce(
      (acc, [key, value]) => {
        acc[key] = value.πprogress || undefined;
        if (acc[key]) {
          acc[key].name = value.πname;
          acc[key].contentId = value.πcontentId;
          acc[key].completed = value.πcompleted;
          acc[key].resigner = value.πresigner;
        }
        return acc;
      },
      {}
    );
    Object.keys(downloadGlobal).forEach(key => {
      if (
        downloadGlobal[key].πcompleted &&
        downloadGlobal[key].πresigner === 2
      ) {
        delete downloadGlobal[key];
      }
    });
    res.status(200).send(progress);
  } else {
    res.status(200).send({});
  }
}

// Seach Middleware
function search(req, res) {
  if (req.query.data) {
    const searchState = JSON.parse(
      Buffer.from(req.query.data, "base64").toString()
    );
    const isFullSearch = searchState.query.length > 1;

    const storeOptions =
      searchState.searchOptions.store === "ALL"
        ? `(@.region==='US' || @.region==='EU' || @.region==='JP' || @.region==='HK')`
        : `@.region==='${searchState.searchOptions.store}'`;

    const flagOptions = searchState.searchOptions.types.map(type => {
      return `@.type==='${type}'`;
    });

    const flagQuery =
      flagOptions.length > 0 ? ` && (${flagOptions.join("||")})` : "";

    const queryOptions = isFullSearch
      ? ` && @.name.toLowerCase().includes('${searchState.query.toLowerCase()}')`
      : searchState.query != "#"
      ? searchState.query === ""
        ? ""
        : ` && @.name.charAt(0)==="${searchState.query}"`
      : ` && (@.name.charCodeAt(0)>=48 && @.name.charCodeAt(0) <= 57)`;

    const searchQuery = queryOptions ? queryOptions : "";

    const path = `$.games[?(${storeOptions}${flagQuery}${searchQuery})]`;

    const results = jp.query({ games: localstoreDb }, path);
    const total = results.length;
    const pages = Math.ceil(total / pageSize);

    res.status(200).send({
      results: results.slice(
        searchState.page * pageSize,
        searchState.page * pageSize + pageSize
      ),
      pages,
      total,
      page: searchState.page
    });
    return;
  }
  res.status(200).send({ error: "Invalid Params" });
}

// image proxy middleware
function imageProxy(req, res) {
  const { productCode, compact, signed } = req.query;

  if (!productCode) {
    res.send({ error: "No image productCode provided" });
    return;
  }

  const file = path.resolve(
    __dirname,
    `../public/img/product-covers/${productCode}.jpg`
  );

  const noCover = path.resolve(
    __dirname,
    `../public/img/cover-templates/no-cover.png`
  );

  const gamesWithProductCodeResults = jp.query(
    { games: localstoreDb },
    `$.games[?(@.productCode==='${productCode}')]`
  );

  if (fs.existsSync(file)) {
    if (compact === "true") {
      xmbGameIcon({
        signed: signed === "true",
        file,
        quality: 0.5,
        type:
          gamesWithProductCodeResults && gamesWithProductCodeResults[0]
            ? gamesWithProductCodeResults[0].type
            : "PS1"
      }).then(b64 => {
        res.write(Buffer.from(b64, "base64"), "binary");
        res.end(null, "binary");
      });
    } else {
      res.sendFile(file);
    }
  } else {
    if (compact === "true") {
      xmbGameIcon({
        file: noCover,
        signed: signed === "true",
        quality: 0.5,
        type:
          gamesWithProductCodeResults && gamesWithProductCodeResults[0]
            ? gamesWithProductCodeResults[0].type
            : "PS1"
      }).then(b64 => {
        res.write(Buffer.from(b64, "base64"), "binary");
        res.end(null, "binary");
      });
    } else {
      res.sendFile(noCover);
    }
  }
}

// STARTUP

function nocache(req, res, next) {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  next();
}

function setupServer() {
  const app = express();
  localstoreDb = require("../bdd/localstore-db.json");

  app.use(compression());

  app.use("/public", static(__dirname + "/../public"));

  /* INSTALLER */
  app.get("/xmb-backup", (req, res) => {
    res.redirect(`${getServerHost()}/public/xmb-backup.html`);
  });
  app.get("/xmb-installer", (req, res) => {
    res.redirect(`${getServerHost()}/public/xmb-installer.html`);
  });
  app.get("/xmb-uninstaller", (req, res) => {
    res.redirect(
      `${getServerHost()}/public/xmb-installer.html?xml=category_game.xml.back`
    );
  });

  /* IMAGE */
  app.get("/image-proxy", nocache, imageProxy);

  /* SEARCH */
  app.get("/search", nocache, search);

  /* INSTALL PKG */
  app.get("/pkg", (req, res) => {
    const { pkg, remove } = req.query;
    const file = path.resolve(__dirname, serverConfig.packagesFolder, pkg);
    res.sendFile(file);
  });

  /* GET PKG FOLDER DIRECTORY LISTING */
  app.get("/package-directory", function(req, res) {
    serverConfig = JSON.parse(
      fs.readFileSync(__dirname + "/config.json", "utf8")
    );
    localstoreDb = localstoreDb || require("../bdd/localstore-db.json");
    const { action, file } = req.query;

    switch (action) {
      case "list":
        res.status(200).json(getDirectory(serverConfig, localstoreDb));

        break;
      case "delete":
        fs.unlink(
          path.resolve(__dirname, serverConfig.packagesFolder, file),
          () => {
            res.status(200).json(getDirectory(serverConfig, localstoreDb));
          }
        );
        break;
      case "resign":
        const [
          result,
          name,
          region,
          type,
          contentId,
          productCodeName,
          productCode,
          productDetailName,
          rap
        ] = file.match(lsFileRegexp);
        resignPkgWithRap(
          file,
          rap,
          contentId,
          serverConfig.packagesFolder
        ).then(() => {
          const signedFile = file.replace(".pkg", ".pkg_signed.pkg");
          const signedRapFile = file.replace(".pkg", ".rif.pkg_signed.pkg");

          moveFile.sync(
            path.resolve(
              serverConfig.packagesFolder,
              "resigner/input/pkgs/",
              file
            ),
            path.resolve(__dirname, serverConfig.packagesFolder, file)
          );

          moveFile.sync(
            path.resolve(
              serverConfig.packagesFolder,
              "resigner/output/pkgs/",
              signedFile
            ),
            path.resolve(__dirname, serverConfig.packagesFolder, signedFile)
          );

          moveFile.sync(
            path.resolve(
              serverConfig.packagesFolder,
              "resigner/output/pkgs/",
              signedRapFile
            ),
            path.resolve(__dirname, serverConfig.packagesFolder, signedRapFile)
          );
          res.status(200).json(getDirectory(serverConfig, localstoreDb));
        });

        break;
    }
  });

  /* GET updated localSTORE.xmb */
  app.get("/package-link-download", function(req, res) {
    config = readConfig;
    localstoreDb = localstoreDb || require("../bdd/localstore-db.json");

    getXMB(
      JSON.parse(fs.readFileSync(__dirname + "/config.json", "utf8")),
      localstoreDb
    ).then(xml => {
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=localSTORE.xmb",
        "Content-Type",
        "application/octet-stream"
      );
      fs.writeFile(
        path.resolve(__dirname, "../localSTORE.xmb"),
        xml,
        "utf8",
        err => {
          res.download(path.resolve(__dirname, "../localSTORE.xmb"));
        }
      );
    });
  });

  app.get("/", nocache, function(req, res) {
    res.redirect(`${getServerHost()}/public/localstore.html`);
  });

  /* SERVER SIDE DOWNLOAS */
  app.get("/download", nocache, (req, res) => {
    if (req.query.data) {
      const {
        productCode,
        contentId,
        pkg,
        name,
        rap,
        region,
        type
      } = JSON.parse(Buffer.from(req.query.data, "base64").toString());

      const fileName = `[${name
        .replace(/[^\[\]a-zA-Z0-9\-\_]/g, "-")
        .replace(
          /--/g,
          "-"
        )}]-[${region.toUpperCase()}-${type.toUpperCase()}]-[${contentId}]${
        rap ? `-[0x${rap}]` : ""
      }.pkg`;

      addDownload(
        {
          contentId: contentId === "" ? productCode : contentId,
          url: pkg,
          fileName,
          name,
          rap,
          type,
          region
        },
        () => {
          getProgressResponse(req, res);
        }
      );
    }
  });

  app.get("/download-progress", nocache, getProgressResponse);

  app.get("/download-stop", nocache, function(req, resp) {
    if (req.query.contentId) {
      removeDownload(req.query.contentId, function() {
        getProgressResponse(req, resp);
      });
    }
  });

  /* APP START LISTEN */
  return app.listen(serverConfig.port, () => {
    console.log(`[localstore:// started] at: ${getServerHost()}`);
  });
}

function setupTempDownloadsFolder() {
  // mkDirByPathSync(path.resolve(__dirname, serverConfig.downloadTmpDir));
  fsExtra.ensureDirSync(path.resolve(__dirname, serverConfig.downloadTmpDir));
}

function main(callback) {
  serverConfig = JSON.parse(
    fs.readFileSync(__dirname + "/config.json", "utf8")
  );

  serverConfig.ip = ip.address();
  if (!fs.existsSync(serverConfig.packagesFolder)) {
    serverConfig.packagesFolder = require("os").homedir();
  }
  writeConfig();

  setupTempDownloadsFolder();
  startDownloadQueue();

  callback(setupServer(), serverConfig);
}

function resize({ file, quality, sx = 0, sy = 0, sw, sh, dx, dy, dw, dh }) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const imageHolder = document.createElement("img");
    canvas.width = dw;
    canvas.height = dh;
    imageHolder.onload = () => {
      sw = imageHolder.width;
      sh = imageHolder.height;
      ctx.drawImage(imageHolder, sx, sy, sw, sh, dx, dy, dw, dh);
      resolve(canvas.toDataURL("image/jpg", quality).split(",")[1]);
    };
    imageHolder.src = file;
  });
}

function xmbGameIcon({ file, quality, type, signed }) {
  const typeMap = {
    PS1: "ps1",
    PS2: "ps2",
    PSN: "ps3",
    C00: "ps3",
    Demo: "ps3",
    DLC: "ps3",
    Mini: "psp",
    PSVita: "psvita",
    PSP: "psp"
  };
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const imageCover = document.createElement("img");
    const imageTemplate = document.createElement("img");
    const imageType = document.createElement("img");
    const imageSigned = document.createElement("img");
    // 243 281
    imageCover.onload = () => {
      sw = imageCover.width;
      sh = imageCover.height;
      ctx.drawImage(imageCover, 0, 0, 322, 388, 64, 45, 369, 393);
      imageTemplate.src = `public/img/xmb-template/base.png`;
    };
    imageTemplate.onload = () => {
      ctx.drawImage(imageTemplate, 0, 0);
      imageType.src = `public/img/xmb-template/xmb-${typeMap[type] ||
        "ps1"}.png`;
    };

    imageType.onload = () => {
      ctx.drawImage(imageType, 0, 0);
      if (!signed) {
        resolve(canvas.toDataURL("image/jpg", quality).split(",")[1]);
      } else {
        imageSigned.src = "public/img/xmb-template/signed-pkg.png";
      }
    };

    imageSigned.onload = () => {
      ctx.drawImage(imageSigned, 0, 0);
      resolve(canvas.toDataURL("image/jpg", quality).split(",")[1]);
    };

    imageCover.src = file;
  });
}

module.exports = main;
