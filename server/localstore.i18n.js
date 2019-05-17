"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _a = require("electron").remote, dialog = _a.dialog, app = _a.app;
var defaultLocale = "en";
var locales = require("./locales.json");
var avaliableLocales = Object.keys(locales);
var appLocale = app.getLocale().substr(0, 2);
var localeMap = locales[avaliableLocales.includes(appLocale) ? appLocale : defaultLocale];
function getLocaleMap() {
    return localeMap;
}
exports.getLocaleMap = getLocaleMap;
