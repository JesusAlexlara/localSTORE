// Modules to control application life and create native browser window

const { app, BrowserWindow } = require("electron");

const fs = require("fs");
const path = require("path");

const defaultLocale = "en";
const locales = require("./locales.json");
const avaliableLocales = Object.keys(locales);
const appLocale = app.getLocale().substr(0, 2);
const localeMap =
  locales[avaliableLocales.includes(appLocale) ? appLocale : defaultLocale];
const configPath = path.resolve(__dirname, "./server/config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function getPendingDownloads() {
  return JSON.parse(fs.readFileSync(__dirname + "/server/downloads.json"))
    .downloads.length;
}

function createWindow() {
  // Create the browser window.
  console.log("process.platform", process.platform);
  mainWindow = new BrowserWindow({
    width: 760,
    height: process.platform !== "darwin" ? 118 : 110,
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

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");
  // Open the DevTools.
  if (config.isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  mainWindow.on("closed", function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  app.quit();
});

app.on("activate", function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
