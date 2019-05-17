"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var db = null;
function getLocalStoreDb() {
    if (db === null) {
        db = require("../bdd/localstore-db.json");
    }
    return db;
}
exports.getLocalStoreDb = getLocalStoreDb;
