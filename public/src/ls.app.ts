// 1094x928
// 1824x1026 48x27 padding
// 1920x 1080

const locales: { [key: string]: { [key: string]: string } } = {
  en: {
    downloads: "Downloads",
    "hold-to-download": "Hold ⓧ to download",
    "confirm-cancel-download": "Are you sure to cancel this download?",
    search: "Search",
    remove: "ⓧ REMOVE",
    fileManager: "File Manager"
  },
  es: {
    downloads: "Descargas",
    "hold-to-download": "Mantenga ⓧ para descargar",
    "confirm-cancel-download": "¿Está seguro de cancelar esta descarga?",
    search: "Buscar",
    remove: "ⓧ CANCELAR",
    fileManager: "Contenido Descargado"
  },
  fr: {
    downloads: "Téléchargements",
    "hold-to-download": "Tenir ⓧ pour télécharger",
    "confirm-cancel-download":
      "Êtes-vous sûr de vouloir annuler ce téléchargement?",
    search: "Recherche",
    remove: "ⓧ ANNULER",
    fileManager: "Contenu téléchargé"
  }
};

const defaultLocale = "en";
const avaliableLocales = Object.keys(locales);
const appLocale = navigator.language.substr(0, 2);
const localeMap =
  locales[
    avaliableLocales.indexOf(appLocale) !== -1 ? appLocale : defaultLocale
  ];
const uiState: {
  alphabetLastSelect: HTMLElement | null;
  storeLastSelect: HTMLElement;
  imageSource: Array<HTMLImageElement>;
  games: Array<any>;
  response: any;
} = {
  alphabetLastSelect: null,
  storeLastSelect: querySelectorAll(".-initial")[0],
  imageSource: [],
  games: [],
  response: null
};

let updateTimeout: NodeJS.Timeout;
let skipTimeout: NodeJS.Timeout;

let currentDownloads: {
  [key: string]: {
    total?: number;
    downloaded?: number;
    progress?: number;
    speed?: number;
    name?: string;
    contentId?: string;
  };
} = {};

let $: any;

function onSearchChange() {
  const searchValue = (selectId("ls-native-prompt--input") as any).value;
  if (searchValue !== "") {
    searchState.query = searchValue;
    update();
  }
  nativePromptHide();
}

function nativePrompt() {
  selectId("ls-main").style.display = "none";
  selectId("ls-native-prompt").style.display = "block";
}

function nativePromptHide() {
  selectId("ls-main").style.display = "block";
  selectId("ls-native-prompt").style.display = "none";
}

function nativeConfirm(text: string, cb: Function) {
  selectId("ls-main").style.display = "none";
  selectId("ld-native-confirm").style.display = "table";
  querySelector(".ls-native-confirm--caption p").textContent = text;
  setTimeout(function() {
    const r = confirm("");
    setTimeout(function() {
      selectId("ld-native-confirm").style.display = "none";
      selectId("ls-main").style.display = "block";
    }, 0);
    cb(r);
  }, 100);
}

function skipIntro() {
  clearTimeout(skipTimeout);
  selectId("ls-main").style.display = "block";
  selectId("ls-logo").style.display = "none";
  selectId("ls-logo").innerHTML = "";
}

