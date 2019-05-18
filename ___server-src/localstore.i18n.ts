const { dialog, app } = require("electron").remote;

const defaultLocale = "en";
const locales = require("./locales.json");
const avaliableLocales = Object.keys(locales);
const appLocale = app.getLocale().substr(0, 2);
const localeMap =
  locales[avaliableLocales.includes(appLocale) ? appLocale : defaultLocale];

export function getLocaleMap() {
  return localeMap;
}
