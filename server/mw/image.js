"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var jsonpath_1 = __importDefault(require("jsonpath"));
var path_1 = __importDefault(require("path"));
var localstore_db_1 = require("../localstore.db");
var localstoreDb = localstore_db_1.getLocalStoreDb();
function resize(_a) {
    var file = _a.file, quality = _a.quality, _b = _a.sx, sx = _b === void 0 ? 0 : _b, _c = _a.sy, sy = _c === void 0 ? 0 : _c, sw = _a.sw, sh = _a.sh, dx = _a.dx, dy = _a.dy, dw = _a.dw, dh = _a.dh;
    return new Promise(function (resolve, reject) {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        var imageHolder = document.createElement("img");
        canvas.width = dw;
        canvas.height = dh;
        imageHolder.onload = function () {
            sw = imageHolder.width;
            sh = imageHolder.height;
            ctx.drawImage(imageHolder, sx, sy, sw, sh, dx, dy, dw, dh);
            resolve(canvas.toDataURL("image/jpg", quality).split(",")[1]);
        };
        imageHolder.src = file;
    });
}
exports.resize = resize;
function xmbGameIcon(_a) {
    var file = _a.file, quality = _a.quality, type = _a.type, signed = _a.signed;
    var typeMap = {
        PS1: "ps1",
        PS2: "ps2",
        PSN: "ps3",
        C00: "ps3",
        Demo: "ps3",
        DLC: "ps3",
        Mini: "psp",
        PSVita: "psvita",
        PSP: "psp"
    };
    return new Promise(function (resolve, reject) {
        var canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        var ctx = canvas.getContext("2d");
        var imageCover = document.createElement("img");
        var imageTemplate = document.createElement("img");
        var imageType = document.createElement("img");
        var imageSigned = document.createElement("img");
        // 243 281
        imageCover.onload = function () {
            ctx.drawImage(imageCover, 0, 0, 322, 388, 64, 45, 369, 393);
            imageTemplate.src = "../public/img/xmb-template/base.png";
        };
        imageTemplate.onload = function () {
            ctx.drawImage(imageTemplate, 0, 0);
            imageType.src = "../public/img/xmb-template/xmb-" + (typeMap[type] ||
                "ps1") + ".png";
        };
        imageType.onload = function () {
            ctx.drawImage(imageType, 0, 0);
            if (!signed) {
                resolve(canvas.toDataURL("image/jpg", quality).split(",")[1]);
            }
            else {
                imageSigned.src = "../public/img/xmb-template/signed-pkg.png";
            }
        };
        imageSigned.onload = function () {
            ctx.drawImage(imageSigned, 0, 0);
            resolve(canvas.toDataURL("image/jpg", quality).split(",")[1]);
        };
        imageCover.src = file;
    });
}
exports.xmbGameIcon = xmbGameIcon;
// image proxy middleware
function imageProxy(req, res) {
    var _a = req.query, productCode = _a.productCode, compact = _a.compact, signed = _a.signed;
    if (!productCode) {
        res.send({ error: "No image productCode provided" });
        return;
    }
    var file = path_1.default.resolve(__dirname, "../../public/img/product-covers/" + productCode + ".jpg");
    var noCover = path_1.default.resolve(__dirname, "../../public/img/cover-templates/no-cover.png");
    var gamesWithProductCodeResults = jsonpath_1.default.query({ games: localstoreDb }, "$.games[?(@.productCode==='" + productCode + "')]");
    if (fs_1.default.existsSync(file)) {
        if (compact === "true") {
            xmbGameIcon({
                signed: signed === "true",
                file: file,
                quality: 0.5,
                type: gamesWithProductCodeResults && gamesWithProductCodeResults[0]
                    ? gamesWithProductCodeResults[0].type
                    : "PS1"
            }).then(function (b64) {
                res.write(Buffer.from(b64, "base64"), "binary");
                res.end(null, "binary");
            });
        }
        else {
            res.sendFile(file);
        }
    }
    else {
        if (compact === "true") {
            xmbGameIcon({
                file: noCover,
                signed: signed === "true",
                quality: 0.5,
                type: gamesWithProductCodeResults && gamesWithProductCodeResults[0]
                    ? gamesWithProductCodeResults[0].type
                    : "PS1"
            }).then(function (b64) {
                res.write(Buffer.from(b64, "base64"), "binary");
                res.end(null, "binary");
            });
        }
        else {
            res.sendFile(noCover);
        }
    }
}
exports.imageProxy = imageProxy;
