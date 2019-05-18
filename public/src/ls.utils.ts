function exitFullScreen() {
  window.resizeTo(1094, 928);
  window.moveTo(0, 0);
}

function fullscreen() {
  window.resizeTo(screen.width, screen.height);
  window.moveTo(0, 0);
}

function longPress(selector: string, callback: Function) {
  // Create variable for setTimeout
  var delay: NodeJS.Timeout;

  // Set number of milliseconds for longpress
  var longpress = 1000;

  var listItems = document.querySelectorAll<HTMLElement>(selector);
  var listItem: HTMLElement;

  for (var i = 0, j = listItems.length; i < j; i++) {
    listItem = listItems[i];
    (listItem as any)["lsIndex"] = i;

    listItem.addEventListener(
      "mousedown",
      function(e: any) {
        var _this = this;
        delay = setTimeout(check, longpress);

        function check() {
          callback((_this as any).lsIndex);
        }
      },
      true
    );

    listItem.addEventListener("mouseup", function(e: any) {
      // On mouse up, we know it is no longer a longpress
      clearTimeout(delay);
    });

    listItem.addEventListener("mouseout", function(e: any) {
      clearTimeout(delay);
    });
  }
}

function simulateClick(elem: { dispatchEvent: (arg0: MouseEvent) => void }) {
  var e = document.createEvent("MouseEvents");
  e.initMouseEvent(
    "mousedown",
    true,
    true,
    window,
    0,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    null
  );
  elem.dispatchEvent(e);
}

function toggleClass(element: Element | HTMLElement | null, className: string) {
  if (!element || !className) {
    return;
  }

  var classString = element.className,
    nameIndex = classString.indexOf(className);
  if (nameIndex == -1) {
    classString += " " + className;
  } else {
    classString =
      classString.substr(0, nameIndex) +
      classString.substr(nameIndex + className.length);
  }
  element.className = classString;
}

function selectId(select: string): HTMLElement {
  return document.getElementById(select) as HTMLElement;
}
function querySelector(select: string): HTMLElement {
  return document.querySelector(select) as HTMLElement;
}
function querySelectorAll(select: string): NodeListOf<HTMLElement> {
  return document.querySelectorAll(select) as NodeListOf<HTMLElement>;
}
