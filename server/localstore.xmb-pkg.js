const fs = require("fs");
const { app } = require("electron").remote;

const defaultLocale = "en";
const locales = require("../locales.json");
const avaliableLocales = Object.keys(locales);
const appLocale = app.getLocale().substr(0, 2);
const localeMap =
  locales[avaliableLocales.includes(appLocale) ? appLocale : defaultLocale];

function objPath(path, obj) {
  return path.split(".").reduce((o, i) => o[i], obj);
}

function stripNonAscii(source) {
  return source.replace(/[^\x00-\x7F]/g, "");
}

function getServerHost(serverConfig) {
  return `http://${serverConfig.ip}:${serverConfig.port}`;
}

function getScript(file, replacements) {
  let fileContents = fs.readFileSync(
    __dirname + "/offline-scripts/" + file + ".txt",
    "utf8"
  );
  return fileContents;
}

const nodePackage = require("../package.json");

function getPackageLink(serverConfig) {
  return `
  <XMBML version="1.0">
    <View id="localSTORE">
        <Attributes>
            <Table key="localSTORE_root_icon">
                <Pair key="icon">
                    <String>/dev_usb000/localSTORE/localstore-app.png</String>
                </Pair>
                <Pair key="title">
                    <String>localSTORE</String>
                </Pair>
                <Pair key="info">
                    <String></String>
                </Pair>
                <Pair key="ingame">
                    <String>disable</String>
                </Pair>
            </Table>
        </Attributes>
        <Items>
            <Query class="type:x-xmb/folder-pixmap" key="localSTORE_root_icon" attr="localSTORE_root_icon" src="#localSTORE_main" />
        </Items>
    </View>
    <View id="localSTORE_main">
        <Attributes>
            <Table key="pkg_main">
                <Pair key="icon">
                    <String>/dev_usb000/localSTORE/localstore-app.png</String>
                </Pair>
                <Pair key="title">
                    <String>${objPath(
                      "xmb.root.localstore-title",
                      localeMap
                    )}</String>
                </Pair>
                <Pair key="info">
                    <String> v${nodePackage.version}   ${getServerHost(
    serverConfig
  ).replace("http://", "")}</String>
                </Pair>
                <Pair key="ingame">
                    <String>disable</String>
                </Pair>
            </Table>
            <Table key="js-reboot">
                <Pair key="icon">
                    <String>/dev_usb000/localSTORE/localstore-reboot.png</String>
                </Pair>
                <Pair key="title">
                    <String>${objPath(
                      "xmb.root.han-reboot-title",
                      localeMap
                    )}</String>
                </Pair>
                <Pair key="info">
                    <String>${objPath(
                      "xmb.root.han-reboot-info",
                      localeMap
                    )}</String>
                </Pair>
                <Pair key="module_name">
                    <String>webrender_plugin</String>
                </Pair>
                <Pair key="module_action">
                    <String>${getScript("reboot")}</String>
                </Pair>
            </Table>
            <Table key="js-han-enabler">
                <Pair key="icon">
                    <String>/dev_usb000/localSTORE/localstore-han-enabler.png</String>
                </Pair>
                <Pair key="title">
                    <String>${objPath(
                      "xmb.root.han-enabler-title",
                      localeMap
                    )}</String>
                </Pair>
                <Pair key="info">
                    <String>${objPath(
                      "xmb.root.han-enabler-info",
                      localeMap
                    )}</String>
                </Pair>
                <Pair key="module_name">
                    <String>webrender_plugin</String>
                </Pair>
                <Pair key="module_action">
                    <String>${getScript("han-enabler")}</String>
                </Pair>
            </Table>
            <Table key="js-hen-enabler">
                <Pair key="icon">
                    <String>/dev_usb000/localSTORE/localstore-hen-enabler.png</String>
                </Pair>
                <Pair key="title">
                    <String>${objPath(
                      "xmb.root.hen-enabler-title",
                      localeMap
                    )}</String>
                </Pair>
                <Pair key="info">
                    <String>${objPath(
                      "xmb.root.hen-enabler-info",
                      localeMap
                    )}</String>
                </Pair>
                <Pair key="module_name">
                    <String>webrender_plugin</String>
                </Pair>
                <Pair key="module_action">
                    <String>${getScript("hen-enabler")}</String>
                </Pair>
            </Table>
            <Table key="ls-quick-access-icon">
                <Pair key="icon">
                    <String>/dev_usb000/localSTORE/localstore-quick-access.png</String>
                </Pair>
                <Pair key="title">
                    <String>${objPath(
                      "xmb.root.localstore-shortcuts-title",
                      localeMap
                    )}</String>
                </Pair>
                <Pair key="info">
                    <String>${objPath(
                      "xmb.root.localstore-shortcuts-info",
                      localeMap
                    )}</String>
                </Pair>
                <Pair key="child">
                    <String>segment</String>
                </Pair>
                <Pair key="ingame">
                    <String>disable</String>
                </Pair>
            </Table>
        </Attributes>
        <Items>
            <Query class="type:x-xmb/folder-pixmap" key="pkg_main" attr="pkg_main" src="xmb://localhost/dev_usb000/localSTORE.xmb#pkg_items" />
            <Query class="type:x-xmb/module-action" key="js-hen-enabler" attr="js-hen-enabler"/>
            <Query class="type:x-xmb/module-action" key="js-han-enabler" attr="js-han-enabler"/>
            <Query class="type:x-xmb/module-action" key="js-reboot" attr="js-reboot"/>
            <Query class="type:x-xmb/folder-pixmap" key="ls-quick-access-icon" attr="ls-quick-access-icon" src="#ls_install_usb_path" />
        </Items>
    </View>
    <View id="ls_install_usb_path">
        <Items>
            <Query class="type:x-xmb/xmlpackagefolder" key="host_provider_usb0" src="host://localhost/q?path=/dev_usb000/favs&suffix=.pkg&subclass=x-host/package" />
            <Query class="type:x-xmb/xmlpackagefolder" key="host_provider_usb0" src="host://localhost/q?path=/dev_usb000/localSTORE/favs&suffix=.pkg&subclass=x-host/package" />
        </Items>
    </View>
</XMBML>`;
}
module.exports = { getPackageLink };
