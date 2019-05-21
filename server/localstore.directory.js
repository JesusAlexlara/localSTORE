"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var jsonpath_1 = __importDefault(require("jsonpath"));
var path_1 = __importDefault(require("path"));
var locales_json_1 = __importDefault(require("./locales.json"));
var app = require("electron").remote.app;
var locales = locales_json_1.default;
var defaultLocale = "en";
var avaliableLocales = Object.keys(locales);
var appLocale = app.getLocale().substr(0, 2);
var localeMap = locales[avaliableLocales.includes(appLocale) ? appLocale : defaultLocale];
var lsFileRegexpFull = /\[(.+?)\]-\[(ALL|US|EU|JP|HK)-(PS1|PS2|PS3|PSN|DEMO|C00|DLC|EDAT|MINI)\]-\[(([A-Z0-9]{6})-([A-Z0-9]{9})_[A-Z0-9]{2}(?:-(.+?))?)\](?:-\[0x([0-9A-F]{32})\])?/;
function getLocalStorePkgs(ip, folder, localstoreDb) {
    folder = path_1.default.resolve(__dirname, folder);
    return fs_1.default
        .readdirSync(folder)
        .filter(function (file) { return path_1.default.extname(file) === ".pkg" && file[0] !== "."; })
        .filter(function (file) { return lsFileRegexpFull.test(file); })
        .map(function (file) {
        var _a = file.match(lsFileRegexpFull), result = _a[0], name = _a[1], region = _a[2], type = _a[3], contentId = _a[4], productCodeName = _a[5], productCode = _a[6], productDetailName = _a[7], rap = _a[8];
        var foundGame = jsonpath_1.default.query({ games: localstoreDb }, "$.games[?(@.contentId==='" +
            contentId +
            "' || @.productCode ==='" +
            productCode +
            "')]");
        var isSource = file.indexOf("pkg_signed.pkg") === -1;
        var isSignedRap = file.indexOf("rif.pkg_signed.pkg") !== -1;
        var isSignedPkg = !isSignedRap && file.indexOf("pkg_signed.pkg") !== -1;
        if (foundGame && foundGame[0]) {
            var _b = foundGame[0], name_1 = _b.name, region_1 = _b.region, type_1 = _b.type, productCode_1 = _b.productCode;
            return {
                file: file,
                name: name_1,
                type: type_1,
                region: region_1,
                productCode: productCode_1,
                isSource: isSource,
                isSignedPkg: isSignedPkg,
                isSignedRap: isSignedRap,
                remoteIp: ip
            };
        }
        return {};
    });
}
exports.getLocalStorePkgs = getLocalStorePkgs;
