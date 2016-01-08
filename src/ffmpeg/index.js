/**
 * ffmpeg wrapper. Provides platform-independent Promise API.
 * @module wybm/ffmpeg
 */

import {spawn} from "child_process";
import tmp from "tmp";
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
      "-f", "webm",
      opts.output
    );
    return this._run(RUNPATH, args);
  },
  cut(opts) {
    // TODO(Kagami): Do we want to save input's basename in metadata?
    // It might be useful if proper title is omitted (video was provided
    // via "choose file") and input has some meaningful name.
    // It may however overwrite original title/be undesirable in some
    // cases so it would be better to ask the user first.
    return Promise.resolve().then(() => {
      if (!opts.start && !opts.end && opts.preview) {
        // Short-circuit to avoid double remux.
        return opts.input;
      }
      // Cut fragment of provided input at first.
      let args = [
        "-i", opts.input,
        // We always want first video since it's what browsers display.
        "-map", "0:v:0",
        // We also want audio but it might be omitted.
        "-map", "0:a:0?",
        // NOTE(Kagami): Basically no-op if timestamps and preview are
        // not provided. It shouldn't cause any issues though and will
        // also remux & update SegmentUID of input which sometimes might
        // be useful.
        "-c", "copy",
      ];
      if (opts.start) {
        args.push("-ss", opts.start);
      }
      if (opts.end) {
        args.push("-to", opts.end);
      }
      const fragment = opts.preview
        ? tmp.fileSync({prefix: "wybm-", postfix: ".webm"}).name
        : opts.output;
      args.push("-f", "webm", fragment);
      return this._run(RUNPATH, args).then(() => fragment);
    }).then(fragment => {
      // Then add preview if needed.
      // NOTE(Kagami): ffmpeg can't seek exactly only single file when
      // two input files are provided (see
      // <https://ffmpeg.org/pipermail/ffmpeg-user/2013-June/015687.html>
      // for details) so we need one extra step.
      if (opts.preview) {
        return this._run(RUNPATH, [
          "-i", fragment,
          "-i", opts.preview,
          "-map", "0:v:0",
          "-map", "0:a:0?",
          "-map", "1:v:0",
          "-c", "copy",
          "-f", "webm",
          opts.output,
        ]);
      }
    });
  },
  preview(opts) {
    let args = opts.time != null ? ["-ss", opts.time.toString()] : [];
    const scale = [
      opts.width,
      opts.height,
      "force_original_aspect_ratio=increase",
    ].join(":");
    args.push(
      "-i", opts.input,
      "-map", "0:v:0",
      "-frames:v", "1",
      // Not so high-quality but should be enough for thumbnail.
      "-c:v", "libvpx", "-b:v", "0", "-crf", "30",
      // Note that target video will have BT.601 colormatrix if input
      // uses RGB color model. It's ok since most imageboard software
      // use 601 when generating thumbnails.
      "-vf", "scale=" + scale,
      "-f", "webm",
      opts.output
    );
    return this._run(RUNPATH, args);
  },
};
