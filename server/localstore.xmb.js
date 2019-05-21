"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var localstore_i18n_1 = require("./localstore.i18n");
var localstore_utils_1 = require("./localstore.utils");
var nodePackage = require("../package.json");
var localeMap = localstore_i18n_1.getLocaleMap();
var usbLocalStoreFolder = "/dev_usb000/localSTORE";
var usbXmbFolder = usbLocalStoreFolder + "/xmb";
var usbFavsFolder = usbLocalStoreFolder + "/favs";
var localStoreBrowserUrl = "";
var localStoreFileManagerUrl = "/public/file-manager.html";
function iconPath(icon) {
    return usbXmbFolder + "/" + icon;
}
function readChangeLog() {
    return fs_1.default.readFileSync(path_1.default.resolve(__dirname, "../CHANGELOG.md"), "utf8");
}
function getRootEntry() {
    return "<View id=\"localSTORE\">\n    <Attributes>\n        <Table key=\"localSTORE_root_icon\">\n            <Pair key=\"icon\">\n                <String>" + iconPath("localstore-app.png") + "</String>\n            </Pair>\n            <Pair key=\"title\">\n                <String></String>\n            </Pair>\n            <Pair key=\"info\">\n                <String></String>\n            </Pair>\n            <Pair key=\"ingame\">\n                <String>disable</String>\n            </Pair>\n        </Table>\n    </Attributes>\n    <Items>\n        <Query class=\"type:x-xmb/folder-pixmap\" key=\"localSTORE_root_icon\" attr=\"localSTORE_root_icon\" src=\"#package_link\" />\n    </Items>\n</View>";
}
function getLocalStoreMenu() {
    var serverConfig = localstore_utils_1.readConfig();
    return "<View id=\"package_link\">\n    <Attributes>\n        <Table key=\"localstore_browser\">\n            <Pair key=\"icon\"><String>" + iconPath("localstore-app.png") + "</String></Pair>\n            <Pair key=\"title\"><String>" + localstore_utils_1.objPath("xmb.localstore.localstore-title", localeMap) + "</String></Pair>\n            <Pair key=\"info\"><String>\uF897 v" + nodePackage.version + "  \uF4A5 " + localstore_utils_1.getServerHost(serverConfig).replace("http://", "") + "</String></Pair>\n            <Pair key=\"module_name\"><String>webrender_plugin</String></Pair>\n            <Pair key=\"module_action\"><String>" + localstore_utils_1.getServerHost(serverConfig) + localStoreBrowserUrl + "</String></Pair>\n        </Table>\n        <Table key=\"localstore_file_manager\">\n            <Pair key=\"icon\"><String>" + iconPath("localstore-games.png") + "</String></Pair>\n            <Pair key=\"title\"><String>" + localstore_utils_1.objPath("xmb.localstore.manage-content-title", localeMap) + "</String></Pair>\n            <Pair key=\"info\"><String>" + localstore_utils_1.objPath("xmb.localstore.manage-content-info", localeMap) + "</String></Pair>\n            <Pair key=\"module_name\"><String>webrender_plugin</String></Pair>\n            <Pair key=\"module_action\"><String>" + localstore_utils_1.getServerHost(serverConfig) + localStoreFileManagerUrl + "</String></Pair>\n        </Table>\n        <Table key=\"localstore_favs\">\n            <Pair key=\"icon\">\n                <String>" + iconPath("localstore-quick-access.png") + "</String>\n            </Pair>\n            <Pair key=\"title\">\n                <String>" + localstore_utils_1.objPath("xmb.localstore.localstore-shortcuts-title", localeMap) + "</String>\n            </Pair>\n            <Pair key=\"info\">\n                <String>" + localstore_utils_1.objPath("xmb.localstore.localstore-shortcuts-info", localeMap) + "</String>\n            </Pair>\n            <Pair key=\"child\">\n                <String>segment</String>\n            </Pair>\n            <Pair key=\"ingame\">\n                <String>disable</String>\n            </Pair>\n        </Table>\n        <Table key=\"localstore_reboot\">\n            <Pair key=\"icon\">\n                <String>" + iconPath("localstore-reboot.png") + "</String>\n            </Pair>\n            <Pair key=\"title\">\n                <String>" + localstore_utils_1.objPath("xmb.localstore.han-reboot-title", localeMap) + "</String>\n            </Pair>\n            <Pair key=\"info\">\n                <String>" + localstore_utils_1.objPath("xmb.localstore.han-reboot-info", localeMap) + "</String>\n            </Pair>\n            <Pair key=\"module_name\">\n                <String>webrender_plugin</String>\n            </Pair>\n            <Pair key=\"module_action\">\n                <String>" + localstore_utils_1.getScript("reboot") + "</String>\n            </Pair>\n        </Table>\n        <Table key=\"localstore_update_server\">\n            <Pair key=\"icon\"><String>" + iconPath("localstore-settings.png") + "</String></Pair>\n          <Pair key=\"title\"><String>" + localstore_utils_1.objPath("xmb.localstore.setup-server-title", localeMap) + "</String></Pair>\n          <Pair key=\"info\"><String>" + localstore_utils_1.objPath("xmb.localstore.setup-server-info", localeMap) + "</String></Pair>\n          <Pair key=\"module_name\"><String>webrender_plugin</String></Pair>\n          <Pair key=\"module_action\"><String>" + localstore_utils_1.getScript("update-server") + "</String></Pair>\n        </Table>\n        <Table key=\"localstore_changelog\">\n          <Pair key=\"icon\"><String>" + iconPath("localstore-app.png") + "</String></Pair>\n          <Pair key=\"title\"><String>localSTORE v" + nodePackage.version + "</String></Pair>\n          <Pair key=\"info\"><String>" + localstore_utils_1.objPath("xmb.localstore.changelog", localeMap) + "</String></Pair>\n        </Table>\n    </Attributes>\n    <Items>\n        <Query class=\"type:x-xmb/module-action\" key=\"localstore_browser\" attr=\"localstore_browser\" />\n        <Query class=\"type:x-xmb/module-action\" key=\"localstore_file_manager\" attr=\"localstore_file_manager\" />\n        <Query class=\"type:x-xmb/module-action\" key=\"localstore_update_server\" attr=\"localstore_update_server\" />\n        <Item class=\"type:x-xmb/module-action\" key=\"localstore_reboot\" attr=\"localstore_reboot\"/>\n        <Query class=\"type:x-xmb/folder-pixmap\" key=\"localstore_favs\" attr=\"localstore_favs\" src=\"#localstore_favs_menu\" />\n        <Query class=\"type:x-xmb/folder-pixmap\" key=\"localstore_changelog\" attr=\"localstore_changelog\" src=\"#localstore_changelog_menu\" />\n    </Items>\n</View>";
}
function getChangelogMenu() {
    return "<View id=\"localstore_changelog_menu\">\n    <Attributes>\n        <Table key=\"localstore_last_changes\"> \n            <Pair key=\"icon\"><String>" + iconPath("localstore-app.png") + "</String></Pair>\n            <Pair key=\"title\"><String>v" + nodePackage.version + "</String></Pair>\n            <Pair key=\"info\"><String>" + readChangeLog() + "</String></Pair>\n        </Table>\n    </Attributes>\n    <Items>\n        <Query class=\"type:x-xmb/module-action\" key=\"localstore_last_changes\" attr=\"localstore_last_changes\"/>\n    </Items>\n</View>";
}
function getFavoritesMenu() {
    return "<View id=\"localstore_favs_menu\">\n    <Items>\n        <Query class=\"type:x-xmb/xmlpackagefolder\" key=\"host_provider_usb0\" src=\"host://localhost/q?path=" + usbFavsFolder + "&suffix=.pkg&subclass=x-host/package\" />\n    </Items>\n</View>";
}
function getXMBRootXML() {
    return "<XMBML version=\"1.0\">" + getRootEntry() + getFavoritesMenu() + getChangelogMenu() + getLocalStoreMenu() + "</XMBML>";
}
exports.getXMBRootXML = getXMBRootXML;
function downloadXMBRootXML(req, res) {
    res.send(getXMBRootXML());
}
exports.downloadXMBRootXML = downloadXMBRootXML;
