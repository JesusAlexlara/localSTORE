var searchState = {
  page: 0,
  query: "",
  searchOptions: {
    store: "ALL",
    types: ["PSN"]
  }
};

function apiCall() {
  console.log(JSON.stringify(searchState));
  var url = "/search?data=" + window.btoa(JSON.stringify(searchState));
  return fetch(url).then(function(result) {
    return result.json();
  });
}
