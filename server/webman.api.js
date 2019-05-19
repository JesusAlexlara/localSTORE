"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request");
var fs = require("fs");
var path = require("path");
var ip = require("ip");
function readConfig() {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, "./config.json"), "utf8"));
}
exports.webmanAPI = {
    popup: function (ip, text, spacing) {
        if (spacing === void 0) { spacing = 39; }
        text += "\n" + "_".repeat(spacing);
        return "http://" + ip + "/popup.ps3/" + encodeURI(text);
    },
    openXMBItem: function (ip, col, segment) {
        if (col === void 0) { col = "game"; }
        if (segment === void 0) { segment = ""; }
        return "http://" + ip + "/play.ps3?col=" + col + "&seg=" + segment;
    },
    focusIndex: function (ip) {
        return "http://" + ip + "/browser.ps3$focus_segment_index%203";
    },
    open: function (ip) {
        return "http://" + ip + "/browser.ps3$open_list";
    },
    downloadRap: function (ip, rap, contentId) {
        var config = readConfig();
        return "http://" + ip + "/download.ps3?to=/dev_usb000/extdata&url=http://" + config.ip + ":" + config.port + "/rap?rap=" + rap + "&contentId=" + contentId;
    }
};
exports.webmanProxy = {
    proxy: function (url) {
        return new Promise(function (resolve, reject) {
            request(url, function () {
                resolve();
            });
        });
    }
};
