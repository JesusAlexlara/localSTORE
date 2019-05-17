import express from "express";
import fs from "fs";
import path from "path";
import { getLocalStoreDb } from "../localstore.db";
import { resignPkg } from "../localstore.resigner";
import { getDirectory, lsFileRegexp } from "../localstore.utils";
import moveFile = require("move-file");

function readConfig() {
  return JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../config.json"), "utf8")
  );
}

let serverConfig = readConfig();
let localstoreDb: any;
export function installRap(req: express.Request, res: express.Response) {
  const { rap, contentId } = req.query;

  const bufferRap = Buffer.from(
    rap.match(/[A-F0-9]{2}/g).map((value: string) => parseInt(value, 16))
  );

  const rapFile = path.resolve(__dirname, `../raps/${contentId}.rap`);

  res.set({
    "Content-Disposition": `attachment; filename=${contentId}.rap`,
    "Content-Type": "application/octet-stream"
  });
  fs.writeFile(
    rapFile,
    bufferRap,
    "binary",
    (err: NodeJS.ErrnoException | null) => {
      res.download(rapFile);
    }
  );
}

export function installPkg(req: express.Request, res: express.Response) {
  serverConfig = readConfig();
  const { pkg } = req.query;
  const file = path.resolve(__dirname, serverConfig.packagesFolder, pkg);
  res.set({
    "Content-Disposition": `attachment; filename=pkg`,
    "Content-Type": "application/octet-stream"
  });
  res.download(file);
}

export function listPackageFiles(req: express.Request, res: express.Response) {
  console.log("9999");
  const remoteIp = req.ip.replace("::ffff:", "");
  serverConfig = readConfig();
  localstoreDb = getLocalStoreDb();
  const { action, file } = req.query;

  switch (action) {
    case "list":
      res.status(200).json(getDirectory(remoteIp, serverConfig, localstoreDb));

      break;
    case "delete":
      fs.unlink(
        path.resolve(__dirname, serverConfig.packagesFolder, file),
        () => {
          res
            .status(200)
            .json(getDirectory(remoteIp, serverConfig, localstoreDb));
        }
      );
      break;
    case "resign":
      const [
        result,
        name,
        region,
        type,
        contentId,
        productCodeName,
        productCode,
        productDetailName,
        rap
      ] = file.match(lsFileRegexp);
      resignPkg(file, rap, contentId, serverConfig.packagesFolder).then(() => {
        const signedFile = file.replace(".pkg", ".pkg_signed.pkg");
        const signedRapFile = file.replace(".pkg", ".rif.pkg_signed.pkg");

        moveFile.sync(
          path.resolve(
            serverConfig.packagesFolder,
            "resigner/input/pkgs/",
            file
          ),
          path.resolve(__dirname, serverConfig.packagesFolder, file)
        );

        moveFile.sync(
          path.resolve(
            serverConfig.packagesFolder,
            "resigner/output/pkgs/",
            signedFile
          ),
          path.resolve(__dirname, serverConfig.packagesFolder, signedFile)
        );

        moveFile.sync(
          path.resolve(
            serverConfig.packagesFolder,
            "resigner/output/pkgs/",
            signedRapFile
          ),
          path.resolve(__dirname, serverConfig.packagesFolder, signedRapFile)
        );
        res
          .status(200)
          .json(getDirectory(remoteIp, serverConfig, localstoreDb));
      });

      break;
  }
}
