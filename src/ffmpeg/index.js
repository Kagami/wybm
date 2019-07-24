/**
 * ffmpeg wrapper. Provides platform-independent Promise API.
 * @module wybm/ffmpeg
 */

import {spawn} from "child_process";
import tmp from "tmp";
import {getRunPath} from "../util";
if (WIN_BUILD) {
  require("file-loader?name=[name].[ext]!../../bin/ffmpeg.exe");
}

export default {
  _run(args) {
    const runpath = getRunPath("ffmpeg");
    let stdout = "";
    let stderr = "";
    args = ["-v", "error", "-y"].concat(args);
    return new Promise((resolve, reject) => {
      let p;
      try {
        p = spawn(runpath, args, {stdio: ["ignore", "pipe", "pipe"]});
      } catch(err) {
        throw new Error(`Failed to run ffmpeg: ${err.message}`);
      }
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
        if (code || code == null) {
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
    return this._run(args);
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
      return this._run(args).then(() => fragment);
    }).then(fragment => {
      // Then add preview if needed.
      // NOTE(Kagami): ffmpeg can't seek exactly only single file when
      // two input files are provided (see
      // <https://ffmpeg.org/pipermail/ffmpeg-user/2013-June/015687.html>
      // for details) so we need one extra step.
      if (opts.preview) {
        return this._run([
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
    const width = opts.width + 2 - (opts.width % 2);
    const height = opts.height + 2 - (opts.height % 2);
    const color = [
      "color=#DDDDDD",
      `size=${width}x${height}`,
    ].join(":");
    const scale = [
      width + 1,
      height + 1,
      "force_original_aspect_ratio=decrease",
    ].join(":");
    const overlay = [
      "(W-w)/2",
      "(H-h)/2",
    ].join(":");
    const lavfi = [
      `color=${color}[bg]`,
      `[0:v:0]setpts=PTS-STARTPTS,scale=${scale}[s]`,
      `[bg][s]overlay=${overlay}[outv]`,
    ].join(";");

    const args = [];
    if (opts.time != null) {
      args.push("-ss", opts.time.toString());
    }
    args.push(
      "-i", opts.input,
      // Not so high-quality but should be enough for thumbnail.
      "-c:v", "libvpx", "-b:v", "0", "-crf", "30",
      // Note that target video will have BT.601 colormatrix if input
      // uses RGB color model. It's ok since most imageboards use 601
      // when generating thumbnails.
      "-lavfi", lavfi, "-map", "[outv]",
      // We don't need yuva.
      "-pix_fmt", "yuv420p",
      "-frames:v", "1",
      "-f", "webm",
      opts.output
    );
    return this._run(args);
  },
};
