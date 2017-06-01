/**
 * Format form. Returns selected video/audio format info.
 * @module wybm/source/format
 */

import assert from "assert";
import React from "react";
import {showSize, toCapitalCase} from "../util";

export default React.createClass({
  componentDidMount() {
    if (process.env.WYBM_DEBUG_FORMAT) {
      this.handleDownloadClick();
    }
  },
  styles: {
    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
    },
    text: {
      fontSize: "25px",
    },
    select: {
      fontSize: "25px",
      width: 450,
      textAlign: "center",
    },
    br: {
      height: 20,
    },
    bigButton: {
      fontSize: "30px",
      width: 200,
      cursor: "pointer",
    },
  },
  // Prefer high-quality.
  compareVideo(a, b) {
    // Higher resolution/FPS is always better.
    if (a.height !== b.height) return b.height - a.height;
    if (a.width !== b.width) return b.width - a.width;
    if (a.fps !== b.fps) return b.fps - a.fps;
    // Else prefer by bitrate.
    if (a.tbr !== b.tbr) return b.tbr - a.tbr;
    return 0;
  },
  getVideoText(f) {
    if (f.vcodec === "vp8" || f.vcodec === "vp9") {
      // A lot of youtube videos contain fps=1 in metadata which is
      // obviously wrong.
      const fps = f.fps <= 1 ? "" : `${f.fps}fps`;
      return `${f.vcodec.toUpperCase()}
              ${f.width}x${f.height} ${fps}
              (${showSize(f.filesize)})`;
    } else if (f.vcodec === "vp8.0") {
      return `VP8+Vorbis ${f.width}x${f.height}`;
    }
  },
  getVideoFormats() {
    return this.props.info.formats
      .filter(f =>
        f.vcodec === "vp8" ||
        f.vcodec === "vp9" ||
        f.vcodec === "vp8.0"
      )
      .sort(this.compareVideo)
      .map(f => ({
        key: f.format_id,
        fps: f.fps,
        width: f.width,
        height: f.height,
        text: this.getVideoText(f),
      }));
  },
  getDefaultVideoFormat() {
    // Only starting with 1080p VP9 has decent quality, so try to select
    // 1080p by default. 1440p+ would weight too much.
    const video = this.getVideoFormats().find(f =>
      // 60fps weights too much.
      (!f.fps || f.fps < 31) && (
        (f.width >= f.height && (f.width <= 1920 || f.height <= 1080)) ||
        // Account vertical videos.
        (f.width < f.height && (f.width <= 810 || f.height <= 1440))
      )
    );
    return video && video.key;
  },
  compareAudio(a, b) {
    // Opus at low bitrates is better than Vorbis but we almost always
    // want highest audio quality (it doesn't affect resulting size
    // much) so that doesn't matter.
    return b.abr - a.abr;
  },
  getAudioSize(f) {
    return f.filesize ? `(${showSize(f.filesize)})` : "";
  },
  getAudioFormats() {
    return this.props.info.formats
      .filter(f => f.acodec === "vorbis" || f.acodec === "opus")
      .sort(this.compareAudio)
      .map(f => ({
        key: f.format_id,
        text: `${toCapitalCase(f.acodec)} ${f.abr}kbits
               ${this.getAudioSize(f)}`,
      }))
      .concat({key: null, text: "none"});
  },
  getCurrentVideo() {
    const vid = this.refs.video.value;
    if (!vid) return;
    const formats = this.props.info.formats;
    return formats.find(f => f.format_id === vid);
  },
  getCurrentAudio() {
    const aid = this.refs.audio.value;
    if (!aid) return;
    const formats = this.props.info.formats;
    return formats.find(f => f.format_id === aid);
  },
  isVideoNotAvailable() {
    // This normally shouldn't happen. At least "vp8.0" should be
    // available for all videos.
    return !this.getVideoFormats().length;
  },
  handleDownloadClick() {
    const video = this.getCurrentVideo();
    assert(video);
    const audio = this.getCurrentAudio();
    this.props.onLoad({
      video: Object.assign({}, video),
      audio: audio ? Object.assign({}, audio) : null,
    });
  },
  render() {
    return (
      <div>
        <h2 style={this.styles.header}>{this.props.info.title}</h2>
        <div style={this.styles.text}>Video format:</div>
        <select
          ref="video"
          style={this.styles.select}
          disabled={this.isVideoNotAvailable()}
          defaultValue={this.getDefaultVideoFormat()}
        >
          {this.getVideoFormats().map(f =>
            <option key={f.key} value={f.key}>{f.text}</option>
          )}
        </select>
        <div style={this.styles.br} />
        <div style={this.styles.text}>Audio format:</div>
        <select ref="audio" style={this.styles.select}>
          {this.getAudioFormats().map(f =>
            <option key={f.key} value={f.key}>{f.text}</option>
          )}
        </select>
        <div style={this.styles.br} />
        <input
          value="Download"
          type="button"
          style={this.styles.bigButton}
          onClick={this.handleDownloadClick}
          disabled={this.isVideoNotAvailable()}
        />
        <span> </span>
        <input
          value="Cancel"
          type="button"
          style={this.styles.bigButton}
          onClick={this.props.onCancel}
        />
      </div>
    );
  },
});
