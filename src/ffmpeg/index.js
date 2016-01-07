/**
 * ffmpeg wrapper. Provides platform-independent Promise API.
 * @module wybm/ffmpeg
 */

import {spawn} from "child_process";
if (WIN_BUILD) {
  // TODO(Kagami): Allow to use system ffmpeg.
  require("file?name=[name].[ext]!../../bin/ffmpeg.exe");
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
      p.on("close", (code/*, signal*/) => {
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
    let args = ["-i", opts.video];
    // If audio is not provided it's basically no-op, except the
    // metadata update.
    if (opts.audio) {
      args.push(
        "-i", opts.audio,
        // In case if video is in combined format (vp8.0).
        "-map", "0:v:0",
        "-map", "1:a:0"
      );
    }
    args.push(
      "-c", "copy",
      "-metadata", "title=" + opts.title,
      opts.output
    );
    return this._run(RUNPATH, args);
  },
  cut(opts) {
    let args = [
      "-i", opts.input,
      // We always want first video since it's what browsers display.
      "-map", "0:v:0",
      // We also want audio but it might be omitted.
      "-map", "0:a:0?",
      "-c", "copy",
    ];
    // NOTE(Kagami): Basically no-op if both start and end timestamps
    // are not provided. It shouldn't cause any issues though and will
    // also remux & update SegmentUID of input which sometimes might be
    // useful.
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
