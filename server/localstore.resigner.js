const { app } = require("electron").remote;
const fs = require("fs");
const path = require("path");
const fsExtra = require("fs-extra");
const moveFile = require("move-file");
const currentPlatform = process.platform;

const resignerShellScriptExtensionMap = {
  darwin: "sh",
  win32: "bat"
};
const resignerShellScript = path.resolve(
  __dirname,
  `resigner/bin/${currentPlatform}/resign.${
    resignerShellScriptExtensionMap[currentPlatform]
  }`
);

function readConfig() {
  return JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "./config.json"), "utf8")
  );
}

let serverConfig = readConfig();

const util = require("util");
const exec = util.promisify(require("child_process").exec);

function cleanUp() {
  serverConfig = readConfig();
  fsExtra.emptyDirSync(
    path.resolve(serverConfig.packagesFolder, "resigner/consoles/default")
  );
  fsExtra.emptyDirSync(
    path.resolve(serverConfig.packagesFolder, "resigner/input/raps")
  );
  fsExtra.emptyDirSync(
    path.resolve(serverConfig.packagesFolder, "resigner/input/pkgs")
  );
  fsExtra.emptyDirSync(
    path.resolve(serverConfig.packagesFolder, "resigner/output/pkgs")
  );

  fsExtra.copyFileSync(
    app.getPath("userData") + "/act.dat",
    path.resolve(
      serverConfig.packagesFolder,
      "resigner/consoles/default/act.dat"
    )
  );
  fsExtra.copyFileSync(
    app.getPath("userData") + "/idps.hex",
    path.resolve(
      serverConfig.packagesFolder,
      "resigner/consoles/default/idps.hex"
    )
  );
}

async function resignPkgWithRap(fileName, rap, contentId, srcDir) {
  serverConfig = readConfig();
  cleanUp();

  const src = path.resolve(__dirname, srcDir, fileName);
  const dest = path.resolve(
    serverConfig.packagesFolder,
    "resigner/input/pkgs",
    fileName
  );
  moveFile.sync(src, dest);

  writeRap(
    rap,
    path.resolve(
      serverConfig.packagesFolder,
      "resigner/input/raps",
      contentId + ".rap"
    )
  );
  const signedRapPkg = fileName.replace(".pkg", "");
  const { stdout, stderr } = await exec(
    `${resignerShellScript} ${app.getAppPath()} ${signedRapPkg} ${
      serverConfig.packagesFolder
    }`
  );
  console.log({ stdout, stderr });
  return { stderr: stderr === "" ? false : true, stdout };
}

function writeRap(rap, output) {
  const bufferRap = Buffer.from(
    rap.match(/[A-F0-9]{2}/g).map(value => parseInt(value, 16))
  );
  fs.writeFileSync(output, bufferRap);
}

function resignPkg({ pkg }) {}

async function resignRap(fileName, rap, contentId) {
  serverConfig = readConfig();
  cleanUp();
  writeRap(
    rap,
    path.resolve(
      serverConfig.packagesFolder,
      "resigner/input/raps",
      contentId + ".rap"
    )
  );
  const signedRapPkg = fileName.replace(".pkg", "");
  const { stdout, stderr } = await exec(
    `${resignerShellScript} ${app.getAppPath()} ${signedRapPkg} ${
      serverConfig.packagesFolder
    }`
  );
  console.log({ stdout, stderr });
  return { stderr: stderr === "" ? false : true, stdout };
}

module.exports = {
  resignPkgWithRap,
  resignRap,
  cleanUp
};
