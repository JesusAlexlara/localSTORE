const { app } = require("electron").remote;
const fs = require("fs");
const path = require("path");
const fsExtra = require("fs-extra");
const moveFile = require("move-file");
const currentPlatform = process.platform;

type platforms = "darwin" | "win32";
const resignerShellScriptExtensionMap: { [key: string]: string } = {
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

export function cleanUp() {
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

  // fsExtra.copyFileSync(
  //   app.getPath("userData") + "/act.dat",
  //   path.resolve(
  //     serverConfig.packagesFolder,
  //     "resigner/consoles/default/act.dat"
  //   )
  // );
  // fsExtra.copyFileSync(
  //   app.getPath("userData") + "/idps.hex",
  //   path.resolve(
  //     serverConfig.packagesFolder,
  //     "resigner/consoles/default/idps.hex"
  //   )
  // );
}

export async function resignPkg(
  fileName: string,
  rap: string,
  contentId: string,
  srcDir: string
) {
  serverConfig = readConfig();
  cleanUp();

  const src = path.resolve(__dirname, srcDir, fileName);
  const dest = path.resolve(
    serverConfig.packagesFolder,
    "resigner/input/pkgs",
    fileName
  );
  moveFile.sync(src, dest);

  const signedRapPkg = fileName.replace(".pkg", "");
  const { stdout, stderr } = await exec(
    `${resignerShellScript} ${app.getAppPath()} ${signedRapPkg} ${
      serverConfig.packagesFolder
    }`
  );
  console.log({ stdout, stderr });
  return { stderr: stderr === "" ? false : true, stdout };
}

export function writeRap(rap: string, output: string) {
  const bufferRap = Buffer.from(
    (rap.match(/[A-F0-9]{2}/g) as RegExpMatchArray).map(value =>
      parseInt(value, 16)
    )
  );
  fs.writeFileSync(output, bufferRap);
}

export async function resignRap(
  fileName: string,
  rap: string,
  contentId: string
) {
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
