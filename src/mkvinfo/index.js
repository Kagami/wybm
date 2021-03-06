/**
 * mkvinfo wrapper. Provides platform-independent Promise API.
 * @module wybm/mkvinfo
 */

import fs from "fs";
import assert from "assert";
import {spawn} from "child_process";
import XRegExp from "xregexp";
import {getRunPath, parseTime} from "../util";
if (WIN_BUILD) {
  require("file-loader?name=[name].[ext]!../../bin/mkvinfo.exe");
}

export default {
  _run(args) {
    const runpath = getRunPath("mkvinfo");
    let stdout = "";
    // let stderr = "";
    return new Promise((resolve, reject) => {
      let p;
      try {
        p = spawn(runpath, args, {stdio: ["ignore", "pipe", "pipe"]});
      } catch(err) {
        throw new Error(`Failed to run mkvinfo: ${err.message}`);
      }
      p.stdout.on("data", data => {
        stdout += data;
      });
      // p.stderr.on("data", data => {
      //   stderr += data;
      // });
      p.on("error", err => {
        reject(new Error(`Failed to run mkvinfo: ${err.message}`));
      });
      p.on("close", (code/*, signal*/) => {
        // rc=1 means warning for mkvtoolnix.
        // Note that mkvtoolnix tools write all info to stdout.
        if (code > 1 || code == null) {
          return reject(new Error(
            `mkvinfo exited with code ${code} (${stdout})`
          ));
        }
        resolve(stdout);
      });
    });
  },
  getStats(fpath) {
    return this._run(["-v", "-v", fpath]).then(out => {
      // Collect some useful info.
      const size = fs.statSync(fpath).size;
      const duration = +out.match(/\+ Duration: (\d+(\.\d+)?)/)[1];
      // Track segment is at level 0.
      const trstart = out.search(/\n\|\+ (Tracks|Segment tracks) at /);
      assert(trstart >= 0, "Can't find segment start");
      // Copy until next level 0 element.
      const trend = out.indexOf("\n|+ ", trstart + 1);
      assert(trend >= 0, "Can't find segment end");
      const tracks = out
        .slice(trstart, trend)
        .split(/\+ (A track|Track) at /g)
        // Skip first useless chunk.
        .slice(1);
      let vid, vcodec, width, height, fps, aid, acodec;
      tracks.forEach(track => {
        // We need only first video/audio track since it's what browsers
        // use for <video> tag.
        if (!vid && track.indexOf("+ Track type: video") >= 0) {
          vid = track.match(/\+ Track number: (\d+)/)[1];
          vcodec = track.match(/\+ Codec ID: V_(\w+)/)[1];
          try {
            width = +track.match(/\+ Display width: (\d+)/)[1];
            height = +track.match(/\+ Display height: (\d+)/)[1];
          } catch(e) {
            width = +track.match(/\+ Pixel width: (\d+)/)[1];
            height = +track.match(/\+ Pixel height: (\d+)/)[1];
          }
          fps = track.match(/\+ Default duration:.*\((\d+(\.\d+)?) frames/);
          if (fps != null) {
            fps = +fps[1];
          } else {
            fps = track.match(/\+ Frame rate: (\d+(\.\d+)?)/);
            if (fps != null) {
              fps = +fps[1];
            } else {
              fps = 0;
            }
          }
        } else if (!aid && track.indexOf("+ Track type: audio") >= 0) {
          aid = track.match(/\+ Track number: (\d+)/)[1];
          acodec = track.match(/\+ Codec ID: A_(\w+)/)[1];
        }
      });
      // This is the only required field, it's ok for other stuff to
      // contain buggy values. (They should at least present in mkvinfo
      // output though otherwise match()[1] will throw.)
      assert(vid, "Bad video track ID");
      // TODO(Kagami): This can't detect keyframes contained inside
      // BlockGroup. "mkvinfo -v -v -v" + "[I frame]" matching is needed
      // for that.
      const framere = new XRegExp(String.raw`(?x)
        \+\ (?:Simple)?\ ?[Bb]lock(?:\ \(|:\ )
        (key,\ )?
        track\ number\ ${vid},
        .*\ time(?:code|stamp)\ ([\d:.]+)
        .*\ at\ (\d+)
      `);
      let frames = [];
      out.split(/\r?\n/).forEach(line => {
        const framem = line.match(framere);
        if (framem) {
          const frame = {
            key: !!framem[1],
            time: parseTime(framem[2]),
            pos: +framem[3],
          };
          if (!frames.length) return frames.push(frame);
          const last = frames.length - 1;
          // NOTE(Kagami): Seems like this should always be true for
          // WebM since it doesn't have visible B-frames.
          assert(frame.time >= frames[last].time, "Non-monotonic PTS");
          // Ignore altref in splitted packed[AltRef, P] pair. See
          // <http://permalink.gmane.org/gmane.comp.multimedia.webm.devel/2425>
          // for details.
          // NOTE(Kagami): On the test files I tried such P-frames
          // sometimes have 1ms shift in PTS compared to their
          // accompanied AltRef pair. It's not clear whether this shift
          // might be bigger.
          if (frame.time - frames[last].time < 0.002) {
            if (!frames[last].key) {
              frames[last] = frame;
            }
            // It seems like splitted packed[I, AltRef] and we need to
            // drop second frame in that case.
          } else {
            frames.push(frame);
          }
        }
      });
      frames.forEach((f, i) => { f.index = i; });
      assert(frames.length, "No frames");
      return {size, duration, width, height, fps, frames, vcodec, acodec};
    });
  },
};
