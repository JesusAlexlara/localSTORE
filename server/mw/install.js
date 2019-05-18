"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var localstore_db_1 = require("../localstore.db");
var localstore_utils_1 = require("../localstore.utils");
function readConfig() {
    return JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(__dirname, "../config.json"), "utf8"));
}
var serverConfig = readConfig();
var localstoreDb;
function installRap(req, res) {
    var _a = req.query, rap = _a.rap, contentId = _a.contentId;
    var bufferRap = Buffer.from(rap.match(/[A-F0-9]{2}/g).map(function (value) { return parseInt(value, 16); }));
    var rapFile = path_1.default.resolve(__dirname, "../raps/" + contentId + ".rap");
    res.set({
        "Content-Disposition": "attachment; filename=" + contentId + ".rap",
        "Content-Type": "application/octet-stream"
    });
    fs_1.default.writeFile(rapFile, bufferRap, "binary", function (err) {
        res.download(rapFile);
    });
}
exports.installRap = installRap;
function installPkg(req, res) {
    serverConfig = readConfig();
    var pkg = req.query.pkg;
    var file = path_1.default.resolve(__dirname, serverConfig.packagesFolder, pkg);
    res.set({
        "Content-Disposition": "attachment; filename=pkg",
        "Content-Type": "application/octet-stream"
    });
    res.download(file);
}
exports.installPkg = installPkg;
function listPackageFiles(req, res) {
    var remoteIp = req.ip.replace("::ffff:", "");
    serverConfig = readConfig();
    if (!localstoreDb) {
        localstoreDb = localstore_db_1.getLocalStoreDb();
    }
    var _a = req.query, action = _a.action, file = _a.file;
    switch (action) {
        case "list":
            res.status(200).json(localstore_utils_1.getDirectory(remoteIp, serverConfig, localstoreDb));
            break;
        case "delete":
            fs_1.default.unlink(path_1.default.resolve(__dirname, serverConfig.packagesFolder, file), function () {
                res
                    .status(200)
                    .json(localstore_utils_1.getDirectory(remoteIp, serverConfig, localstoreDb));
            });
            break;
    }
}
exports.listPackageFiles = listPackageFiles;
