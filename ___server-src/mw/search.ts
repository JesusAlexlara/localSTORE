import express = require("express");
import jp from "jsonpath";
import { getLocalStoreDb } from "../localstore.db";
import { pageSize } from "../localstore.statics";
let localstoreDb: any;
// Seach Middleware
export function search(req: express.Request, res: express.Response) {
  localstoreDb = getLocalStoreDb();

  if (req.query.data) {
    const searchState = JSON.parse(
      Buffer.from(req.query.data, "base64").toString()
    );
    const isFullSearch = searchState.query.length > 1;

    const storeOptions =
      searchState.searchOptions.store === "ALL"
        ? `(@.region==='US' || @.region==='EU' || @.region==='JP' || @.region==='HK')`
        : `@.region==='${searchState.searchOptions.store}'`;

    const flagOptions = searchState.searchOptions.types.map((type: string) => {
      return `@.type==='${type}'`;
    });

    const flagQuery =
      flagOptions.length > 0 ? ` && (${flagOptions.join("||")})` : "";

    const queryOptions = isFullSearch
      ? ` && @.name.toLowerCase().includes('${searchState.query.toLowerCase()}')`
      : searchState.query != "#"
      ? searchState.query === ""
        ? ""
        : ` && @.name.charAt(0)==="${searchState.query}"`
      : ` && (@.name.charCodeAt(0)>=48 && @.name.charCodeAt(0) <= 57)`;

    const searchQuery = queryOptions ? queryOptions : "";

    const path = `$.games[?(${storeOptions}${flagQuery}${searchQuery})]`;

    const results = jp.query({ games: localstoreDb }, path);
    const total = results.length;
    const pages = Math.ceil(total / pageSize);

    res.status(200).send({
      results: results.slice(
        searchState.page * pageSize,
        searchState.page * pageSize + pageSize
      ),
      pages,
      total,
      page: searchState.page
    });
    return;
  }
  res.status(200).send({ error: "Invalid Params" });
}
