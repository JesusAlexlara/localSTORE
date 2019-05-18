import fs from "fs";
import fsExtra from "fs-extra";
import http from "http";
import path from "path";
import { localstoreServer } from "./localstore.server";
import { ServerConfig } from "./localstore.types";
import { readConfig } from "./localstore.utils";
import { getXMBRootXML } from "./localstore.xmb";

const { dialog, app } = require("electron").remote;

// const { getPackageLink } = require("./server/localstore.xmb-pkg.js");
// const { getXMB } = require("./server/localstore.xmb.js");

const configPath = path.resolve(__dirname, "./config.json");

const psndl = require("../bdd/psndl-db");
const gametdb = require("../bdd/gametdb");
const { getCurrentWindow } = require("electron").remote;
const ip = require("ip");
const ncp = require("ncp").ncp;

const { startPs3netServ, stopPs3netServ } = require("./ls-ps3netsrv.js");

const defaultLocale = "en";
const locales = require("./locales.json");
const avaliableLocales = Object.keys(locales);
const appLocale = app.getLocale().substr(0, 2);
const localeMap =
  locales[avaliableLocales.includes(appLocale) ? appLocale : defaultLocale];

let config: ServerConfig;
let serverRunning = false;
let ps3netsrvRunning = false;
let serverInstance: http.Server;
let $: any;

function getServerIp(cb: Function) {
  cb(ip.address());
}

function updateAddress() {
  if ($) {
    $.address.innerHTML = `${config.ip} : ${config.port}`;
  }
}

function writeConfig() {
  getCurrentWindow().setTitle(`localSTORE://  ${config.ip} : ${config.port}`);
  updateAddress();
  fs.writeFileSync(configPath, JSON.stringify(config), "utf8");
}

function startServer(startServerCallback?: Function) {
  if (!serverRunning) {
    localstoreServer((app: http.Server, serverConfig: ServerConfig) => {
      serverInstance = app;
      const { port } = serverConfig;
      $.serverPort.value = port;
      $.onOff.classList.add("active");
      serverRunning = true;
      if (startServerCallback && typeof startServerCallback === "function") {
        startServerCallback();
      }
    });
  }
}

function stopServer() {
  if (serverRunning) {
    serverInstance.close();
  }
  $.onOff.classList.remove("active");
  serverRunning = false;
  console.log("[localstore:// stopped]");
}

function reloadServer() {
  stopServer();
  startServer();
}

function usbTargetSelected(event: Event) {
  const usbFolder = dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  if (!usbFolder) {
    return;
  }
  $.output.style.display = "block";
  $.output.innerHTML = localeMap.app["usb-write"];

  // create exData usb000 folder
  const exdataFolder = path.resolve(usbFolder[0], "exdata");
  fsExtra.ensureDirSync(exdataFolder);

  // create main localSTORE folder
  const localSTOREFolder = path.resolve(usbFolder[0], "localSTORE");
  fsExtra.ensureDirSync(localSTOREFolder);

  // create main localSTORE folder
  const favsFolder = path.resolve(usbFolder[0], "localSTORE/favs");
  fsExtra.ensureDirSync(favsFolder);

  ncp(
    path.resolve(__dirname, "../installer"),
    path.resolve(path.resolve(usbFolder[0])),
    () => {
      ncp(
        path.resolve(__dirname, "../public/img/xmb"),
        path.resolve(usbFolder[0] + "/localSTORE/xmb"),
        () => {
          fs.writeFileSync(
            path.resolve(usbFolder[0] + "/localSTORE/localSTORE.xmb"),
            getXMBRootXML(),
            "utf8"
          );
          $.output.innerHTML = localeMap.app["usb-ready"];
          $.output.style.display = "block";
          setTimeout(() => {
            $.output.style.display = "none";
          }, 3500);
          updateUIStatus();
        }
      );
    }
  );
}

function pkgTargetSelected(event: Event) {
  const folder = dialog.showOpenDialog({
    properties: ["openDirectory"]
  });

  if (!folder) {
    return;
  }
  config.packagesFolder = folder[0];

  updateUIStatus();
  writeConfig();
  reloadServer();
}

function ps3netsrvTargetSelected(event: Event) {
  const folder = dialog.showOpenDialog({
    properties: ["openDirectory"]
  });

  if (!folder) {
    return;
  }
  config.ps3netservFolder = folder[0];
  updatePS3NetServUIStatus();
  writeConfig();
  updatePs3netsrvPort();
}

function selectAct() {
  const actFile = dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "act.dat", extensions: ["dat", "DAT"] }]
  });

  if (actFile && actFile[0]) {
    const userData = app.getPath("userData");
    fsExtra.copySync(actFile[0], userData + "/act.dat");
    updateUIStatus();
  }
}

function selectIdps() {
  const idpsFile = dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "idps.hex", extensions: ["hex", "HEX"] }]
  });

  if (idpsFile && idpsFile[0]) {
    const userData = app.getPath("userData");
    fsExtra.copySync(idpsFile[0], userData + "/idps.hex");
    updateUIStatus();
  }
}

function forceDatabaseReload() {
  stopServer();
  config = readConfig();
  config.initialized = false;
  writeConfig();
  getCurrentWindow().reload();
}

