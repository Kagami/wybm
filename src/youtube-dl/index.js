/**
 * youtube-dl wrapper. Provides platform-independent Promise API.
 * @module wybm/youtube-dl
 */

import {spawn} from "child_process";
// TODO(Kagami): Allow to use system youtube-dl.
const YTDL_BASENAME = require(
  "file?name=[name].[ext]!./youtube-dl." + (WIN_BUILD ? "exe" : "zip")
);
const RUNPATH = WIN_BUILD ? YTDL_BASENAME : "python";

export default {
  _run(runpath, args) {
    let stdout = "";
    let stderr = "";
    return new Promise((resolve, reject) => {
      const p = spawn(runpath, args, {stdio: ["ignore", "pipe", "pipe"]});
      p.stdout.on("data", data => {
        stdout += data;
      });
      p.stderr.on("data", data => {
        stderr += data;
      });
      p.on("error", err => {
        reject(new Error(`Failed to run ytdl: ${err.message}`));
      });
      p.on("exit", (code, signal) => {
        if (code || code == null || stderr) {
          return reject(new Error(
            `ytdl exited with code ${code} (${stderr})`
          ));
        }
        resolve(stdout);
      });
    });
  },
  getInfo(url) {
    let args = ["-j", url];
    if (!WIN_BUILD) {
      args = [YTDL_BASENAME].concat(args);
    }
    return this._run(RUNPATH, args).then(JSON.parse);
  },
};
