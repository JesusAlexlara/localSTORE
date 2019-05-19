import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import fs from "fs";
import path from "path";
import kill from "tree-kill";
const currentPlatform = process.platform;

const ps3netsrvBinMap: { [key: string]: string } = {
  darwin: "ps3netsrv",
  win32: "ps3netsrv.exe"
};
const ps3netsrvBin = path.resolve(
  __dirname,
  `ps3netsrv/bin/${currentPlatform}/${ps3netsrvBinMap[currentPlatform]}`
);
const configPath = path.resolve(__dirname, "./config.json");

function readConfig() {
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

let ps3netsetverInstance: ChildProcessWithoutNullStreams | null;
let config;
export function startPs3netServ(port: string) {
  port = port || "38008";
  config = readConfig();

  ps3netsetverInstance = spawn(`${ps3netsrvBin}`, [
    config.ps3netservFolder,
    port
  ]);

  fs.writeFileSync(
    path.resolve(__dirname, "ps3netsrv.pid"),
    JSON.stringify({
      pid: ps3netsetverInstance.pid
    }),
    "utf8"
  );
}

function readPID() {
  return JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "ps3netsrv.pid"), "utf8")
  );
}

export function stopPs3netServ(cb: Function) {
  const pid = readPID();

  if (pid && pid.pid) {
    kill(pid.pid, function(err) {
      ps3netsetverInstance = null;
      fs.writeFileSync(
        path.resolve(__dirname, "ps3netsrv.pid"),
        JSON.stringify({}),
        "utf8"
      );
      cb && cb();
    });
  } else {
    cb && cb();
  }
}

export function getServerInstance() {
  return ps3netsetverInstance;
}
