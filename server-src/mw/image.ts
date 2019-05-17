import express = require("express");
import fs from "fs";
import jp from "jsonpath";
import path from "path";
import { getLocalStoreDb } from "../localstore.db";

const localstoreDb = getLocalStoreDb();

export function resize({
  file,
  quality,
  sx = 0,
  sy = 0,
  sw,
  sh,
  dx,
  dy,
  dw,
  dh
}: {
  file: string;
  quality: number;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const imageHolder = document.createElement("img");
    canvas.width = dw;
    canvas.height = dh;
    imageHolder.onload = () => {
      sw = imageHolder.width;
      sh = imageHolder.height;
      ctx.drawImage(imageHolder, sx, sy, sw, sh, dx, dy, dw, dh);
      resolve(canvas.toDataURL("image/jpg", quality).split(",")[1]);
    };
    imageHolder.src = file;
  });
}

export function xmbGameIcon({
  file,
  quality,
  type,
  signed
}: {
  file: string;
  quality: number;
  type: string;
  signed: boolean;
}) {
  const typeMap: { [key: string]: string } = {
    PS1: "ps1",
    PS2: "ps2",
    PSN: "ps3",
    C00: "ps3",
    Demo: "ps3",
    DLC: "ps3",
    Mini: "psp",
    PSVita: "psvita",
    PSP: "psp"
  };
  return new Promise<string>((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const imageCover = document.createElement("img");
    const imageTemplate = document.createElement("img");
    const imageType = document.createElement("img");
    const imageSigned = document.createElement("img");
    // 243 281
    imageCover.onload = () => {
      ctx.drawImage(imageCover, 0, 0, 322, 388, 64, 45, 369, 393);
      imageTemplate.src = `../public/img/xmb-template/base.png`;
    };
    imageTemplate.onload = () => {
      ctx.drawImage(imageTemplate, 0, 0);
      imageType.src = `../public/img/xmb-template/xmb-${typeMap[type] ||
        "ps1"}.png`;
    };

    imageType.onload = () => {
      ctx.drawImage(imageType, 0, 0);
      if (!signed) {
        resolve(canvas.toDataURL("image/jpg", quality).split(",")[1]);
      } else {
        imageSigned.src = "../public/img/xmb-template/signed-pkg.png";
      }
    };

    imageSigned.onload = () => {
      ctx.drawImage(imageSigned, 0, 0);
      resolve(canvas.toDataURL("image/jpg", quality).split(",")[1]);
    };

    imageCover.src = file;
  });
}

// image proxy middleware
export function imageProxy(req: express.Request, res: express.Response) {
  const { productCode, compact, signed } = req.query;

  if (!productCode) {
    res.send({ error: "No image productCode provided" });
    return;
  }

  const file = path.resolve(
    __dirname,
    `../../public/img/product-covers/${productCode}.jpg`
  );

  const noCover = path.resolve(
    __dirname,
    `../../public/img/cover-templates/no-cover.png`
  );

  const gamesWithProductCodeResults = jp.query(
    { games: localstoreDb },
    `$.games[?(@.productCode==='${productCode}')]`
  );

  if (fs.existsSync(file)) {
    if (compact === "true") {
      xmbGameIcon({
        signed: signed === "true",
        file,
        quality: 0.5,
        type:
          gamesWithProductCodeResults && gamesWithProductCodeResults[0]
            ? gamesWithProductCodeResults[0].type
            : "PS1"
      }).then(b64 => {
        res.write(Buffer.from(b64, "base64"), "binary");
        res.end(null, "binary");
      });
    } else {
      res.sendFile(file);
    }
  } else {
    if (compact === "true") {
      xmbGameIcon({
        file: noCover,
        signed: signed === "true",
        quality: 0.5,
        type:
          gamesWithProductCodeResults && gamesWithProductCodeResults[0]
            ? gamesWithProductCodeResults[0].type
            : "PS1"
      }).then(b64 => {
        res.write(Buffer.from(b64, "base64"), "binary");
        res.end(null, "binary");
      });
    } else {
      res.sendFile(noCover);
    }
  }
}
