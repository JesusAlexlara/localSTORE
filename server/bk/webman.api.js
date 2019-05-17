const request = require("request");
const fs = require("fs");
const path = require("path");
const ip = require("ip");

function readConfig() {
  return JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "./config.json"), "utf8")
  );
}

const webmanAPI = {
  popup(ip, text, spacing = 39) {
    text += "\n" + "_".repeat(spacing);
    return `http://${ip}/popup.ps3/${encodeURI(text)}`;
  },
  openXMBItem(ip, col = "game", segment = "") {
    console.log(`http://${ip}/play.ps3?col=${col}&seg=${segment}`);
    return `http://${ip}/play.ps3?col=${col}&seg=${segment}`;
  },
  focusIndex(ip) {
    return `http://${ip}/browser.ps3$focus_segment_index%203`;
  },
  open(ip) {
    return `http://${ip}/browser.ps3$open_list`;
  },
  downloadRap(ip, rap, contentId) {
    // /download.ps3?to=<path>&url=<url> -
    const config = readConfig();
    return `http://${ip}/download.ps3?to=/dev_usb000/extdata&url=http://${
      config.ip
    }:${config.port}/rap?rap=${rap}&contentId=${contentId}`;
  }
};
const webmanProxy = {
  proxy(url) {
    console.log(url);
    return new Promise((resolve, reject) => {
      request(url, (error, response, body) => {
        resolve();
      });
    });
  }
};

// webmanProxy.proxy(
//   webmanAPI.popup(
//     " NPU7866 Avaliable to install" +
//       "localSTORE\n\nNPU7866 Download Completed\n\nGo to File Manager to install it" +
//       "localSTORE\n\nNPU7866 Download Completed\n\nGo to File Manager to install it" +
//       "localSTORE\n\nNPU7866 Download Completed\n\nGo to File Manager to install it"
//   )
// );

// webmanProxy
//   .proxy(webmanAPI.openXMBItem("game", "seg_package_files"))
//   .then(() => {
//     setTimeout(() => {
//       webmanProxy.proxy(webmanAPI.focusIndex()).then(() => {
//         setTimeout(() => {
//           webmanProxy.proxy(webmanAPI.open());
//         }, 2000);
//       });
//     }, 2000);
//   });
module.exports = {
  webmanAPI,
  webmanProxy
};
