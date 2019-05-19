import fs from "fs";
import moveFile from "move-file";
import { DownloaderHelper } from "node-downloader-helper";
import path from "path";
import {
  DownloaderHelperExtension,
  PendingDownload,
  ServerConfig
} from "../localstore.types";
import { byteHelper, readConfig } from "../localstore.utils";
import { webmanAPI, webmanProxy } from "../webman.api";

import express = require("express");

export const downloadGlobal: { [key: string]: any } = {};

let serverConfig: ServerConfig;
// PKG DOWNLOADS
export function getPendingDownloads(): { downloads: Array<PendingDownload> } {
  serverConfig = readConfig();
  return JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, "..", serverConfig.pendingDownloads),
      "utf8"
    )
  );
}

export function addDownload(
  {
    fileName,
    url,
    contentId,
    name,
    rap,
    type,
    region,
    remoteIp
  }: PendingDownload,
  cb: Function
) {
  serverConfig = readConfig();
  const pendingDownloads = getPendingDownloads().downloads;
  if (
    pendingDownloads.filter((download: PendingDownload) => {
      download.url === url;
    }).length === 0
  ) {
    fs.writeFileSync(
      path.resolve(__dirname, serverConfig.pendingDownloads),
      JSON.stringify(
        {
          downloads: pendingDownloads.concat({
            fileName,
            url,
            contentId,
            name,
            rap,
            type,
            region,
            remoteIp
          })
        },
        null,
        4
      )
    );
    downloadFile(
      { fileName, url, contentId, name, rap, type, region, remoteIp },
      cb
    );
  }

  return true;
}

export function removeDownload(contentId: string, cb: Function) {
  serverConfig = readConfig();
  downloadGlobal[contentId].stop();
  delete downloadGlobal[contentId];
  const pendingDownloads = getPendingDownloads().downloads.filter(function(
    pending
  ) {
    return pending.contentId !== contentId;
  });
  fs.writeFileSync(
    path.resolve(__dirname, serverConfig.pendingDownloads),
    JSON.stringify({ downloads: pendingDownloads }, null, 4)
  );
  cb();
}

export function downloadFile(
  {
    fileName,
    url,
    contentId,
    name,
    rap,
    type,
    region,
    remoteIp
  }: PendingDownload,
  cb?: Function
) {
  serverConfig = readConfig();
  const dl = (new DownloaderHelper(
    url,
    path.resolve(__dirname, "..", serverConfig.downloadTmpDir),
    {
      override: true,
      fileName: fileName
    }
  ) as DownloaderHelper & DownloaderHelperExtension)
    .on("start", () => {
      dl.πname = name;
      dl.πcontentId = contentId;
      dl.πcompleted = false;
      dl.πresigner = 0;
      dl.πremoteIp = remoteIp;
    })
    .on("download", () => {})
    .on("progress", (stats: any) => {
      const progress = stats.progress.toFixed(1);
      const speed = byteHelper(stats.speed);
      const downloaded = byteHelper(stats.downloaded);
      const total = byteHelper(stats.total);

      dl.πprogress = stats;
      dl.πname = name;
      dl.πcontentId = contentId;
      dl.πcompleted = false;
      dl.πresigner = 0;
      dl.πremoteIp = remoteIp;
    })
    .on("end", () => {
      dl.πprogress = { progress: 100, speed: 100, total: 100, downloaded: 100 };
      dl.πname = name;
      dl.πcontentId = contentId;
      dl.πcompleted = true;
      dl.πresigner = 0;
      dl.πremoteIp = remoteIp;
      removeDownloadedFile(
        {
          fileName,
          url,
          contentId,
          name,
          rap,
          type,
          region,
          remoteIp
        },
        dl
      );
    })
    .on("error", (_error: any) => {})
    .on("pause", () => {})
    .on("resume", () => {})
    .on("stop", () => {})
    .on("stateChanged", (_state: any) => {});
  downloadGlobal[contentId] = dl;
  dl.πname = name;
  dl.πcontentId = contentId;
  dl.πcompleted = false;
  dl.πremoteIp = remoteIp;
  dl.resume();
  cb && cb();
}

export function removeDownloadedFile(
  { fileName, url, contentId, name, rap, type, region }: PendingDownload,
  dl: any
) {
  serverConfig = readConfig();
  const currentDownloads = getPendingDownloads();
  const filtered = currentDownloads.downloads.filter(download => {
    return download.url !== url;
  });

  fs.writeFileSync(
    path.resolve(__dirname, serverConfig.pendingDownloads),
    JSON.stringify({ downloads: filtered }, null, 4)
  );

  moveFile.sync(
    path.resolve(__dirname, "..", serverConfig.downloadTmpDir, fileName),
    path.resolve(__dirname, serverConfig.packagesFolder, fileName)
  );
  dl.πresigner = 2;
  notifyDownloadCompleted(dl.πremoteIp, dl.πname, dl.πcontentId);

  flushDownloads();
}

export function downloadRapToUsb(ip: string, rap: string, contentId: string) {
  webmanProxy.proxy(webmanAPI.downloadRap(ip, rap, contentId));
}

export function flushDownloads() {
  Object.keys(downloadGlobal).forEach(key => {
    if (downloadGlobal[key].πcompleted && downloadGlobal[key].πresigner === 2) {
      delete downloadGlobal[key];
    }
  });
}
export function notifyDownloadCompleted(
  ip: string,
  name: string,
  contentId: string
) {
  const productCode = contentId.split("-")[1].split("_")[0];
  setTimeout(() => {
    webmanProxy.proxy(
      webmanAPI.popup(ip, ` ${name}\n\n${productCode} Avaliable to install`)
    );
  }, 4000);
}

export function startDownloadQueue() {
  const downloads = getPendingDownloads();
  downloads.downloads.forEach(download => {
    downloadFile(download);
  });
}

export function getProgressResponse(
  req: express.Request,
  res: express.Response
) {
  if (Object.keys(downloadGlobal).length > 0) {
    const progress = Object.entries(downloadGlobal).reduce(
      (acc: any, [key, value]) => {
        acc[key] = value.πprogress || undefined;
        if (acc[key]) {
          acc[key].name = value.πname;
          acc[key].contentId = value.πcontentId;
          acc[key].completed = value.πcompleted;
          acc[key].resigner = value.πresigner;
        }
        return acc;
      },
      {}
    );
    res.status(200).send(progress);
  } else {
    res.status(200).send({});
  }
}

export function downloadPkg(req: express.Request, res: express.Response) {
  const remoteIp = req.ip.replace("::ffff:", "");
  if (req.query.data) {
    const { productCode, contentId, pkg, name, rap, region, type } = JSON.parse(
      Buffer.from(req.query.data, "base64").toString()
    );

    const fileName = `[${name
      .replace(/[^\[\]a-zA-Z0-9\-\_]/g, "-")
      .replace(
        /--/g,
        "-"
      )}]-[${region.toUpperCase()}-${type.toUpperCase()}]-[${contentId}]${
      rap ? `-[0x${rap}]` : ""
    }.pkg`;

    addDownload(
      {
        contentId: contentId === "" ? productCode : contentId,
        url: pkg,
        fileName,
        name,
        rap,
        type,
        region,
        remoteIp
      },
      () => {
        getProgressResponse(req, res);
      }
    );
  }
}

export function downloadStop(req: express.Request, res: express.Response) {
  if (req.query.contentId) {
    removeDownload(req.query.contentId, function() {
      getProgressResponse(req, res);
    });
  }
}