// Store select
function storeSelect(el: HTMLElement, store: string) {
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
function alphabetSelect(e: Event) {
  const target = e.target as HTMLElement;
  if (target.innerHTML === "ø") {
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
  uiState.alphabetLastSelect = target.parentNode as HTMLElement;
  toggleClass(uiState.alphabetLastSelect, "-selected");

  // TODO clear search
  searchState.page = 0;
  searchState.query = target.innerHTML;
  update();
}

// Download Item
function downloadSelect(index: number) {
  downloadGame(uiState.games[index]);
}

function downloadGame(game: {
  productCode: string;
  searchId: string;
  pkg: string;
  name: string;
  rap: string;
}) {
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

function downloadStop(contentId: string) {
  nativeConfirm(localeMap["confirm-cancel-download"], function(
    confirm: boolean
  ) {
    if (confirm) {
      fetch("/download-stop?contentId=" + contentId).then(updateDownloads);
    }
  });
}

function updateDownloadList(json: any) {
  clearTimeout(updateTimeout);
  const keys = Object.keys(json);
  let output = keys.reduce(function(acc, key, index) {
    const currentKey = json[key];
    const caption =
      currentKey.completed && currentKey.resigner === 1
        ? "RESIGNING"
        : currentKey.completed && currentKey.resigner
        ? "RESIGNED"
        : localeMap["remove"];

    acc += "<p>" + currentKey.name + "</p>";
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
    $.downloadsContainer.innerHTML = output;
    // $.downloadsContainer.style.display = "none";
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

  $.filters.addEventListener("mousedown", function(event: Event) {
    const li = (event.target as HTMLElement).parentElement;
    toggleClass(li, "-selected");
    setTimeout(function() {
      filterSelected();
    }, 100);
  });
}

function filterSelected() {
  const currentSelection = $.filters.querySelectorAll("li.-selected button");
  const result = [];
  for (let i = 0; i < currentSelection.length; i++) {
    result.push(currentSelection[i].getAttribute("filter"));
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
    const arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    arr.forEach(function(arr, index) {
      (uiState.imageSource[
        index
      ] as any).parentNode.parentNode.style.visibility = "hidden";
    });
    uiState.games.forEach(function(game, index) {
      game.searchId = game.contentId; //; !== "" ? game.contentId : game.productCode;

      (uiState.imageSource[
        index
      ] as any).parentNode.parentNode.style.visibility = "visible";

      uiState.imageSource[index].setAttribute(
        "src",
        "/image-proxy?productCode=" + game.cover
      );
      const parent = (uiState.imageSource[index] as any).parentElement
        .parentElement;
      parent.setAttribute("name", game.name);
      parent.setAttribute("region", game.region);
      parent.setAttribute("type", game.type);
      parent.setAttribute("hold", localeMap["hold-to-download"]);
      parent.setAttribute("class", game.cover === null ? "-nocover" : "");
    });
    updateDetail(0);
  });
}

function updateDetail(index: number) {
  const game = uiState.games[index];
  $.detailImage.setAttribute(
    "src",
    "/image-proxy?productCode=" + game.productCode
  );
  $.detailTitle.textContent = game.name;
  $.detailInfo.innerHTML =
    game.region +
    " | " +
    game.type +
    " | " +
    game.contentId +
    "<br/><br/>" +
    game.description;
}

function initializeContents() {
  let output = "";
  for (let i = 0; i < 20; i++) {
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

  selectId("ls-grid-games").innerHTML = output;
  const arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let gameGridTimeout: NodeJS.Timeout;
  arr.forEach(function(arr, index) {
    const el = selectId("ls-image-source-" + index) as HTMLImageElement;
    ((el.parentElement as HTMLElement)
      .parentElement as HTMLElement).addEventListener("mouseover", function() {
      clearTimeout(gameGridTimeout);
      gameGridTimeout = setTimeout(function() {
        updateDetail(index);
      }, 1000);
    });
    uiState.imageSource.push(el);
  });

  searchState.searchOptions.types.forEach(function(type) {
    toggleClass(
      querySelector('button[filter="' + type + '"]').parentElement,
      "-selected"
    );
  });
}

function showFileManager() {
  window.location.href = "file-manager.html";
}

function main() {
  // setup intro screen
  skipTimeout = setTimeout(function() {
    skipIntro();
  }, 15000);

  $ = {
    detailImage: selectId("ls-detail--image"),
    detailTitle: selectId("ls-title"),
    detailInfo: selectId("ls-info"),
    navigationPrev: selectId("ls-prev"),
    navigationNext: selectId("ls-next"),
    currentPage: selectId("ls-current-page"),
    filters: querySelector(".ls-native-filters--list"),
    downloadsContainer: selectId("ls-detail--downloads-container"),
    downloadsTitle: selectId("i18-downloads"),
    fileManager: selectId("i18-fileManager")
  };

  $.downloadsTitle.innerHTML = localeMap["downloads"];
  $.fileManager.innerHTML = localeMap["fileManager"];
  initializeContents();
  initializeEvents();
  // force fullscreen
  fullscreen();

  //
  update();
  updateDownloads();
}

main();
