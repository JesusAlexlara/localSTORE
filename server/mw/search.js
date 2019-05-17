"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsonpath_1 = __importDefault(require("jsonpath"));
var localstore_db_1 = require("../localstore.db");
var localstore_statics_1 = require("../localstore.statics");
var localstoreDb = localstore_db_1.getLocalStoreDb();
// Seach Middleware
function search(req, res) {
    if (req.query.data) {
        var searchState = JSON.parse(Buffer.from(req.query.data, "base64").toString());
        var isFullSearch = searchState.query.length > 1;
        var storeOptions = searchState.searchOptions.store === "ALL"
            ? "(@.region==='US' || @.region==='EU' || @.region==='JP' || @.region==='HK')"
            : "@.region==='" + searchState.searchOptions.store + "'";
        var flagOptions = searchState.searchOptions.types.map(function (type) {
            return "@.type==='" + type + "'";
        });
        var flagQuery = flagOptions.length > 0 ? " && (" + flagOptions.join("||") + ")" : "";
        var queryOptions = isFullSearch
            ? " && @.name.toLowerCase().includes('" + searchState.query.toLowerCase() + "')"
            : searchState.query != "#"
                ? searchState.query === ""
                    ? ""
                    : " && @.name.charAt(0)===\"" + searchState.query + "\""
                : " && (@.name.charCodeAt(0)>=48 && @.name.charCodeAt(0) <= 57)";
        var searchQuery = queryOptions ? queryOptions : "";
        var path = "$.games[?(" + storeOptions + flagQuery + searchQuery + ")]";
        var results = jsonpath_1.default.query({ games: localstoreDb }, path);
        var total = results.length;
        var pages = Math.ceil(total / localstore_statics_1.pageSize);
        res.status(200).send({
            results: results.slice(searchState.page * localstore_statics_1.pageSize, searchState.page * localstore_statics_1.pageSize + localstore_statics_1.pageSize),
            pages: pages,
            total: total,
            page: searchState.page
        });
        return;
    }
    res.status(200).send({ error: "Invalid Params" });
}
exports.search = search;
