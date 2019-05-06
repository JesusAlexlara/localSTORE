const { dialog, app } = require("electron").remote;
const { getPackageLink } = require("./server/localstore.xmb-pkg.js");
const { getXMB } = require("./server/localstore.xmb.js");
const fs = require("fs");
const fsExtra = require("fs-extra");
const path = require("path");
const configPath = path.resolve(__dirname, "./server/config.json");
const localstoreServer = require("./server/localstore.server.js");
const psndl = require("./bdd/psndl-db");
const gametdb = require("./bdd/gametdb");
const { getCurrentWindow } = require("electron").remote;
const ip = require("ip");
const ncp = require("ncp").ncp;

const defaultLocale = "en";
const locales = require("./locales.json");
const avaliableLocales = Object.keys(locales);
const appLocale = app.getLocale().substr(0, 2);
const localeMap =
  locales[avaliableLocales.includes(appLocale) ? appLocale : defaultLocale];

let config;
let serverRunning = false;
let serverInstance;
let $;
let isActFilePresent = hasActFile();
let isIdpsFilePresent = hasIdpsFile();
function getServerIp(cb) {
  cb(ip.address());
}

function readConfig() {
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
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

function startServer(startServerCallback) {
  if (!serverRunning && isActFilePresent && isIdpsFilePresent) {
    localstoreServer((app, serverConfig) => {
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

function usbTargetSelected(event) {
  const usbFolder = dialog.showOpenDialog({
    properties: ["openDirectory"]
  });

  if (!usbFolder) {
    return;
  }
  $.output.style.display = "block";
  $.output.innerHTML = localeMap.app["usb-write"];

  ncp.limit = 16;

  ncp(
    path.resolve(__dirname, "public/img/xmb"),
    path.resolve(usbFolder[0] + "/localSTORE"),
    function(err) {
      if (err) {
        return console.error(err);
      }
      ncp(
        path.resolve(__dirname, "public/hen-files"),
        path.resolve(usbFolder[0] + "/localSTORE/hen-files"),
        function(err) {
          if (err) {
            return console.error(err);
          }
          getXMB(readConfig(), require("./bdd/localstore-db.json")).then(
            storeItemsXML => {
              const xml = getPackageLink(
                readConfig(),
                require("./bdd/localstore-db.json")
              );

              fs.writeFileSync(
                path.resolve(usbFolder[0] + "/localSTORE.xmb"),
                storeItemsXML,
                "utf8"
              );

              fs.writeFileSync(
                path.resolve(usbFolder[0] + "/localSTORE.xml"),
                xml,
                "utf8"
              );
              fs.writeFileSync(
                path.resolve(usbFolder[0] + "/package_link.xml"),
                xml.replace('id="localSTORE_main"', 'id="package_link"'),
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
  );
}

function pkgTargetSelected(event) {
  const folder = dialog.showOpenDialog({
    properties: ["openDirectory"]
  });

  if (!folder) {
    return;
  }
  config.packagesFolder = folder[0];

  checkResignerFolders(folder[0]);
  updateUIStatus();
  writeConfig();
  reloadServer();
}

function hasActFile() {
  return fsExtra.existsSync(app.getPath("userData") + "/act.dat");
}
function hasIdpsFile() {
  return fsExtra.existsSync(app.getPath("userData") + "/idps.hex");
}

function selectAct(id) {
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

function selectIdps(id) {
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

function checkResignerFolders(folder) {
  fsExtra.ensureDirSync(path.resolve(folder, "resigner/consoles/default"));
  fsExtra.ensureDirSync(path.resolve(folder, "resigner/input/pkgs"));
  fsExtra.ensureDirSync(path.resolve(folder, "resigner/input/raps"));
  fsExtra.ensureDirSync(path.resolve(folder, "resigner/output/pkgs"));
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
    usbFile: document.getElementById("ls-usb-button"),
    onOff: document.getElementById("ls-button-onoff"),
    reloadDb: document.getElementById("ls-button-reload"),
    serverPort: document.getElementById("ls-server-port"),
    output: document.getElementById("ls-initialize-output"),
    address: document.getElementById("ls-port-output"),
    setAct: document.getElementById("ls-set-act"),
    setIdps: document.getElementById("ls-set-idps"),
    body: document.body,
    i18nTitles: document.querySelectorAll("[i18n-title]"),
    i18n: document.querySelectorAll("[i18n]")
  };

  $.i18nTitles.forEach(el => {
    const attrValue = el.getAttribute("i18n-title");
    el.setAttribute("title", objPath(attrValue, localeMap));
  });
  $.i18n.forEach(el => {
    const attrValue = el.getAttribute("i18n");
    el.innerHTML = objPath(attrValue, localeMap);
  });
}

function objPath(path, obj) {
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
  $.usbFile.addEventListener("click", usbTargetSelected);
  $.onOff.addEventListener("click", e => {
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
  $.serverPort.addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
      updateServerPort();
    }
  });
  $.setAct.addEventListener("click", selectAct);
  $.setIdps.addEventListener("click", selectIdps);
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
  isActFilePresent = hasActFile();
  isIdpsFilePresent = hasIdpsFile();
  $.setAct.querySelector("svg").style.color = isActFilePresent
    ? "#32e819"
    : "#ff7c7c";
  $.setIdps.querySelector("svg").style.color = isIdpsFilePresent
    ? "#32e819"
    : "#ff7c7c";
  $.serverPort.value = config.port;
  $.onOff.style.display =
    isActFilePresent && isIdpsFilePresent ? "block" : "none";
}

window.downloadPkgConfig = usbTargetSelected;
window.updateDatabase = forceDatabaseReload;
window.startServer = startServer;
window.stopServer = stopServer;

function main() {
  config = readConfig();
  if (config.packagesFolder === "") {
    const desktop = path.join(require("os").homedir(), "Desktop");
    config.packagesFolder = desktop;
    writeConfig();
  }
  getServerIp(ip => {
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
