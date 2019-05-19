const evilscan = require("evilscan");
const ip = require("ip");
const [ip0, ip1] = ip.address().split(".");
interface ScanResult {
  ip: string;
  port: number;
  banner: string;
  status: string;
}
export function getPS3Ip() {
  let results: ScanResult;
  return new Promise<Partial<ScanResult>>((resolve, reject) => {
    const options = {
      target: `${ip0}.${ip1}.0.0/24`,
      port: "80",
      status: "TROU",
      banner: true
    };

    const scanner = new evilscan(options);
    scanner.on("result", function(data: ScanResult) {
      results = data;
    });

    scanner.on("error", function(err: Error) {
      resolve({});
    });

    scanner.on("done", function() {
      if (results) {
        resolve(results);
        return;
      }
      resolve({});
    });

    scanner.run();
  });
}
