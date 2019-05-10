// 1094x928
// 1824x1026 48x27 padding
// 1920x 1080

var locales = {
  en: {
    downloads: "Downloads",
    "hold-to-download": "Hold ⓧ to download",
    "confirm-cancel-download": "Are you sure to cancel this download?",
    search: "Search",
    remove: "ⓧ REMOVE"
  },
  es: {
    downloads: "Descargas",
    "hold-to-download": "Mantenga ⓧ para descargar",
    "confirm-cancel-download": "¿Está seguro de cancelar esta descarga?",
    search: "Buscar",
    remove: "ⓧ CANCELAR"
  },
  fr: {
    downloads: "Téléchargements",
    "hold-to-download": "Tenir ⓧ pour télécharger",
    "confirm-cancel-download":
      "Êtes-vous sûr de vouloir annuler ce téléchargement?",
    search: "Recherche",
    remove: "ⓧ ANNULER"
  }
};

var defaultLocale = "en";
var avaliableLocales = Object.keys(locales);
var appLocale = navigator.language.substr(0, 2);
var localeMap =
  locales[
    avaliableLocales.indexOf(appLocale) !== -1 ? appLocale : defaultLocale
  ];

function onSearchChange() {
  var searchValue = document.getElementById("ls-native-prompt--input").value;
  if (searchValue !== "") {
    searchState.query = searchValue;
    update();
  }
  nativePromptHide();
}

function nativePrompt() {
  document.getElementById("ls-main").style.display = "none";
  document.getElementById("ls-native-prompt").style.display = "block";
}
function nativePromptHide() {
  document.getElementById("ls-main").style.display = "block";
  document.getElementById("ls-native-prompt").style.display = "none";
}

function nativeConfirm(text, cb) {
  document.getElementById("ls-main").style.display = "none";
  document.getElementById("ld-native-confirm").style.display = "table";
  document.querySelector(".ls-native-confirm--caption p").textContent = text;
  setTimeout(function() {
    var r = confirm("");
    setTimeout(function() {
      document.getElementById("ld-native-confirm").style.display = "none";
      document.getElementById("ls-main").style.display = "block";
    }, 0);
    cb(r);
  }, 100);
}

function skipIntro() {
  clearTimeout(skipTimeout);
  document.getElementById("ls-main").style.display = "block";
  document.getElementById("ls-logo").style.display = "none";
  document.getElementById("ls-logo").innerHTML = "";
}

// Store select
function storeSelect(el, store) {
  searchState.searchOptions.store = store;
  searchState.page = 0;
  if (uiState.storeLastSelect) {
    toggleClass(uiState.storeLastSelect, "-selected");
  }
  uiState.storeLastSelect = el;
  toggleClass(uiState.storeLastSelect, "-selected");
  update();
}
// Alphabet Selection
function alphabetSelect(e) {
  var target = e.target.innerHTML;
  if (target === "ø") {
    // TODO clear search
    searchState.page = 0;
    searchState.query = "";
    uiState.alphabetLastSelect = null;
    update();
    return;
  }
  if (uiState.alphabetLastSelect) {
    toggleClass(uiState.alphabetLastSelect, "-selected");
  }
  uiState.alphabetLastSelect = e.target.parentNode;
  toggleClass(uiState.alphabetLastSelect, "-selected");

  // TODO clear search
  searchState.page = 0;
  searchState.query = e.target.innerHTML;
  update();
}

// Download Item
function downloadSelect(index) {
  downloadGame(uiState.games[index]);
}

function downloadGame(game) {
  var downloadState = {
    productCode: game.productCode,
    contentId: game.searchId,
    pkgFile: game.pkg,
    name: game.name,
    rap: game.rap
  };

  currentDownloads[game.searchId] = {
    total: 0,
    downloaded: 0,
    progress: 0,
    speed: 0,
    name: game.name,
    contentId: game.searchId
  };

  fetch("/download?data=" + window.btoa(JSON.stringify(game))).then(function() {
    updateDownloadList(currentDownloads);
  });
}

function downloadStop(contentId) {
  nativeConfirm(localeMap["confirm-cancel-download"], function(confirm) {
    if (confirm) {
      fetch("/download-stop?contentId=" + contentId).then(updateDownloads);
    }
  });
}

var updateTimeout = 0;
var currentDownloads = {};
function updateDownloadList(json) {
  clearTimeout(updateTimeout);
  var keys = Object.keys(json);
  var output = keys.reduce(function(acc, key, index) {
    var currentKey = json[key];
    var caption =
      currentKey.completed && currentKey.resigner === 1
        ? "RESIGNING"
        : currentKey.completed && currentKey.resigner
        ? "RESIGNED"
        : localeMap["remove"];

    acc += "<p><b>" + currentKey.name + "</b></p>";
    acc +=
      '<button caption="' +
      caption +
      '" class="ls-progress-bar' +
      (currentKey.resigner === 1 || currentKey.resigner === 2
        ? " -resigning"
        : "") +
      '" id="progress-bar" ' +
      (currentKey.completed ? "disabled" : "") +
      " onclick=\"downloadStop('" +
      currentKey.contentId +
      "')\">";
    acc +=
      '<div class="ls-progress" style="width:' +
      Math.ceil(currentKey.progress) +
      '%"></div>';
    acc += "</button>";

    return acc;
  }, "");
  currentDownloads = json;
  if (keys.length > 0) {
    $.downloadsContainer.innerHTML = output;
    $.downloadsContainer.style.display = "block";
    updateTimeout = setTimeout(function() {
      updateDownloads();
    }, 5000);
  } else {
    output = " ";
    $.downloadsContainer.style.display = "none";
  }
}

