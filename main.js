// Modules to control application life and create native browser window
const { stopPs3netServ } = require("./server/ls-ps3netsrv");
const { app, BrowserWindow } = require("electron");

const fs = require("fs");
const path = require("path");

const defaultLocale = "en";
const locales = require("./server/locales.json");
const avaliableLocales = Object.keys(locales);
const appLocale = app.getLocale().substr(0, 2);
const localeMap =
  locales[avaliableLocales.includes(appLocale) ? appLocale : defaultLocale];
const configPath = path.resolve(__dirname, "./server/config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

let mainWindow;

function getPendingDownloads() {
  return JSON.parse(fs.readFileSync(__dirname + "/server/downloads.json"))
    .downloads.length;
}

function createWindow() {
  // Create the browser window.
  console.log("process.platform", process.platform);
  mainWindow = new BrowserWindow({
    width: 600,
    height: process.platform !== "darwin" ? 218 : 210,
    resizable: false,
    titleBarStyle: "customButtonsOnHover",
    frame: true,
    show: false,
    title: "localSTORE",
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.webContents.on("did-finish-load", () => {
    setTimeout(() => {
      mainWindow.show();
    }, 500);
  });

  mainWindow.on("close", e => {
    const pending = getPendingDownloads();
    if (pending > 0) {
      var choice = require("electron").dialog.showMessageBox(mainWindow, {
        type: "question",
        buttons: [localeMap.app.yes, localeMap.app.no],
        title: localeMap.app.confirm,
        message: localeMap.app["error-pending-downloads"]
      });
      if (choice == 1) {
        e.preventDefault();
        return;
      }
    }
  });

  mainWindow.loadFile("server/index.html");

  if (config.isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", function() {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  app.quit();
});

app.on("before-quit", function() {
  stopPs3netServ();
});

app.on("activate", function() {
  if (mainWindow === null) createWindow();
});
