let db: any = null;
export function getLocalStoreDb() {
  if (db === null) {
    db = require("../bdd/localstore-db.json");
  }
  return db;
}
