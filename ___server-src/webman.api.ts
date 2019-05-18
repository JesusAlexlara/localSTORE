const request = require("request");
const fs = require("fs");
const path = require("path");
const ip = require("ip");

function readConfig() {
  return JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "./config.json"), "utf8")
  );
}

export const webmanAPI = {
  popup(ip: string, text: string, spacing = 39) {
    text += "\n" + "_".repeat(spacing);
    return `http://${ip}/popup.ps3/${encodeURI(text)}`;
  },
  openXMBItem(ip: string, col = "game", segment = "") {
    console.log(`http://${ip}/play.ps3?col=${col}&seg=${segment}`);
    return `http://${ip}/play.ps3?col=${col}&seg=${segment}`;
  },
  focusIndex(ip: string) {
    return `http://${ip}/browser.ps3$focus_segment_index%203`;
  },
  open(ip: string) {
    return `http://${ip}/browser.ps3$open_list`;
  },
  downloadRap(ip: string, rap: string, contentId: string) {
    // /download.ps3?to=<path>&url=<url> -
    const config = readConfig();
    return `http://${ip}/download.ps3?to=/dev_usb000/extdata&url=http://${
      config.ip
    }:${config.port}/rap?rap=${rap}&contentId=${contentId}`;
  }
};
export const webmanProxy = {
  proxy(url: string) {
    console.log(url);
    return new Promise((resolve, reject) => {
      request(url, () => {
        resolve();
      });
    });
  }
};