function updateDownloads() {
  fetch("/download-progress").then(
    function(result) {
      return result.json().then(updateDownloadList);
    },
    function(e) {
      updateDownloads();
    }
  );
}

var skipTimeout;
var uiState = {
  alphabetLastSelect: null,
  storeLastSelect: document.querySelectorAll(".-initial")[0],
  imageSource: [],
  games: [],
  response: null
};

var $;

function initializeEvents() {
  longPress(".ls-grid-games li", downloadSelect);
  $.navigationPrev.addEventListener("mousedown", function() {
    if (searchState.page > 0) {
      searchState.page--;
      update();
    }
  });
  $.navigationNext.addEventListener("mousedown", function() {
    if (searchState.page < uiState.response.pages - 1) {
      searchState.page++;
      update();
    }
  });

  $.filters.addEventListener("mousedown", function(event) {
    var li = event.target.parentElement;
    toggleClass(li, "-selected");
    setTimeout(function() {
      filterSelected();
    }, 100);
  });
}

function filterSelected() {
  var currentSelection = $.filters.querySelectorAll("li.-selected button");
  var result = [];
  for (var i = 0; i < currentSelection.length; i++) {
    var filter = currentSelection[i].getAttribute("filter");
    result.push(filter);
  }
  searchState.page = 0;
  searchState.searchOptions.types = result;

  update();
}

function update() {
  apiCall().then(function(response) {
    uiState.response = response;
    uiState.games = response.results;

    $.navigationPrev.style.opacity = searchState.page === 0 ? 0.2 : 1;

    $.navigationNext.style.opacity =
      searchState.page === uiState.response.pages - 1 ? 0.2 : 1;

    $.currentPage.firstChild.nodeValue =
      response.page + 1 + "/" + response.pages;
    var arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    arr.forEach(function(arr, index) {
      uiState.imageSource[index].parentNode.parentNode.style.visibility =
        "hidden";
    });
    uiState.games.forEach(function(game, index) {
      game.searchId = game.contentId; //; !== "" ? game.contentId : game.productCode;

      uiState.imageSource[index].parentNode.parentNode.style.visibility =
        "visible";

      uiState.imageSource[index].setAttribute(
        "src",
        "/image-proxy?productCode=" + game.cover
      );
      var parent = uiState.imageSource[index].parentElement.parentElement;
      parent.setAttribute("name", game.name);
      parent.setAttribute("region", game.region);
      parent.setAttribute("type", game.type);
      parent.setAttribute("hold", localeMap["hold-to-download"]);
      console.log(game.cover);
      parent.setAttribute("class", game.cover === null ? "-nocover" : "");
    });
    updateDetail(0);
  });
}

function updateDetail(index) {
  var game = uiState.games[index];
  $.detailImage.setAttribute(
    "src",
    "/image-proxy?productCode=" + game.productCode
  );
  $.detailTitle.textContent = game.name;
  $.detailInfo.textContent = game.description;
}

function initializeContents() {
  var output = "";
  for (var i = 0; i < 20; i++) {
    // prettier-ignore
    output +=
      '<li>' +
      '    <div class="ls-grid-image">' +
      '        <img border="0" style="pointer-events: none;" id="ls-image-source-' +
      i +
      '" />' +
      "    </div>" +
      '    <div class="ls-grid-hitarea"><button></button></div>' +
      "</li>";
  }

  document.getElementById("ls-grid-games").innerHTML = output;
  var arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  var gameGridTimeout;
  arr.forEach(function(arr, index) {
    var el = document.getElementById("ls-image-source-" + index);
    el.parentElement.parentElement.addEventListener("mouseover", function() {
      clearTimeout(gameGridTimeout);
      gameGridTimeout = setTimeout(function() {
        updateDetail(index);
      }, 1000);
    });
    uiState.imageSource.push(el);
  });

  searchState.searchOptions.types.forEach(function(type) {
    toggleClass(
      document.querySelector('button[filter="' + type + '"]').parentElement,
      "-selected"
    );
  });
}

function main() {
  // setup intro screen
  skipTimeout = setTimeout(function() {
    skipIntro();
  }, 15000);

  $ = {
    detailImage: document.getElementById("ls-detail--image"),
    detailTitle: document.getElementById("ls-title"),
    detailInfo: document.getElementById("ls-info"),
    navigationPrev: document.getElementById("ls-prev"),
    navigationNext: document.getElementById("ls-next"),
    currentPage: document.getElementById("ls-current-page"),
    filters: document.querySelector(".ls-native-filters--list"),
    downloadsContainer: document.getElementById(
      "ls-detail--downloads-container"
    ),
    downloadsTitle: document.getElementById("i18-downloads")
  };

  $.downloadsTitle.innerHTML = localeMap["downloads"];
  initializeContents();
  initializeEvents();
  // force fullscreen
  fullscreen();

  //
  update();
  updateDownloads();
}
main();
