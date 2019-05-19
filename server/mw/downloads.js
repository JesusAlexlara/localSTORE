"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var move_file_1 = __importDefault(require("move-file"));
var node_downloader_helper_1 = require("node-downloader-helper");
var path_1 = __importDefault(require("path"));
var localstore_utils_1 = require("../localstore.utils");
var webman_api_1 = require("../webman.api");
exports.downloadGlobal = {};
var serverConfig;
// PKG DOWNLOADS
function getPendingDownloads() {
    serverConfig = localstore_utils_1.readConfig();
    return JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(__dirname, "..", serverConfig.pendingDownloads), "utf8"));
}
exports.getPendingDownloads = getPendingDownloads;
function addDownload(_a, cb) {
    var fileName = _a.fileName, url = _a.url, contentId = _a.contentId, name = _a.name, rap = _a.rap, type = _a.type, region = _a.region, remoteIp = _a.remoteIp;
    serverConfig = localstore_utils_1.readConfig();
    var pendingDownloads = getPendingDownloads().downloads;
    if (pendingDownloads.filter(function (download) {
        download.url === url;
    }).length === 0) {
        fs_1.default.writeFileSync(path_1.default.resolve(__dirname, serverConfig.pendingDownloads), JSON.stringify({
            downloads: pendingDownloads.concat({
                fileName: fileName,
                url: url,
                contentId: contentId,
                name: name,
                rap: rap,
                type: type,
                region: region,
                remoteIp: remoteIp
            })
        }, null, 4));
        downloadFile({ fileName: fileName, url: url, contentId: contentId, name: name, rap: rap, type: type, region: region, remoteIp: remoteIp }, cb);
    }
    return true;
}
exports.addDownload = addDownload;
function removeDownload(contentId, cb) {
    serverConfig = localstore_utils_1.readConfig();
    exports.downloadGlobal[contentId].stop();
    delete exports.downloadGlobal[contentId];
    var pendingDownloads = getPendingDownloads().downloads.filter(function (pending) {
        return pending.contentId !== contentId;
    });
    fs_1.default.writeFileSync(path_1.default.resolve(__dirname, serverConfig.pendingDownloads), JSON.stringify({ downloads: pendingDownloads }, null, 4));
    cb();
}
exports.removeDownload = removeDownload;
function downloadFile(_a, cb) {
    var fileName = _a.fileName, url = _a.url, contentId = _a.contentId, name = _a.name, rap = _a.rap, type = _a.type, region = _a.region, remoteIp = _a.remoteIp;
    serverConfig = localstore_utils_1.readConfig();
    var dl = new node_downloader_helper_1.DownloaderHelper(url, path_1.default.resolve(__dirname, "..", serverConfig.downloadTmpDir), {
        override: true,
        fileName: fileName
    })
        .on("start", function () {
        dl.πname = name;
        dl.πcontentId = contentId;
        dl.πcompleted = false;
        dl.πresigner = 0;
        dl.πremoteIp = remoteIp;
    })
        .on("download", function () { })
        .on("progress", function (stats) {
        var progress = stats.progress.toFixed(1);
        var speed = localstore_utils_1.byteHelper(stats.speed);
        var downloaded = localstore_utils_1.byteHelper(stats.downloaded);
        var total = localstore_utils_1.byteHelper(stats.total);
        dl.πprogress = stats;
        dl.πname = name;
        dl.πcontentId = contentId;
        dl.πcompleted = false;
        dl.πresigner = 0;
        dl.πremoteIp = remoteIp;
    })
        .on("end", function () {
        dl.πprogress = { progress: 100, speed: 100, total: 100, downloaded: 100 };
        dl.πname = name;
        dl.πcontentId = contentId;
        dl.πcompleted = true;
        dl.πresigner = 0;
        dl.πremoteIp = remoteIp;
        removeDownloadedFile({
            fileName: fileName,
            url: url,
            contentId: contentId,
            name: name,
            rap: rap,
            type: type,
            region: region,
            remoteIp: remoteIp
        }, dl);
    })
        .on("error", function (_error) { })
        .on("pause", function () { })
        .on("resume", function () { })
        .on("stop", function () { })
        .on("stateChanged", function (_state) { });
    exports.downloadGlobal[contentId] = dl;
    dl.πname = name;
    dl.πcontentId = contentId;
    dl.πcompleted = false;
    dl.πremoteIp = remoteIp;
    dl.resume();
    cb && cb();
}
exports.downloadFile = downloadFile;
function removeDownloadedFile(_a, dl) {
    var fileName = _a.fileName, url = _a.url, contentId = _a.contentId, name = _a.name, rap = _a.rap, type = _a.type, region = _a.region;
    serverConfig = localstore_utils_1.readConfig();
    var currentDownloads = getPendingDownloads();
    var filtered = currentDownloads.downloads.filter(function (download) {
        return download.url !== url;
    });
    fs_1.default.writeFileSync(path_1.default.resolve(__dirname, serverConfig.pendingDownloads), JSON.stringify({ downloads: filtered }, null, 4));
    move_file_1.default.sync(path_1.default.resolve(__dirname, "..", serverConfig.downloadTmpDir, fileName), path_1.default.resolve(__dirname, serverConfig.packagesFolder, fileName));
    dl.πresigner = 2;
    notifyDownloadCompleted(dl.πremoteIp, dl.πname, dl.πcontentId);
    flushDownloads();
}
exports.removeDownloadedFile = removeDownloadedFile;
function downloadRapToUsb(ip, rap, contentId) {
    webman_api_1.webmanProxy.proxy(webman_api_1.webmanAPI.downloadRap(ip, rap, contentId));
}
exports.downloadRapToUsb = downloadRapToUsb;
function flushDownloads() {
    Object.keys(exports.downloadGlobal).forEach(function (key) {
        if (exports.downloadGlobal[key].πcompleted && exports.downloadGlobal[key].πresigner === 2) {
            delete exports.downloadGlobal[key];
        }
    });
}
exports.flushDownloads = flushDownloads;
function notifyDownloadCompleted(ip, name, contentId) {
    var productCode = contentId.split("-")[1].split("_")[0];
    setTimeout(function () {
        webman_api_1.webmanProxy.proxy(webman_api_1.webmanAPI.popup(ip, "\uF89C " + name + "\n\n" + productCode + " Avaliable to install"));
    }, 4000);
}
exports.notifyDownloadCompleted = notifyDownloadCompleted;
function startDownloadQueue() {
    var downloads = getPendingDownloads();
    downloads.downloads.forEach(function (download) {
        downloadFile(download);
    });
}
exports.startDownloadQueue = startDownloadQueue;
function getProgressResponse(req, res) {
    if (Object.keys(exports.downloadGlobal).length > 0) {
        var progress = Object.entries(exports.downloadGlobal).reduce(function (acc, _a) {
            var key = _a[0], value = _a[1];
            acc[key] = value.πprogress || undefined;
            if (acc[key]) {
                acc[key].name = value.πname;
                acc[key].contentId = value.πcontentId;
                acc[key].completed = value.πcompleted;
                acc[key].resigner = value.πresigner;
            }
            return acc;
        }, {});
        res.status(200).send(progress);
    }
    else {
        res.status(200).send({});
    }
}
exports.getProgressResponse = getProgressResponse;
function downloadPkg(req, res) {
    var remoteIp = req.ip.replace("::ffff:", "");
    if (req.query.data) {
        var _a = JSON.parse(Buffer.from(req.query.data, "base64").toString()), productCode = _a.productCode, contentId = _a.contentId, pkg = _a.pkg, name_1 = _a.name, rap = _a.rap, region = _a.region, type = _a.type;
        var fileName = "[" + name_1
            .replace(/[^\[\]a-zA-Z0-9\-\_]/g, "-")
            .replace(/--/g, "-") + "]-[" + region.toUpperCase() + "-" + type.toUpperCase() + "]-[" + contentId + "]" + (rap ? "-[0x" + rap + "]" : "") + ".pkg";
        addDownload({
            contentId: contentId === "" ? productCode : contentId,
            url: pkg,
            fileName: fileName,
            name: name_1,
            rap: rap,
            type: type,
            region: region,
            remoteIp: remoteIp
        }, function () {
            getProgressResponse(req, res);
        });
    }
}
exports.downloadPkg = downloadPkg;
function downloadStop(req, res) {
    if (req.query.contentId) {
        removeDownload(req.query.contentId, function () {
            getProgressResponse(req, res);
        });
    }
}
exports.downloadStop = downloadStop;