function initializeSelectors() {
  $ = {
    storageFile: document.getElementById("ls-storage-button"),
    ps3StorageFile: document.getElementById("ls-ps3netserv-storage-button"),
    usbFile: document.getElementById("ls-usb-button"),
    onOff: document.getElementById("ls-button-onoff"),
    reloadDb: document.getElementById("ls-button-reload"),
    serverPort: document.getElementById("ls-server-port"),
    output: document.getElementById("ls-initialize-output"),
    address: document.getElementById("ls-port-output"),
    // setAct: document.getElementById("ls-set-act"),
    // setIdps: document.getElementById("ls-set-idps"),
    body: document.body,
    i18nTitles: document.querySelectorAll("[i18n-title]"),
    i18n: document.querySelectorAll("[i18n]"),
    ps3netservOnOff: document.getElementById("ls-ps3netsrv-onoff"),
    ps3netservPort: document.getElementById("ls-ps3netserv-port")
  };

  $.i18nTitles.forEach((el: HTMLElement) => {
    const attrValue = el.getAttribute("i18n-title") as string;
    el.setAttribute("title", objPath(attrValue, localeMap));
  });
  $.i18n.forEach((el: HTMLElement) => {
    const attrValue = el.getAttribute("i18n") as string;
    el.innerHTML = objPath(attrValue, localeMap);
  });
}

function objPath(path: string, obj: any) {
  return path.split(".").reduce((o, i) => o[i], obj);
}

function updateServerPort() {
  const port = parseInt($.serverPort.value, 10);

  if (!isNaN(port) && port > 1024 && port < 65536) {
    config.port = port;
    writeConfig();
    updateUIStatus();
    if (serverRunning) {
      reloadServer();
    } else {
      startServer();
    }
  } else {
    $.serverPort.value = config.port;
  }
}

function initializeEvents() {
  $.storageFile.addEventListener("click", pkgTargetSelected);
  $.ps3StorageFile.addEventListener("click", ps3netsrvTargetSelected);
  $.usbFile.addEventListener("click", usbTargetSelected);
  $.onOff.addEventListener("click", () => {
    if (serverRunning) {
      $.onOff.classList.add("active");
      stopServer();
      return;
    }
    $.onOff.classList.remove("active");
    startServer();
  });
  $.reloadDb.addEventListener("click", forceDatabaseReload);
  $.serverPort.addEventListener("blur", updateServerPort);
  $.serverPort.addEventListener("keyup", function(event: KeyboardEvent) {
    if (event.key === "Enter") {
      updateServerPort();
    }
  });
  // $.setAct.addEventListener("click", selectAct);
  // $.setIdps.addEventListener("click", selectIdps);

  $.ps3netservPort.addEventListener("blur", updatePs3netsrvPort);
  $.ps3netservPort.addEventListener("keyup", function(event: KeyboardEvent) {
    if (event.key === "Enter") {
      updatePs3netsrvPort();
    }
  });
  $.ps3netservOnOff.addEventListener("click", togglePs3NetServ);
}

function togglePs3NetServ() {
  if (ps3netsrvRunning) {
    $.ps3netservOnOff.classList.remove("active");
    ps3netsrvRunning = false;
    stopPs3netServ();
    return;
  }
  $.ps3netservOnOff.classList.add("active");
  startPs3netServ($.ps3netservPort.value);
  ps3netsrvRunning = true;
}

function updatePs3netsrvPort() {
  if (ps3netsrvRunning) {
    $.ps3netservOnOff.classList.remove("active");
    ps3netsrvRunning = false;
    stopPs3netServ(() => {
      ps3netsrvRunning = true;
      $.ps3netservOnOff.classList.add("active");
      startPs3netServ($.ps3netservPort.value);
    });
    return;
  }
  ps3netsrvRunning = true;
  $.ps3netservOnOff.classList.add("active");
  startPs3netServ($.ps3netservPort.value);
}

function updateDatabase() {
  psndl(() => {
    config.initialized = true;
    writeConfig();
    main();
  });
}

function initializeUI() {
  const platform = require("os").platform();
  $.output.style.display = "none";
  if (platform === "darwin") {
    $.body.style.paddingTop = "32px";
  }
  updateUIStatus();
}

function updateUIStatus() {
  $.serverPort.value = config.port;
  $.onOff.style.display = "block";
}

function updatePS3NetServUIStatus() {
  $.ps3netservPort.value = config.ps3netservPort;
}

(window as any).downloadPkgConfig = usbTargetSelected;
(window as any).updateDatabase = forceDatabaseReload;
(window as any).startServer = startServer;
(window as any).stopServer = stopServer;

function main() {
  config = readConfig();
  const desktop = path.join(require("os").homedir(), "Desktop");

  if (config.packagesFolder === "") {
    config.packagesFolder = desktop;
  }
  if (config.ps3netservFolder === "") {
    config.ps3netservFolder = desktop;
  }
  writeConfig();

  getServerIp((ip: string) => {
    config.ip = ip;
    writeConfig();
    if (!config.initialized) {
      if (config.gametdb) {
        gametdb(() => {
          updateDatabase();
        });
      } else {
        updateDatabase();
      }
    } else {
      initializeSelectors();
      initializeEvents();
      initializeUI();
      updateAddress();
      startServer();
    }
  });
}

main();
