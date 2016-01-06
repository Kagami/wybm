/**
 * ffmpeg wrapper. Provides platform-independent Promise API.
 * @module wybm/ffmpeg
 */

import {spawn} from "child_process";
if (WIN_BUILD) {
  // TODO(Kagami): Allow to use system ffmpeg.
  require("file?name=[name].[ext]!./ffmpeg.exe");
}
const RUNPATH = WIN_BUILD ? "ffmpeg.exe" : "ffmpeg";

export default {
  _run(runpath, args) {
    let stdout = "";
    let stderr = "";
    args = ["-v", "error", "-y"].concat(args);
    return new Promise((resolve, reject) => {
      const p = spawn(runpath, args, {stdio: ["ignore", "pipe", "pipe"]});
      p.stdout.on("data", data => {
        stdout += data;
      });
      p.stderr.on("data", data => {
        stderr += data;
      });
      p.on("error", err => {
        reject(new Error(`Failed to run ffmpeg: ${err.message}`));
      });
      p.on("exit", (code, signal) => {
        if (code || code == null || stderr) {
          return reject(new Error(
            `ffmpeg exited with code ${code} (${stderr})`
          ));
        }
        resolve(stdout);
      });
    });
  },
  merge(opts) {
    const args = [
      "-i", opts.video,
      "-i", opts.audio,
      "-c", "copy",
      opts.output,
    ];
    return this._run(RUNPATH, args);
  },
  cut(opts) {
    let args = ["-i", opts.input, "-c", "copy"];
    if (opts.start) {
      args.push("-ss", opts.start);
    }
    if (opts.end) {
      args.push("-to", opts.end);
    }
    args.push(opts.output);
    return this._run(RUNPATH, args);
  },
};
