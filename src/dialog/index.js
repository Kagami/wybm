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
import {popkey} from "../util";

export function alert(opts) {
  let winOpts = Object.assign({
    width: 640,
    height: 260,
    position: "center",
    always_on_top: true,
  }, opts);
  popkey(winOpts, "content");
  return new Promise((resolve/*, reject*/) => {
    global.nw.Window.open(ALERT_PATH, winOpts, win => {
      let wybm = win.wybm = new EventEmitter();
      wybm.opts = opts;
      wybm.on("ok", () => {
        resolve();
        win.close();
      });
      win.on("closed", () => {
        resolve();
      });
    });
  });
}

export function confirm(opts) {
  let winOpts = Object.assign({
    width: 300,
    height: 120,
    position: "center",
    always_on_top: true,
  }, opts);
  return new Promise((resolve, reject) => {
    global.nw.Window.open(CONFIRM_PATH, winOpts, win => {
      // Window is no longer inherited from EventEmitter so we need
      // custom one. See <https://github.com/nwjs/nw.js/issues/4120>.
      let wybm = win.wybm = new EventEmitter();
      wybm.opts = opts;
      wybm.on("ok", () => {
        resolve();
        win.close();
      });
      wybm.on("cancel", () => {
        reject(new Error("Cancel"));
        win.close();
      });
      // Will fire after "ok" as well but Promise will just ignore it.
      win.on("closed", () => {
        reject(new Error("Cancel"));
      });
    });
  });
}

export default {alert, confirm};
