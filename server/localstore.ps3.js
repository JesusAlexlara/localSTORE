"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var evilscan = require("evilscan");
var ip = require("ip");
var _a = ip.address().split("."), ip0 = _a[0], ip1 = _a[1];
function getPS3Ip() {
    var results;
    return new Promise(function (resolve, reject) {
        var options = {
            target: ip0 + "." + ip1 + ".0.0/24",
            port: "80",
            status: "TROU",
            banner: true
        };
        var scanner = new evilscan(options);
        scanner.on("result", function (data) {
            results = data;
        });
        scanner.on("error", function (err) {
            resolve({});
        });
        scanner.on("done", function () {
            console.log("err", results);
            if (results) {
                resolve(results);
                return;
            }
            resolve({});
        });
        scanner.run();
    });
}
exports.getPS3Ip = getPS3Ip;
getPS3Ip().then(function (result) {
    console.log(result.ip);
});
