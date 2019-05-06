const fs = require("fs");
const path = require("path");
const jp = require("jsonpath");
const { app } = require("electron").remote;

const defaultLocale = "en";
const locales = require("../locales.json");
const avaliableLocales = Object.keys(locales);
const appLocale = app.getLocale().substr(0, 2);
const localeMap =
  locales[avaliableLocales.includes(appLocale) ? appLocale : defaultLocale];

function objPath(path, obj) {
  return path.split(".").reduce((o, i) => o[i], obj);
}

const lsFileRegexp = /\[(.+?)\]-\[(ALL|US|EU|JP|HK)-(PS1|PS2|PS3|PSN|DEMO|C00|DLC|EDAT|MINI)\]-\[(([A-Z0-9]{6})-([A-Z0-9]{9})_[A-Z0-9]{2}-(.+?))\]-\[0x([0-9A-F]{32})\]/;

const typeMap = {
  PS1: " ",
  PS2: " ",
  PSN: " ",
  C00: " coo ",
  Demo: " demo ",
  DLC: " dlc ",
  Mini: " mini ",
  PSVita: " ",
  PSP: " "
};

function stripChars(txt) {
  return txt.replace(/[^a-zA-Z0-9]/g, "-");
}

function getScript(file, replacements) {
  let fileContents = fs.readFileSync(
    __dirname + "/offline-scripts/" + file + ".txt",
    "utf8"
  );
  return fileContents;
}

