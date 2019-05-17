"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
function getRootEntry() {
    return "<View id=\"localSTORE\">\n    <Attributes>\n        <Table key=\"localSTORE_root_icon\">\n            <Pair key=\"icon\">\n                <String>" + iconPath("localstore-app.png") + "</String>\n            </Pair>\n            <Pair key=\"title\">\n                <String>localSTORE</String>\n            </Pair>\n            <Pair key=\"info\">\n                <String></String>\n            </Pair>\n            <Pair key=\"ingame\">\n                <String>disable</String>\n            </Pair>\n        </Table>\n    </Attributes>\n    <Items>\n        <Query class=\"type:x-xmb/folder-pixmap\" key=\"localSTORE_root_icon\" attr=\"localSTORE_root_icon\" src=\"#localSTORE_main\" />\n    </Items>\n</View>";
}
function getLocalStoreMenu() {
    var serverConfig = localstore_utils_1.readConfig();
    return "<View id=\"localSTORE_main\">\n    <Attributes>\n        <Table key=\"localstore_browser\">\n            <Pair key=\"icon\"><String>" + iconPath("localstore-app.png") + "</String></Pair>\n            <Pair key=\"title\"><String>" + localstore_utils_1.objPath("xmb.localstore.localstore-title", localeMap) + "</String></Pair>\n            <Pair key=\"info\"><String></String></Pair>\n            <Pair key=\"module_name\"><String>webrender_plugin</String></Pair>\n            <Pair key=\"module_action\"><String>" + localstore_utils_1.getServerHost(serverConfig) + localStoreBrowserUrl + "</String></Pair>\n        </Table>\n        <Table key=\"localstore_file_manager\">\n            <Pair key=\"icon\"><String>" + iconPath("localstore-alphabet-settings.png") + "</String></Pair>\n            <Pair key=\"title\"><String>" + localstore_utils_1.objPath("xmb.localstore.alpha-util-title", localeMap) + "</String></Pair>\n            <Pair key=\"info\"><String>" + localstore_utils_1.objPath("xmb.localstore.alpha-util-info", localeMap) + "</String></Pair>\n            <Pair key=\"module_name\"><String>webrender_plugin</String></Pair>\n            <Pair key=\"module_action\"><String>" + localstore_utils_1.getServerHost(serverConfig) + localStoreFileManagerUrl + "</String></Pair>\n        </Table>\n        <Table key=\"localstore_favs\">\n            <Pair key=\"icon\">\n                <String>" + iconPath("localstore-quick-access.png") + "</String>\n            </Pair>\n            <Pair key=\"title\">\n                <String>" + localstore_utils_1.objPath("xmb.root.localstore-shortcuts-title", localeMap) + "</String>\n            </Pair>\n            <Pair key=\"info\">\n                <String>" + localstore_utils_1.objPath("xmb.root.localstore-shortcuts-info", localeMap) + "</String>\n            </Pair>\n            <Pair key=\"child\">\n                <String>segment</String>\n            </Pair>\n            <Pair key=\"ingame\">\n                <String>disable</String>\n            </Pair>\n        </Table>\n        <Table key=\"localstore_reboot\">\n            <Pair key=\"icon\">\n                <String>" + iconPath("localstore-reboot.png") + "</String>\n            </Pair>\n            <Pair key=\"title\">\n                <String>" + localstore_utils_1.objPath("xmb.root.han-reboot-title", localeMap) + "</String>\n            </Pair>\n            <Pair key=\"info\">\n                <String>" + localstore_utils_1.objPath("xmb.root.han-reboot-info", localeMap) + "</String>\n            </Pair>\n            <Pair key=\"module_name\">\n                <String>webrender_plugin</String>\n            </Pair>\n            <Pair key=\"module_action\">\n                <String>" + localstore_utils_1.getScript("reboot") + "</String>\n            </Pair>\n        </Table>\n        <Table key=\"localstore_update_server\">\n            <Pair key=\"icon\"><String>$" + iconPath("localstore-settings.png") + "</String></Pair>\n          <Pair key=\"title\"><String>" + localstore_utils_1.objPath("xmb.localstore.update-server-xmb-title", localeMap) + "</String></Pair>\n          <Pair key=\"info\"><String>" + localstore_utils_1.objPath("xmb.localstore.update-server-xmb-title", localeMap) + "</String></Pair>\n          <Pair key=\"module_name\"><String>webrender_plugin</String></Pair>\n          <Pair key=\"module_action\"><String>" + localstore_utils_1.getScript("update-server") + "</String></Pair>\n        </Table>\n    </Attributes>\n    <Items>\n        <Query class=\"type:x-xmb/module-action\" key=\"localstore_browser\" attr=\"localstore_browser\" />\n        <Query class=\"type:x-xmb/module-action\" key=\"localstore_file_manager\" attr=\"localstore_file_manager\" />\n        <Query class=\"type:x-xmb/module-action\" key=\"localstore_update_server\" attr=\"localstore_update_server\" />\n        <Item class=\"type:x-xmb/module-action\" key=\"localstore_reboot\" attr=\"localstore_reboot\"/>\n        <Query class=\"type:x-xmb/folder-pixmap\" key=\"localstore_favs\" attr=\"localstore_favs\" src=\"#localstore_favs_menu\" />\n    </Items>\n</View>";
}
function getFavoritesMenu() {
    return "<View id=\"localstore_favs_menu\">\n    <Items>\n        <Query class=\"type:x-xmb/xmlpackagefolder\" key=\"host_provider_usb0\" src=\"host://localhost/q?path=" + usbFavsFolder + "&suffix=.pkg&subclass=x-host/package\" />\n    </Items>\n</View>";
}
function getXMBRootXML() {
    return "<XMBML version=\"1.0\">" + getRootEntry() + getFavoritesMenu() + getLocalStoreMenu() + "</XMBML>";
}
exports.getXMBRootXML = getXMBRootXML;
function downloadXMBRootXML(req, res) {
    res.send(getXMBRootXML());
}
exports.downloadXMBRootXML = downloadXMBRootXML;
