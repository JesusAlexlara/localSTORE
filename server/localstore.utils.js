"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var localstore_directory_1 = require("./localstore.directory");
function byteHelper(value) {
    // https://gist.github.com/thomseddon/3511330
    var units = ["b", "kB", "MB", "GB", "TB"], number = Math.floor(Math.log(value) / Math.log(1024));
    return ((value / Math.pow(1024, Math.floor(number))).toFixed(1) +
        " " +
        units[number]);
}
exports.byteHelper = byteHelper;
exports.lsFileRegexp = /\[(.+?)\]-\[(ALL|US|EU|JP|HK)-(PS1|PS2|PS3|PSN|DEMO|C00|DLC|EDAT|MINI)\]-\[(([A-Z0-9]{6})-([A-Z0-9]{9})_[A-Z0-9]{2}-(.+?))\]-\[0x([0-9A-F]{32})\]/;
function getServerHost(serverConfig) {
    return "http://" + serverConfig.ip + ":" + serverConfig.port;
}
exports.getServerHost = getServerHost;
function readConfig() {
    return JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(__dirname, "./config.json"), "utf8"));
}
exports.readConfig = readConfig;
function writeConfig(serverConfig) {
    fs_1.default.writeFileSync(__dirname + "/config.json", JSON.stringify(serverConfig), "utf8");
}
exports.writeConfig = writeConfig;
function getDirectory(ip, serverConfig, localstoreDb) {
    return localstore_directory_1.getLocalStorePkgs(ip, serverConfig.packagesFolder, localstoreDb);
}
exports.getDirectory = getDirectory;
function objPath(path, obj) {
    return path.split(".").reduce(function (o, i) { return o[i]; }, obj);
}
exports.objPath = objPath;
function stripNonAscii(source) {
    return source.replace(/[^\x00-\x7F]/g, "");
}
exports.stripNonAscii = stripNonAscii;
function getScript(file) {
    var fileContents = fs_1.default.readFileSync(__dirname + "/offline-scripts/" + file + ".txt", "utf8");
    return fileContents;
}
exports.getScript = getScript;