function encodeScript(src) {
  return src
    .replace(/\'/g, "\\47")
    .replace(/\</g, "\\74")
    .replace(/\>/g, "\\76");
}

function getB64Script(file, replacements) {
  let fileContents = Buffer.from(
    fs.readFileSync(__dirname + "/offline-scripts/" + file + ".b64", "utf8"),
    "base64"
  ).toString();

  if (replacements) {
    Object.keys(replacements).forEach(replacement => {
      fileContents = fileContents.replace(
        replacement,
        replacements[replacement]
      );
    });
  }
  return Buffer.from(fileContents).toString("base64");
}

// https://stackoverflow.com/questions/5454235/shorten-string-without-cutting-words-in-javascript
function shorten(str, maxLen, separator = " ") {
  if (str.length <= maxLen) return str;
  return str.substr(0, str.lastIndexOf(separator, maxLen));
}

function getServerHost(serverConfig) {
  return `http://${serverConfig.ip}:${serverConfig.port}`;
}

function reverseEndian(x) {
  buf = Buffer.allocUnsafe(4);
  buf.writeUIntLE(x, 0, 4);
  return buf.readUIntBE(0, 4);
}

function getProductCodeFromContentId(contentId) {
  return contentId.split("-")[1].split("_")[0];
}

function getPackageContentId(file, pkgFile) {
  return new Promise((resolve, reject) => {
    fs.open(file, "r", (status, fd) => {
      if (status) {
        reject(status.message);
        return;
      }
      const buffer = Buffer.allocUnsafe(84);
      fs.read(fd, buffer, 0, 84, 0, (err, num) => {
        const header = reverseEndian(buffer.readInt32LE());
        if (header === 0x7f504b47) {
          const contentId = buffer.slice(48, 48 + 36).toString();

          const fileData = {
            file: file,
            stat: pkgFile.stat,
            contentId,
            productCode: getProductCodeFromContentId(contentId)
          };
          resolve(fileData);
        } else {
          const fileData = {
            file: file,
            stat: pkgFile.stat,
            contentId: "unknown",
            productCode: "unknown"
          };
          resolve(fileData);
        }
      });
    });
  });
}

function getLocalStorePkgs(folder) {
  folder = path.resolve(__dirname, folder);
  return fs
    .readdirSync(folder)
    .filter(file => path.extname(file) === ".pkg" && file[0] !== ".")
    .map(file => {
      return { file, stat: fs.statSync(folder + "/" + file) };
    });
}

function getPkgContentIds(folder, pkgFiles) {
  folder = path.resolve(__dirname, folder);
  return Promise.all(
    pkgFiles.map(pkgFile => {
      return getPackageContentId(folder + "/" + pkgFile.file, pkgFile);
    })
  );
}

function getXMB(serverConfig, localstoreDb) {
  return getPkgContentIds(
    serverConfig.packagesFolder,
    getLocalStorePkgs(serverConfig.packagesFolder)
  )
    .then(foundPackages => {
      return foundPackages.map(currentPackage => {
        const bddGame = jp.query(
          { games: localstoreDb },
          "$.games[?(@.contentId==='" +
            currentPackage.contentId +
            "' || @.productCode ==='" +
            getProductCodeFromContentId(currentPackage.contentId) +
            "')]"
        );

        if (bddGame[0]) {
          const isSigned = currentPackage.file.endsWith(".pkg_signed.pkg");
          const cloned = JSON.parse(JSON.stringify(bddGame[0]));
          cloned.stat = currentPackage.stat;
          cloned.contentId = currentPackage.contentId;
          cloned.pkg = `${getServerHost(serverConfig)}/pkg?pkg=${path.basename(
            currentPackage.file
          )}`;
          cloned.file = path.basename(currentPackage.file);
          return cloned;
        } else {
          const baseFileName = path.basename(currentPackage.file);
          const isLsSavedFile = lsFileRegexp.test(baseFileName);

          console.log(baseFileName, isLsSavedFile);
          // check if is a rap pkg we have generated
          if (isLsSavedFile) {
            const [
              result,
              name,
              region,
              type,
              contentId,
              productCodeName,
              productCode,
              productDetailName,
              rap
            ] = baseFileName.match(lsFileRegexp);

            return {
              productCode,
              name: name + " RAP",
              type,
              region,
              pkg: `${getServerHost(serverConfig)}/pkg?pkg=${baseFileName}`,
              contentId: currentPackage.contentId,
              rap: "",
              description: "signed_rap",
              uploader: "Anonymous",
              cover: productCode,
              stat: currentPackage,
              file: baseFileName
            };
          }

          return {
            productCode: baseFileName,
            name: baseFileName,
            type: "PS1",
            region: "All",
            pkg: `${getServerHost(serverConfig)}/pkg?pkg=${baseFileName}`,
            contentId: currentPackage.contentId,
            rap: "",
            description: currentPackage.contentId,
            uploader: "Anonymous",
            cover: `000000000`,
            stat: currentPackage,
            file: baseFileName
          };
        }
      });
    })
    .then(games => {
      const pkgReferences = games.map(game => {
        return pkgEntry(game, serverConfig);
      });

      const filledLetters = Array.from(
        new Set(
          games.map(game => {
            let currentLetter = game.name[0].toUpperCase();
            if (
              currentLetter.charCodeAt(0) >= 48 &&
              currentLetter.charCodeAt(0) <= 57
            ) {
              currentLetter = "@";
            }
            return currentLetter;
          })
        )
      ).sort();

      const alphabetIcons = filledLetters.map(letter => {
        return iconEntry({
          tableKey: "letter_" + letter.toLowerCase(),
          icon: `/dev_usb000/localSTORE/letters/card-${letter}.png`,
          name: "",
          subtitle: ""
        });
      });
      const alphabetItems = filledLetters.map(letter => {
        if (letter.charCodeAt(0) >= 48 && letter.charCodeAt(0) <= 57) {
          letter = "ALPHA";
        }
        return queryEntry({
          type: "type:x-xmb/folder-pixmap",
          key: `letter_${letter.toLowerCase()}`,
          src: `letter_view_${letter.toLowerCase()}`
        });
      });

      const filteredLettersViews = filledLetters.reduce((acc, letter) => {
        let originalLetter = letter;
        if (letter.charCodeAt(0) >= 48 && letter.charCodeAt(0) <= 57) {
          letter = "@";
        }
        const tmpObj = {
          icons: [],
          items: []
        };
        games
          .filter(game => {
            if (letter === "@") {
              const code = game.name[0].toLowerCase().charCodeAt(0);
              return code >= 48 && code <= 57;
            } else {
              return (
                game.name[0].toLowerCase() === originalLetter.toLowerCase()
              );
            }
          })
          .forEach((game, index) => {
            const isSignedPackage = game.file.endsWith(".pkg_signed.pkg");

            // 
            const gameId =
              game.contentId && game.contentId !== ""
                ? game.contentId
                : game.productCode;

            tmpObj.icons.push(
              iconEntry({
                tableKey: `letter_icon_${letter.toLowerCase()}_${index}`,
                icon: `${getServerHost(serverConfig)}/image-proxy?productCode=${
                  game.cover
                }&compact=true${isSignedPackage ? "&signed=true" : ""}`,
                name: game.name,
                subtitle:
                  typeMap[game.type] +
                  " " +
                  game.region +
                  (isSignedPackage ? "  Signed  deleted after install" : "")
              })
            );

            tmpObj.items.push(
              queryEntry({
                type: "type:x-xmb/folder-pixmap",
                key: `letter_icon_${letter.toLowerCase()}_${index}`,
                src: gameId + "-" + stripChars(game.file)
              })
            );
          });
        acc += `<View id="letter_view_${letter.toLowerCase()}"><Attributes>${tmpObj.icons.join(
          ""
        )}</Attributes><Items>${tmpObj.items.join("")}</Items></View>`;
        return acc;
      }, "");

      const pkgListing = `<XMBML version="1.0">
    <View id="package_link">
        <Attributes>
            <Table key="pkg_main">
                <Pair key="icon">
                    <String>/dev_usb000/localSTORE/localstore-app.png</String>
                </Pair>
                <Pair key="title">
                    <String>localstore://</String>
                </Pair>
                <Pair key="info">
                    <String></String>
                </Pair>
                <Pair key="ingame">
                    <String>disable</String>
                </Pair>
            </Table>
        </Attributes>
        <Items>
            <Query class="type:x-xmb/folder-pixmap" key="pkg_main" attr="pkg_main" src="#pkg_items" />
        </Items>
    </View>
    ${pkgReferences.join("")}
    <View id="pkg_items">
      <Attributes>
        <Table key="localstore_link">
            <Pair key="icon"><String>${getServerHost(
              serverConfig
            )}/public/img/xmb/localstore-app.png</String></Pair>
            <Pair key="title"><String>${objPath(
              "xmb.localstore.localstore-title",
              localeMap
            )}</String></Pair>
            <Pair key="info"><String>${getServerHost(serverConfig).replace(
              "http://",
              ""
            )}</String></Pair>
            <Pair key="module_name"><String>webrender_plugin</String></Pair>
            <Pair key="module_action"><String>${getServerHost(
              serverConfig
            )}</String></Pair>
        </Table>
        <Table key="alphabetical_link_manager">
            <Pair key="icon"><String>${getServerHost(
              serverConfig
            )}/public/img/xmb/localstore-alphabet-settings.png</String></Pair>
            <Pair key="title"><String>${objPath(
              "xmb.localstore.alpha-util-title",
              localeMap
            )}</String></Pair>
            <Pair key="info"><String>${objPath(
              "xmb.localstore.alpha-util-info",
              localeMap
            )}</String></Pair>
            <Pair key="module_name"><String>webrender_plugin</String></Pair>
            <Pair key="module_action"><String>${getServerHost(
              serverConfig
            )}/public/file-manager.html</String></Pair>
        </Table>        
        <Table key="update_package_link">
            <Pair key="icon"><String>/dev_usb000/localSTORE/localstore-update.png</String></Pair>
            <Pair key="title"><String>${objPath(
              "xmb.localstore.update-xmb-title",
              localeMap
            )}</String></Pair>
            <Pair key="info"><String>${objPath(
              "xmb.localstore.update-xmb-info",
              localeMap
            )}</String></Pair>
            <Pair key="module_name"><String>webrender_plugin</String></Pair>
            <Pair key="module_action"><String>javascript:eval('${encodeScript(
              getScript("ls-update-reboot")
            ).replace(
              "$$$localSTORE$$$",
              getServerHost(serverConfig)
            )}');</String></Pair>
        </Table>
        <Table key="update_package_link_server">
          <Pair key="icon"><String>/dev_usb000/localSTORE/localstore-settings.png</String></Pair>
          <Pair key="title"><String>${objPath(
            "xmb.localstore.update-server-xmb-title",
            localeMap
          )}</String></Pair>
          <Pair key="info"><String>${objPath(
            "xmb.localstore.update-server-xmb-title",
            localeMap
          )}</String></Pair>
          <Pair key="module_name"><String>webrender_plugin</String></Pair>
          <Pair key="module_action"><String>${getScript(
            "update-server"
          )}</String></Pair>
        </Table>
        <Table key="alphabetical_link">
            <Pair key="icon">
                <String>/dev_usb000/localSTORE/localstore-alphabet.png</String>
            </Pair>
            <Pair key="title">
                <String>${objPath(
                  "xmb.localstore.alpha-title",
                  localeMap
                )}</String>
            </Pair>
            <Pair key="info">
                <String>${objPath(
                  "xmb.localstore.alpha-info",
                  localeMap
                )}</String>
            </Pair>
            <Pair key="ingame">
                <String>disable</String>
            </Pair>
        </Table>
        <Table key="ls-uninstall">
            <Pair key="icon">
                <String>/dev_usb000/localSTORE/localstore-app.png</String>
            </Pair>
            <Pair key="title">
                <String>${objPath(
                  "xmb.localstore.uninstall-util-title",
                  localeMap
                )}</String>
            </Pair>
            <Pair key="info">
                <String>${objPath(
                  "xmb.localstore.uninstall-util-info",
                  localeMap
                )}</String>
            </Pair>
            <Pair key="module_name">
                <String>webrender_plugin</String>
            </Pair>
            <Pair key="module_action">
                <String>${getServerHost(
                  serverConfig
                )}/public/hen-xmb-installer.html?xml=category_game_hen.xml</String>
            </Pair>
        </Table>
    </Attributes>
        <Items>
          <Query class="type:x-xmb/module-action" key="localstore_link" attr="localstore_link" />
          <Query class="type:x-xmb/folder-pixmap" key="alphabetical_link" attr="alphabetical_link" src="#alphabetical" />
          <Query class="type:x-xmb/module-action" key="alphabetical_link_manager" attr="alphabetical_link_manager" />
          <Query class="type:x-xmb/module-action" key="update_package_link" attr="update_package_link" />
          <Query class="type:x-xmb/module-action" key="update_package_link_server" attr="update_package_link_server" />
          <Query class="type:x-xmb/module-action" key="ls-uninstall" attr="ls-uninstall"/>
        </Items>
    </View>
    <View id="alphabetical">
        <Attributes>${alphabetIcons.join("")}</Attributes>
        <Items>${alphabetItems.join("")}</Items>
    </View>
    ${filteredLettersViews}
</XMBML>`;
      //https://stackoverflow.com/questions/21699063/remove-unwanted-whitespaces-between-tags-in-xml-javascript
      return pkgListing.replace(/>\s*/g, ">").replace(/\s*</g, "<");
    });
}

function pkgReference({ gameId, pkg, name, cover }, key) {
  return `<Table key="${key}">
        <Pair key="info">
            <String>net_package_install</String>
        </Pair>
        <Pair key="pkg_src">
            <String>${pkg}</String>
        </Pair>
        <Pair key="pkg_src_qa">
            <String>${pkg}</String>
        </Pair>
        <Pair key="content_name">
            <String>${name}</String>
        </Pair>
        <Pair key="content_id">
            <String>${gameId}</String>
        </Pair>
        <Pair key="prod_pict_path"><String>${cover}</String></Pair>
        <Pair key="title">
            <String>${name}</String>
        </Pair>
    </Table>`;
}

function pkgEntry(
  { contentId, pkg, name, cover, productCode, file },
  serverConfig
) {
  const gameId = contentId && contentId !== "" ? contentId : productCode;
  const key = "file_" + gameId;
  const icon = `/dev_usb000/localSTORE/localstore-install.png`;

  return `<View id="${gameId}-${stripChars(file)}">
    <Attributes>${pkgReference(
      { gameId, pkg, name, cover: icon },
      key
    )}</Attributes>
    <Items>${itemEntry({ key, type: "type:x-xmb/xmlnpsignup" })}</Items>
    </View>`;
}

function iconEntry({ tableKey, icon, name, subtitle }) {
  return `<Table key="${tableKey}">
        <Pair key="icon">
            <String>${icon}</String>
        </Pair>
        <Pair key="title">
            <String>${name}</String>
        </Pair>
        <Pair key="info">
            <String>${subtitle}</String>
        </Pair>
        <Pair key="ingame">
            <String>disable</String>
        </Pair>
    </Table>`;
}

function itemEntry({ type, key }) {
  return `<Item class="${type}" key="${key}" attr="${key}" />`;
}

function queryEntry({ type, key, src }) {
  return `<Query class="${type}" key="${key}" attr="${key}" src="#${src}" />`;
}

module.exports = { getXMB };
