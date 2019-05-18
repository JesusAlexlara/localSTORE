import fs from "fs";
import path from "path";
import { getLocalStorePkgs } from "./localstore.directory";
import { ServerConfig } from "./localstore.types";

export function byteHelper(value: number) {
  // https://gist.github.com/thomseddon/3511330
  const units = ["b", "kB", "MB", "GB", "TB"],
    number = Math.floor(Math.log(value) / Math.log(1024));
  return (
    (value / Math.pow(1024, Math.floor(number))).toFixed(1) +
    " " +
    units[number]
  );
}

export const lsFileRegexp = /\[(.+?)\]-\[(ALL|US|EU|JP|HK)-(PS1|PS2|PS3|PSN|DEMO|C00|DLC|EDAT|MINI)\]-\[(([A-Z0-9]{6})-([A-Z0-9]{9})_[A-Z0-9]{2}-(.+?))\]-\[0x([0-9A-F]{32})\]/;

export function getServerHost(serverConfig: ServerConfig) {
  return `http://${serverConfig.ip}:${serverConfig.port}`;
}

export function readConfig() {
  return JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "./config.json"), "utf8")
  );
}

export function writeConfig(serverConfig: ServerConfig) {
  fs.writeFileSync(
    __dirname + "/config.json",
    JSON.stringify(serverConfig),
    "utf8"
  );
}

export function getDirectory(
  ip: string,
  serverConfig: ServerConfig,
  localstoreDb: any
) {
  return getLocalStorePkgs(ip, serverConfig.packagesFolder, localstoreDb);
}

export function objPath(path: string, obj: any) {
  return path.split(".").reduce((o, i) => o[i], obj);
}

export function stripNonAscii(source: string) {
  return source.replace(/[^\x00-\x7F]/g, "");
}

export function getScript(file: string) {
  let fileContents = fs.readFileSync(
    __dirname + "/offline-scripts/" + file + ".txt",
    "utf8"
  );
  return fileContents;
}
