"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var compression_1 = __importDefault(require("compression"));
var express_1 = __importDefault(require("express"));
var fs_1 = __importDefault(require("fs"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var ip_1 = __importDefault(require("ip"));
var path_1 = __importDefault(require("path"));
var localstore_utils_1 = require("./localstore.utils");
var localstore_xmb_1 = require("./localstore.xmb");
var cache_1 = require("./mw/cache");
var downloads_1 = require("./mw/downloads");
var image_1 = require("./mw/image");
var install_1 = require("./mw/install");
var search_1 = require("./mw/search");
// const { getXMB } = require("./localstore.xmb");
var expressStatic = express_1.default.static;
var serverConfig;
function setupServer() {
    var app = express_1.default();
    app.use(compression_1.default());
    app.use("/public", expressStatic(__dirname + "/../public"));
    /* IMAGE */
    app.get("/image-proxy", cache_1.nocache, image_1.imageProxy);
    /* IMAGE */
    app.get("/localSTORE.xmb", cache_1.nocache, localstore_xmb_1.downloadXMBRootXML);
    /* SEARCH */
    app.get("/search", cache_1.nocache, search_1.search);
    /* INSTALL PKG */
    app.get("/rap", install_1.installRap);
    /* INSTALL PKG */
    app.get("/pkg", install_1.installPkg);
    /* GET PKG FOLDER DIRECTORY LISTING */
    app.get("/package-directory", install_1.listPackageFiles);
    app.get("/", cache_1.nocache, function (req, res) {
        res.redirect(localstore_utils_1.getServerHost(serverConfig) + "/public/localstore.html");
    });
    /* SERVER SIDE DOWNLOAS */
    app.get("/download", cache_1.nocache, downloads_1.downloadPkg);
    app.get("/download-progress", cache_1.nocache, downloads_1.getProgressResponse);
    app.get("/download-stop", cache_1.nocache, downloads_1.downloadStop);
    /* APP START LISTEN */
    return app.listen(serverConfig.port, function () {
        console.log("[localstore:// started] at: " + localstore_utils_1.getServerHost(serverConfig));
    });
}
function setupTempDownloadsFolder() {
    fs_extra_1.default.ensureDirSync(path_1.default.resolve(__dirname, serverConfig.downloadTmpDir));
}
function localstoreServer(callback) {
    serverConfig = localstore_utils_1.readConfig();
    serverConfig.ip = ip_1.default.address();
    if (!fs_1.default.existsSync(serverConfig.packagesFolder)) {
        serverConfig.packagesFolder = require("os").homedir();
    }
    localstore_utils_1.writeConfig(serverConfig);
    setupTempDownloadsFolder();
    downloads_1.startDownloadQueue();
    callback(setupServer(), serverConfig);
}
exports.localstoreServer = localstoreServer;
