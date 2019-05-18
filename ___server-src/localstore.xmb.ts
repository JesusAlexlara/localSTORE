import express from "express";
import { getLocaleMap } from "./localstore.i18n";
import {
  getScript,
  getServerHost,
  objPath,
  readConfig
} from "./localstore.utils";

const nodePackage = require("../package.json");

const localeMap = getLocaleMap();

const usbLocalStoreFolder = "/dev_usb000/localSTORE";
const usbXmbFolder = `${usbLocalStoreFolder}/xmb`;
const usbFavsFolder = `${usbLocalStoreFolder}/favs`;

const localStoreBrowserUrl = "";
const localStoreFileManagerUrl = "/public/file-manager.html";

function iconPath(icon: string) {
  return `${usbXmbFolder}/${icon}`;
}

function getRootEntry() {
  return `<View id="localSTORE">
    <Attributes>
        <Table key="localSTORE_root_icon">
            <Pair key="icon">
                <String>${iconPath("localstore-app.png")}</String>
            </Pair>
            <Pair key="title">
                <String></String>
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
</View>`;
}

function getLocalStoreMenu() {
  const serverConfig = readConfig();
  return `<View id="localSTORE_main">
    <Attributes>
        <Table key="localstore_browser">
            <Pair key="icon"><String>${iconPath(
              "localstore-app.png"
            )}</String></Pair>
            <Pair key="title"><String>${objPath(
              "xmb.localstore.localstore-title",
              localeMap
            )}</String></Pair>
            <Pair key="info"><String> v${
              nodePackage.version
            }   ${getServerHost(serverConfig).replace(
    "http://",
    ""
  )}</String></Pair>
            <Pair key="module_name"><String>webrender_plugin</String></Pair>
            <Pair key="module_action"><String>${getServerHost(
              serverConfig
            )}${localStoreBrowserUrl}</String></Pair>
        </Table>
        <Table key="localstore_file_manager">
            <Pair key="icon"><String>${iconPath(
              "localstore-games.png"
            )}</String></Pair>
            <Pair key="title"><String>${objPath(
              "xmb.localstore.manage-content-title",
              localeMap
            )}</String></Pair>
            <Pair key="info"><String>${objPath(
              "xmb.localstore.manage-content-info",
              localeMap
            )}</String></Pair>
            <Pair key="module_name"><String>webrender_plugin</String></Pair>
            <Pair key="module_action"><String>${getServerHost(
              serverConfig
            )}${localStoreFileManagerUrl}</String></Pair>
        </Table>
        <Table key="localstore_favs">
            <Pair key="icon">
                <String>${iconPath("localstore-quick-access.png")}</String>
            </Pair>
            <Pair key="title">
                <String>${objPath(
                  "xmb.localstore.localstore-shortcuts-title",
                  localeMap
                )}</String>
            </Pair>
            <Pair key="info">
                <String>${objPath(
                  "xmb.localstore.localstore-shortcuts-info",
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
        <Table key="localstore_reboot">
            <Pair key="icon">
                <String>${iconPath("localstore-reboot.png")}</String>
            </Pair>
            <Pair key="title">
                <String>${objPath(
                  "xmb.localstore.han-reboot-title",
                  localeMap
                )}</String>
            </Pair>
            <Pair key="info">
                <String>${objPath(
                  "xmb.localstore.han-reboot-info",
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
        <Table key="localstore_update_server">
            <Pair key="icon"><String>${iconPath(
              "localstore-settings.png"
            )}</String></Pair>
          <Pair key="title"><String>${objPath(
            "xmb.localstore.setup-server-title",
            localeMap
          )}</String></Pair>
          <Pair key="info"><String>${objPath(
            "xmb.localstore.setup-server-info",
            localeMap
          )}</String></Pair>
          <Pair key="module_name"><String>webrender_plugin</String></Pair>
          <Pair key="module_action"><String>${getScript(
            "update-server"
          )}</String></Pair>
        </Table>
        <Table key="localstore_changelog">
          <Pair key="icon"><String>${iconPath(
            "localstore-app.png"
          )}</String></Pair>
          <Pair key="title"><String>localSTORE v${
            nodePackage.version
          }</String></Pair>
          <Pair key="info"><String>${objPath(
            "xmb.localstore.changelog",
            localeMap
          )}</String></Pair>
        </Table>
    </Attributes>
    <Items>
        <Query class="type:x-xmb/module-action" key="localstore_browser" attr="localstore_browser" />
        <Query class="type:x-xmb/module-action" key="localstore_file_manager" attr="localstore_file_manager" />
        <Query class="type:x-xmb/module-action" key="localstore_update_server" attr="localstore_update_server" />
        <Item class="type:x-xmb/module-action" key="localstore_reboot" attr="localstore_reboot"/>
        <Query class="type:x-xmb/folder-pixmap" key="localstore_favs" attr="localstore_favs" src="#localstore_favs_menu" />
        <Query class="type:x-xmb/folder-pixmap" key="localstore_changelog" attr="localstore_changelog" src="#localstore_changelog_menu" />
    </Items>
</View>`;
}

function getChangelogMenu() {
  return `<View id="localstore_changelog_menu">
    <Attributes>
        <Table key="localstore_last_changes">
            <Pair key="icon"><String>${iconPath(
              "localstore-app.png"
            )}</String></Pair>
            <Pair key="title"><String>v${nodePackage.version}</String></Pair>
            <Pair key="info"><String>
・ Many thanks to @_TheCYB3R_ and @NanospeedGamer for Help & Testing

★ localSTORE Features
・ Browse, Download Games & Install Rap files directly in your PS3 Browser
・ Integrated ps3netsrv
・ Entry in GAME menu, based on HEN 2.1.0 category_game.xml
</String></Pair>
        </Table>
    </Attributes>
    <Items>
        <Query class="type:x-xmb/module-action" key="localstore_last_changes" attr="localstore_last_changes"/>
    </Items>
</View>`;
}

function getFavoritesMenu() {
  return `<View id="localstore_favs_menu">
    <Items>
        <Query class="type:x-xmb/xmlpackagefolder" key="host_provider_usb0" src="host://localhost/q?path=${usbFavsFolder}&suffix=.pkg&subclass=x-host/package" />
    </Items>
</View>`;
}
export function getXMBRootXML() {
  return `<XMBML version="1.0">${getRootEntry()}${getFavoritesMenu()}${getChangelogMenu()}${getLocalStoreMenu()}</XMBML>`;
}
export function downloadXMBRootXML(
  req: express.Request,
  res: express.Response
) {
  res.send(getXMBRootXML());
}
