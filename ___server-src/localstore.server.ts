import compression from "compression";
import express from "express";
import fs from "fs";
import fsExtra from "fs-extra";
import ip from "ip";
import path from "path";
import { ServerConfig } from "./localstore.types";
import { getServerHost, readConfig, writeConfig } from "./localstore.utils";
import { downloadXMBRootXML } from "./localstore.xmb";
import { nocache } from "./mw/cache";
import {
  downloadPkg,
  downloadStop,
  getProgressResponse,
  startDownloadQueue
} from "./mw/downloads";
import { imageProxy } from "./mw/image";
import { installPkg, installRap, listPackageFiles } from "./mw/install";
import { search } from "./mw/search";
// const { getXMB } = require("./localstore.xmb");

const expressStatic = express.static;
let serverConfig: ServerConfig;

function setupServer() {
  const app: express.Application = express();

  app.use(compression());

  app.use("/public", expressStatic(__dirname + "/../public"));

  /* IMAGE */
  app.get("/image-proxy", nocache, imageProxy);

  /* IMAGE */
  app.get("/localSTORE.xmb", nocache, downloadXMBRootXML);
  app.get("/package_link.xml", nocache, downloadXMBRootXML);

  /* SEARCH */
  app.get("/search", nocache, search);

  /* INSTALL PKG */
  app.get("/rap", installRap);

  /* INSTALL PKG */
  app.get("/pkg", installPkg);

  /* GET PKG FOLDER DIRECTORY LISTING */
  app.get("/package-directory", listPackageFiles);

  app.get("/", nocache, function(req: express.Request, res: express.Response) {
    res.redirect(`${getServerHost(serverConfig)}/public/localstore.html`);
  });

  /* SERVER SIDE DOWNLOAS */
  app.get("/download", nocache, downloadPkg);

  app.get("/download-progress", nocache, getProgressResponse);

  app.get("/download-stop", nocache, downloadStop);

  /* APP START LISTEN */
  return app.listen(serverConfig.port, () => {
    console.log(`[localstore:// started] at: ${getServerHost(serverConfig)}`);
  });
}

function setupTempDownloadsFolder() {
  fsExtra.ensureDirSync(path.resolve(__dirname, serverConfig.downloadTmpDir));
}

export function localstoreServer(callback: Function) {
  serverConfig = readConfig();

  serverConfig.ip = ip.address();

  if (!fs.existsSync(serverConfig.packagesFolder)) {
    serverConfig.packagesFolder = require("os").homedir();
  }

  writeConfig(serverConfig);

  setupTempDownloadsFolder();

  startDownloadQueue();

  callback(setupServer(), serverConfig);
}
