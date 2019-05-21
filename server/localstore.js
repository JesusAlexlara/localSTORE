"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
var localstore_server_1 = require("./localstore.server");
var localstore_utils_1 = require("./localstore.utils");
var localstore_xmb_1 = require("./localstore.xmb");
var _a = require("electron").remote, dialog = _a.dialog, app = _a.app;
// const { getPackageLink } = require("./server/localstore.xmb-pkg.js");
// const { getXMB } = require("./server/localstore.xmb.js");
var configPath = path_1.default.resolve(__dirname, "./config.json");
var psndl = require("../bdd/psndl-db");
var gametdb = require("../bdd/gametdb");
var getCurrentWindow = require("electron").remote.getCurrentWindow;
var ip = require("ip");
var ncp = require("ncp").ncp;
var _b = require("./ls-ps3netsrv.js"), startPs3netServ = _b.startPs3netServ, stopPs3netServ = _b.stopPs3netServ;
var defaultLocale = "en";
var locales = require("./locales.json");
var avaliableLocales = Object.keys(locales);
var appLocale = app.getLocale().substr(0, 2);
var localeMap = locales[avaliableLocales.includes(appLocale) ? appLocale : defaultLocale];
var config;
var serverRunning = false;
var ps3netsrvRunning = false;
var serverInstance;
var $;
function getServerIp(cb) {
    cb(ip.address());
}
function updateAddress() {
    if ($) {
        $.address.innerHTML = config.ip + " : " + config.port;
    }
}
function writeConfig() {
    getCurrentWindow().setTitle("localSTORE://  " + config.ip + " : " + config.port);
    updateAddress();
    fs_1.default.writeFileSync(configPath, JSON.stringify(config), "utf8");
}
function startServer(startServerCallback) {
    if (!serverRunning) {
        localstore_server_1.localstoreServer(function (app, serverConfig) {
            serverInstance = app;
            var port = serverConfig.port;
            $.serverPort.value = port;
            $.onOff.classList.add("active");
            serverRunning = true;
            if (startServerCallback && typeof startServerCallback === "function") {
                startServerCallback();
            }
        });
    }
}
function stopServer() {
    if (serverRunning) {
        serverInstance.close();
    }
    $.onOff.classList.remove("active");
    serverRunning = false;
    console.log("[localstore:// stopped]");
}
function reloadServer() {
    stopServer();
    startServer();
}
function usbTargetSelected(event) {
    var usbFolder = dialog.showOpenDialog({
        properties: ["openDirectory"]
    });
    if (!usbFolder) {
        return;
    }
    $.output.style.display = "block";
    $.output.innerHTML = localeMap.app["usb-write"];
    // create exData usb000 folder
    var exdataFolder = path_1.default.resolve(usbFolder[0], "exdata");
    fs_extra_1.default.ensureDirSync(exdataFolder);
    // create main localSTORE folder
    var localSTOREFolder = path_1.default.resolve(usbFolder[0], "localSTORE");
    fs_extra_1.default.ensureDirSync(localSTOREFolder);
    // create main localSTORE folder
    var favsFolder = path_1.default.resolve(usbFolder[0], "localSTORE/favs");
    fs_extra_1.default.ensureDirSync(favsFolder);
    ncp(path_1.default.resolve(__dirname, "../public/img/xmb"), path_1.default.resolve(usbFolder[0] + "/localSTORE/xmb"), function () {
        fs_1.default.writeFileSync(path_1.default.resolve(usbFolder[0] + "/localSTORE/localSTORE.xmb"), localstore_xmb_1.getXMBRootXML(), "utf8");
        fs_1.default.writeFileSync(path_1.default.resolve(usbFolder[0] + "/package_link.xml"), localstore_xmb_1.getXMBRootXML(), "utf8");
        $.output.innerHTML = localeMap.app["usb-ready"];
        $.output.style.display = "block";
        setTimeout(function () {
            $.output.style.display = "none";
        }, 3500);
        updateUIStatus();
    });
}
function pkgTargetSelected(event) {
    var folder = dialog.showOpenDialog({
        properties: ["openDirectory"]
    });
    if (!folder) {
        return;
    }
    config.packagesFolder = folder[0];
    updateUIStatus();
    writeConfig();
    reloadServer();
}
function ps3netsrvTargetSelected(event) {
    var folder = dialog.showOpenDialog({
        properties: ["openDirectory"]
    });
    if (!folder) {
        return;
    }
    config.ps3netservFolder = folder[0];
    updatePS3NetServUIStatus();
    writeConfig();
    updatePs3netsrvPort();
}
function selectAct() {
    var actFile = dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "act.dat", extensions: ["dat", "DAT"] }]
    });
    if (actFile && actFile[0]) {
        var userData = app.getPath("userData");
        fs_extra_1.default.copySync(actFile[0], userData + "/act.dat");
        updateUIStatus();
    }
}
function selectIdps() {
    var idpsFile = dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "idps.hex", extensions: ["hex", "HEX"] }]
    });
    if (idpsFile && idpsFile[0]) {
        var userData = app.getPath("userData");
        fs_extra_1.default.copySync(idpsFile[0], userData + "/idps.hex");
        updateUIStatus();
    }
}
function forceDatabaseReload() {
    stopServer();
    config = localstore_utils_1.readConfig();
    config.initialized = false;
    writeConfig();
    getCurrentWindow().reload();
}
function initializeSelectors() {
    $ = {
        storageFile: document.getElementById("ls-storage-button"),
        ps3StorageFile: document.getElementById("ls-ps3netserv-storage-button"),
        usbFile: document.getElementById("ls-usb-button"),
        onOff: document.getElementById("ls-button-onoff"),
        reloadDb: document.getElementById("ls-button-reload"),
        serverPort: document.getElementById("ls-server-port"),
        output: document.getElementById("ls-initialize-output"),
        address: document.getElementById("ls-port-output"),
        // setAct: document.getElementById("ls-set-act"),
        // setIdps: document.getElementById("ls-set-idps"),
        body: document.body,
        i18nTitles: document.querySelectorAll("[i18n-title]"),
        i18n: document.querySelectorAll("[i18n]"),
        ps3netservOnOff: document.getElementById("ls-ps3netsrv-onoff"),
        ps3netservPort: document.getElementById("ls-ps3netserv-port")
    };
    $.i18nTitles.forEach(function (el) {
        var attrValue = el.getAttribute("i18n-title");
        el.setAttribute("title", objPath(attrValue, localeMap));
    });
    $.i18n.forEach(function (el) {
        var attrValue = el.getAttribute("i18n");
        el.innerHTML = objPath(attrValue, localeMap);
    });
}
function objPath(path, obj) {
    return path.split(".").reduce(function (o, i) { return o[i]; }, obj);
}
function updateServerPort() {
    var port = parseInt($.serverPort.value, 10);
    if (!isNaN(port) && port > 1024 && port < 65536) {
        config.port = port;
        writeConfig();
        updateUIStatus();
        if (serverRunning) {
            reloadServer();
        }
        else {
            startServer();
        }
    }
    else {
        $.serverPort.value = config.port;
    }
}
function initializeEvents() {
    $.storageFile.addEventListener("click", pkgTargetSelected);
    $.ps3StorageFile.addEventListener("click", ps3netsrvTargetSelected);
    $.usbFile.addEventListener("click", usbTargetSelected);
    $.onOff.addEventListener("click", function () {
        if (serverRunning) {
            $.onOff.classList.add("active");
            stopServer();
            return;
        }
        $.onOff.classList.remove("active");
        startServer();
    });
    $.reloadDb.addEventListener("click", forceDatabaseReload);
    $.serverPort.addEventListener("blur", updateServerPort);
    $.serverPort.addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
            updateServerPort();
        }
    });
    // $.setAct.addEventListener("click", selectAct);
    // $.setIdps.addEventListener("click", selectIdps);
    $.ps3netservPort.addEventListener("blur", updatePs3netsrvPort);
    $.ps3netservPort.addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
            updatePs3netsrvPort();
        }
    });
    $.ps3netservOnOff.addEventListener("click", togglePs3NetServ);
}
function togglePs3NetServ() {
    if (ps3netsrvRunning) {
        $.ps3netservOnOff.classList.remove("active");
        ps3netsrvRunning = false;
        stopPs3netServ();
        return;
    }
    $.ps3netservOnOff.classList.add("active");
    startPs3netServ($.ps3netservPort.value);
    ps3netsrvRunning = true;
}
function updatePs3netsrvPort() {
    if (ps3netsrvRunning) {
        $.ps3netservOnOff.classList.remove("active");
        ps3netsrvRunning = false;
        stopPs3netServ(function () {
            ps3netsrvRunning = true;
            $.ps3netservOnOff.classList.add("active");
            startPs3netServ($.ps3netservPort.value);
        });
        return;
    }
    ps3netsrvRunning = true;
    $.ps3netservOnOff.classList.add("active");
    startPs3netServ($.ps3netservPort.value);
}
function updateDatabase() {
    psndl(function () {
        config.initialized = true;
        writeConfig();
        main();
    });
}
function initializeUI() {
    var platform = require("os").platform();
    $.output.style.display = "none";
    if (platform === "darwin") {
        $.body.style.paddingTop = "32px";
    }
    updateUIStatus();
}
function updateUIStatus() {
    $.serverPort.value = config.port;
    $.onOff.style.display = "block";
}
function updatePS3NetServUIStatus() {
    $.ps3netservPort.value = config.ps3netservPort;
}
window.downloadPkgConfig = usbTargetSelected;
window.updateDatabase = forceDatabaseReload;
window.startServer = startServer;
window.stopServer = stopServer;
function main() {
    config = localstore_utils_1.readConfig();
    var desktop = path_1.default.join(require("os").homedir(), "Desktop");
    if (config.packagesFolder === "") {
        config.packagesFolder = desktop;
    }
    if (config.ps3netservFolder === "") {
        config.ps3netservFolder = desktop;
    }
    writeConfig();
    getServerIp(function (ip) {
        config.ip = ip;
        writeConfig();
        if (!config.initialized) {
            if (config.gametdb) {
                gametdb(function () {
                    updateDatabase();
                });
            }
            else {
                updateDatabase();
            }
        }
        else {
            initializeSelectors();
            initializeEvents();
            initializeUI();
            updateAddress();
            startServer();
        }
    });
}
main();
