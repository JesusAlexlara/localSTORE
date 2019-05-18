"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var tree_kill_1 = __importDefault(require("tree-kill"));
var currentPlatform = process.platform;
var ps3netsrvBinMap = {
    darwin: "ps3netsrv",
    win32: "ps3netsrv.exe"
};
var ps3netsrvBin = path_1.default.resolve(__dirname, "ps3netsrv/bin/" + currentPlatform + "/" + ps3netsrvBinMap[currentPlatform]);
var configPath = path_1.default.resolve(__dirname, "./config.json");
function readConfig() {
    return JSON.parse(fs_1.default.readFileSync(configPath, "utf8"));
}
var ps3netsetverInstance;
var config;
function startPs3netServ(port) {
    port = port || "38008";
    config = readConfig();
    console.log("SPAWN " + ps3netsrvBin + " " + config.ps3netservFolder + " " + port + " ");
    ps3netsetverInstance = child_process_1.spawn("" + ps3netsrvBin, [
        config.ps3netservFolder,
        port
    ]);
    fs_1.default.writeFileSync(path_1.default.resolve(__dirname, "ps3netsrv.pid"), JSON.stringify({
        pid: ps3netsetverInstance.pid
    }), "utf8");
}
exports.startPs3netServ = startPs3netServ;
function readPID() {
    return JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(__dirname, "ps3netsrv.pid"), "utf8"));
}
function stopPs3netServ(cb) {
    var pid = readPID();
    console.log(pid);
    if (pid && pid.pid) {
        console.log("entro");
        tree_kill_1.default(pid.pid, function (err) {
            ps3netsetverInstance = null;
            fs_1.default.writeFileSync(path_1.default.resolve(__dirname, "ps3netsrv.pid"), JSON.stringify({}), "utf8");
            console.log("prooceo fin");
            cb && cb();
        });
    }
    else {
        cb && cb();
    }
}
exports.stopPs3netServ = stopPs3netServ;
function getServerInstance() {
    console.log("getServerInstance", ps3netsetverInstance);
    return ps3netsetverInstance;
}
exports.getServerInstance = getServerInstance;
