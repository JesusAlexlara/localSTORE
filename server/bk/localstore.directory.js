const fs = require("fs");
const path = require("path");
const jp = require("jsonpath");
const { app } = require("electron").remote;

const defaultLocale = "en";
const locales = require("../locales.json");
const avaliableLocales = Object.keys(locales);
const appLocale = app.getLocale().substr(0, 2);
const localeMap =
  locales[avaliableLocales.includes(appLocale) ? appLocale : defaultLocale];

const lsFileRegexp = /\[(.+?)\]-\[(ALL|US|EU|JP|HK)-(PS1|PS2|PS3|PSN|DEMO|C00|DLC|EDAT|MINI)\]-\[(([A-Z0-9]{6})-([A-Z0-9]{9})_[A-Z0-9]{2}-(.+?))\]-\[0x([0-9A-F]{32})\]/;

function getLocalStorePkgs(ip, folder, localstoreDb) {
  console.log("getlocal", ip);
  folder = path.resolve(__dirname, folder);
  return fs
    .readdirSync(folder)
    .filter(file => path.extname(file) === ".pkg" && file[0] !== ".")
    .filter(file => lsFileRegexp.test(file))
    .map(file => {
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

      console.log(file);
      const foundGame = jp.query(
        { games: localstoreDb },
        "$.games[?(@.contentId==='" +
          contentId +
          "' || @.productCode ==='" +
          productCode +
          "')]"
      );

      const isSource = file.indexOf("pkg_signed.pkg") === -1;
      const isSignedRap = file.indexOf("rif.pkg_signed.pkg") !== -1;
      const isSignedPkg = !isSignedRap && file.indexOf("pkg_signed.pkg") !== -1;

      if (foundGame && foundGame[0]) {
        const { name, region, type, productCode } = foundGame[0];
        return {
          file,
          name,
          type,
          region,
          productCode,
          isSource,
          isSignedPkg,
          isSignedRap,
          remoteIp: ip
        };
      }
      return {};
    });
}

function getDirectory(ip, serverConfig, localstoreDb) {
  return getLocalStorePkgs(ip, serverConfig.packagesFolder, localstoreDb);
}
module.exports = { getDirectory };
