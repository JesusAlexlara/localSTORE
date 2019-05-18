import fs from "fs";
import jp from "jsonpath";
import path from "path";
import localesJSON from "./locales.json";

interface ServerConfig {
  downloadTmpDir: string;
  ip: string;
  packagesFolder: string;
  pendingDownloads: string;
  port: number;
  initialized: boolean;
  gametdb: boolean;
  isDev: boolean;
  ps3netservFolder: string;
  ps3netservPort: string;
}

const { app } = require("electron").remote;

const locales: { [key: string]: any } = localesJSON;

const defaultLocale = "en";
const avaliableLocales = Object.keys(locales);
const appLocale = app.getLocale().substr(0, 2);
const localeMap =
  locales[avaliableLocales.includes(appLocale) ? appLocale : defaultLocale];

const lsFileRegexp = /\[(.+?)\]-\[(ALL|US|EU|JP|HK)-(PS1|PS2|PS3|PSN|DEMO|C00|DLC|EDAT|MINI)\]-\[(([A-Z0-9]{6})-([A-Z0-9]{9})_[A-Z0-9]{2}-(.+?))\]-\[0x([0-9A-F]{32})\]/;

export function getLocalStorePkgs(
  ip: string,
  folder: string,
  localstoreDb: any
) {
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
      ] = file.match(lsFileRegexp) as RegExpMatchArray;

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
