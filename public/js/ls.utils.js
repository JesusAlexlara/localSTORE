"use strict";
function exitFullScreen() {
    window.resizeTo(1094, 928);
    window.moveTo(0, 0);
}
function fullscreen() {
    window.resizeTo(screen.width, screen.height);
    window.moveTo(0, 0);
}
function longPress(selector, callback) {
    // Create variable for setTimeout
    var delay;
    // Set number of milliseconds for longpress
    var longpress = 1000;
    var listItems = document.querySelectorAll(selector);
    var listItem;
    for (var i = 0, j = listItems.length; i < j; i++) {
        listItem = listItems[i];
        listItem["lsIndex"] = i;
        listItem.addEventListener("mousedown", function (e) {
            var _this = this;
            delay = setTimeout(check, longpress);
            function check() {
                callback(_this.lsIndex);
            }
        }, true);
        listItem.addEventListener("mouseup", function (e) {
            // On mouse up, we know it is no longer a longpress
            clearTimeout(delay);
        });
        listItem.addEventListener("mouseout", function (e) {
            clearTimeout(delay);
        });
    }
}
function simulateClick(elem) {
    var e = document.createEvent("MouseEvents");
    e.initMouseEvent("mousedown", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    elem.dispatchEvent(e);
}
function toggleClass(element, className) {
    if (!element || !className) {
        return;
    }
    var classString = element.className, nameIndex = classString.indexOf(className);
    if (nameIndex == -1) {
        classString += " " + className;
    }
    else {
        classString =
            classString.substr(0, nameIndex) +
                classString.substr(nameIndex + className.length);
    }
    element.className = classString;
}
function selectId(select) {
    return document.getElementById(select);
}
function querySelector(select) {
    return document.querySelector(select);
}
function querySelectorAll(select) {
    return document.querySelectorAll(select);
}
