/**
 * Dialogs which behave similar to standard alert/prompt/confirm, but
 * with custom look&feel. They also provide Promise API instead of
 * synchronous one.
 * @module wybm/dialog
 */
// NOTE(Kagami): These dialogs doesn't have "blocking effect" unlike
// standard ones but:
//
// * We can't really use default dialogs (because of "prevent this"
//   checkbox and other clumsy stuff)
// * This may be actually better from the design point of view
//
// We may however consider blocking opener window via some other way
// (e.g. transparent absolute div).

import EventEmitter from "events";
import ALERT_PATH from "file?name=[name].[ext]!./alert.html";
import CONFIRM_PATH from "file?name=[name].[ext]!./confirm.html";
import PROMPT_PATH from "file?name=[name].[ext]!./prompt.html";
import {popkeys} from "../util";

export function alert(opts) {
  opts = Object.assign({
    width: 640,
    height: 280,
    position: "center",
    always_on_top: true,
    focusOK: true,
  }, opts);
  const winOpts = popkeys(opts, ["content", "focusOK"]);
  return new Promise((resolve/*, reject*/) => {
    window.nw.Window.open(ALERT_PATH, winOpts, win => {
      // Window is no longer inherited from EventEmitter so we need
      // custom one. See <https://github.com/nwjs/nw.js/issues/4120>.
      let wybm = win.wybm = new EventEmitter();
      wybm.opts = opts;
      wybm.on("ok", () => {
        win.close(true);
        resolve();
      });
      // NOTE(Kagami): We need to define "close" handler on sub-windows
      // if main window's "close" handler was attached, otherwise they
      // won't close.
      win.on("close", () => {
        win.close(true);
        resolve();
      });
    });
  });
}

export function confirm(opts) {
  opts = Object.assign({
    width: 300,
    height: 120,
    position: "center",
    always_on_top: true,
    focusOK: false,
  }, opts);
  const winOpts = popkeys(opts, ["focusOK"]);
  return new Promise((resolve, reject) => {
    window.nw.Window.open(CONFIRM_PATH, winOpts, win => {
      let wybm = win.wybm = new EventEmitter();
      wybm.opts = opts;
      wybm.on("ok", () => {
        win.close(true);
        resolve();
      });
      wybm.on("cancel", () => {
        win.close(true);
        reject(new Error("Cancel"));
      });
      win.on("close", () => {
        win.close(true);
        reject(new Error("Cancel"));
      });
    });
  });
}

export function prompt(opts) {
  opts = Object.assign({
    width: 350,
    height: 120,
    position: "center",
    always_on_top: true,
  }, opts);
  const winOpts = popkeys(opts, ["default"]);
  return new Promise((resolve, reject) => {
    window.nw.Window.open(PROMPT_PATH, winOpts, win => {
      let wybm = win.wybm = new EventEmitter();
      wybm.opts = opts;
      wybm.on("ok", value => {
        win.close(true);
        resolve(value);
      });
      wybm.on("cancel", () => {
        win.close(true);
        reject(new Error("Cancel"));
      });
      win.on("close", () => {
        win.close(true);
        reject(new Error("Cancel"));
      });
    });
  });
}
