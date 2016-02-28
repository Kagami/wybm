/**
 * youtube-dl wrapper. Provides platform-independent Promise API.
 * @module wybm/youtube-dl
 */

import {spawn} from "child_process";
import {getRunPath} from "../util";
const YTDL = require(
  "file?name=[name].[ext]!../../bin/youtube-dl." + (WIN_BUILD ? "exe" : "zip")
);

export default {
  _run(args) {
    let runpath = getRunPath("youtube-dl");
    // Windows build will always have youtube-dl available.
    if (!WIN_BUILD && !runpath) {
      runpath = "python";
      args = [YTDL].concat(args);
    }
    let stdout = "";
    let stderr = "";
    return new Promise((resolve, reject) => {
      let p;
      try {
        p = spawn(runpath, args, {stdio: ["ignore", "pipe", "pipe"]});
      } catch(err) {
        throw new Error(`Failed to run ytdl: ${err.message}`);
      }
      p.stdout.on("data", data => {
        stdout += data;
      });
      p.stderr.on("data", data => {
        stderr += data;
      });
      p.on("error", err => {
        reject(new Error(`Failed to run ytdl: ${err.message}`));
      });
      p.on("close", (code/*, signal*/) => {
        if (code || code == null) {
          return reject(new Error(
            `ytdl exited with code ${code} (${stderr})`
          ));
        }
        resolve(stdout);
      });
    });
  },
  getInfo(url) {
    return this._run(["--no-playlist", "-j", url]).then(JSON.parse);
  },
};
