let db: any = null;
import fs from "fs";
import path from "path";

export function getLocalStoreDb() {
  return JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, "../bdd/localstore-db.json"),
      "utf8"
    )
  );
}
