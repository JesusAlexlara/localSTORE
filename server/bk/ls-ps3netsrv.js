const fs = require("fs");
const path = require("path");
const kill = require("tree-kill");
const currentPlatform = process.platform;
const spawn = require("child_process").spawn;

const ps3netsrvBinMap = {
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

let ps3netsetverInstance;
let config;
function startPs3netServ(port) {
  port = port || "38008";
  config = readConfig();
  console.log(`SPAWN ${ps3netsrvBin} ${config.ps3netservFolder} ${port} `);
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

function stopPs3netServ(cb) {
  const pid = readPID();
  console.log(pid);
  if (pid && pid.pid) {
    console.log("entro");
    kill(pid.pid, function(err) {
      ps3netsetverInstance = null;
      fs.writeFileSync(
        path.resolve(__dirname, "ps3netsrv.pid"),
        JSON.stringify({}),
        "utf8"
      );
      console.log("prooceo fin");
      cb && cb();
    });
  } else {
    cb && cb();
  }
}

function getServerInstance() {
  console.log("getServerInstance", ps3netsetverInstance);
  return ps3netsetverInstance;
}

module.exports = { startPs3netServ, stopPs3netServ, getServerInstance };
