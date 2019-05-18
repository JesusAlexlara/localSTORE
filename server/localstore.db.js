"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var db = null;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
function getLocalStoreDb() {
    return JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(__dirname, "../bdd/localstore-db.json"), "utf8"));
}
exports.getLocalStoreDb = getLocalStoreDb;
