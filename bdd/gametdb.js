const fs = require("fs");
const url = require("url");
const path = require("path");
const request = require("request");
const unzipper = require("unzipper");
const wget = require("node-wget");

function screenLog(text) {
  document.getElementById("downloading-covers").innerText = text;
}

// prettier-ignore
const unpackOrder = [
    'US',
    'EN',
    'ES',
    'FR',
    'PT',
    'IT',
    'AU',
    'DE',
    'NL',
    'SE',
    'JA',
    'DK',
    // 'NO',
    // 'FI',
    // 'KO',
    // 'ZH'
];

if (!fs.existsSync(path.resolve(__dirname + "/covers"))) {
  fs.mkdirSync(path.resolve(__dirname + "/covers"));
}
if (!fs.existsSync(path.resolve(__dirname + "/covers/tmp"))) {
  fs.mkdirSync(path.resolve(__dirname + "/covers/tmp"));
}
if (!fs.existsSync(path.resolve(__dirname + "/covers/tmp/merged"))) {
  fs.mkdirSync(path.resolve(__dirname + "/covers/tmp/merged"));
}

function processDownloadedZips(zips) {
  console.log("Unzipping...");
  screenLog("Unzipping...");
  let remainingDownloads = zips.length;
  zips.forEach((zip, index) => {
    zip = zip.replace(/\"/g, "");
    const file = "./bdd/covers/tmp/" + zip.substring(zip.indexOf("=") + 1);
    const stream = fs.createReadStream(file).pipe(
      unzipper.Extract({
        path: path.resolve(__dirname + "/covers/tmp")
      })
    );
    stream.on("close", () => {
      remainingDownloads--;
      if (remainingDownloads === 0) {
        mergeFolders(zips);
      }
    });
  });
}

function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file, index) {
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}
function mergeFolders() {
  console.log("Normalizing...");
  screenLog("Normalizing...");
  let unpackOrderRemaining = unpackOrder.length;
  unpackOrder.reverse().forEach(country => {
    const files = fs.readdirSync(
      path.resolve(__dirname + "/covers/tmp/ps3/coverM/" + country)
    );
    let remainingFiles = files.length;
    files.forEach(file => {
      fs.copyFile(
        path.resolve(
          __dirname + "/covers/tmp/ps3/coverM/" + country + "/" + file
        ),
        path.resolve(__dirname + "/covers/tmp/merged/" + path.basename(file)),
        err => {
          if (err) {
            throw err;
          } else {
            remainingFiles--;
            if (remainingFiles === 0) {
              unpackOrderRemaining--;
            }
            if (unpackOrderRemaining === 0) {
              copyMerged();
            }
          }
        },
        fs.constants.COPYFILE_FICLONE_FORCE
      );
    });
  });
}

function copyMerged() {
  const mergedFiles = fs.readdirSync(
    path.resolve(__dirname + "/covers/tmp/merged")
  );
  fs.renameSync(
    path.resolve(__dirname + "/covers/tmp/merged"),
    path.resolve(__dirname + "/../public/img/product-covers")
  );

  deleteFolderRecursive(path.resolve(__dirname + "/covers/tmp/"));
  console.log("Done");
  screenLog("Done");
  processCallback();
}

let processCallback;
module.exports = function(callback) {
  deleteFolderRecursive(__dirname + "/../public/img/product-covers");
  processCallback = callback;
  request("https://www.gametdb.com/PS3/Downloads", (a, b, body) => {
    console.log("Downloading covers...");
    screenLog("Downloading covers...");
    const zips = body
      .match(
        /"(https:\/\/www.gametdb.com\/download.php\?FTP=GameTDB-ps3_coverM.+?)"/g
      )
      .filter(zip => {
        return unpackOrder.reduce((acc, country) => {
          if (!acc) {
            if (zip.indexOf("-" + country + "-") != -1) {
              return true;
            }
            return false;
          }
          return true;
        }, false);
      });
    let remainingDownloads = zips.length;

    zips.forEach(url => {
      url = url.replace(/\"/g, "");
      wget(
        {
          headers: { Referer: "https://www.gametdb.com/PS3/Downloads" },
          timeout: 400000,
          url,
          dest: "./bdd/covers/tmp/" + url.substring(url.indexOf("=") + 1)
        },
        () => {
          remainingDownloads--;

          setTimeout(() => {
            screenLog("Downloading covers..." + remainingDownloads);
          }, 0);

          if (remainingDownloads === 0) {
            processDownloadedZips(zips);
          }
        }
      );
    });
  });
};
