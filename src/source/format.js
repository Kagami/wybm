/**
 * Format form.
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
  compareVideo(a, b) {
    return a.width != b.width
      ? b.width - a.width
      : b.fps - a.fps;
  },
  getVideoFormats() {
    // TODO(Kagami): Support for formats with both video and audio (only
    // "vp8.0" currently).
    return this.props.info.formats
      .filter(f => f.vcodec === "vp8" || f.vcodec === "vp9")
      // Make it easier to access better quality formats.
      .sort(this.compareVideo)
      .map(f => ({
        key: f.format_id,
        width: f.width,
        height: f.height,
        text: `${f.vcodec.toUpperCase()}
               ${f.width}x${f.height} ${f.fps}fps
               (${showSize(f.filesize)})`,
      }));
  },
  getDefaultVideoFormat() {
    // >=1080p would weight too much, 720p is enough.
    const video = this.getVideoFormats().find(f =>
      f.width === 1280 || f.height === 720
    );
    return video && video.key;
  },
  compareAudio(a, b) {
    // Opus at lower bitrates are better than Vorbis but we almost
    // always want highest audio bitrate so that doesn't matter.
    return b.abr - a.abr;
  },
  getAudioFormats() {
    return this.props.info.formats
      .filter(f => f.acodec === "vorbis" || f.acodec === "opus")
      .sort(this.compareAudio)
      .map(f => ({
        key: f.format_id,
        text: `${toCapitalCase(f.acodec)} ${f.abr}kbits
               (${showSize(f.filesize)})`,
      }));
  },
  handleDownloadClick() {
    // FIXME(Kagami): Show error if video/audio is not available in webm
    // format.
    const formats = this.props.info.formats;
    const vid = this.refs.video.value;
    assert(vid);
    const video = formats.find(f => f.format_id === vid);
    const aid = this.refs.audio.value;
    assert(aid);
    const audio = formats.find(f => f.format_id === aid);
    this.props.onLoad({
      video: Object.assign({}, video),
      audio: Object.assign({}, audio),
    });
  },
  handleCancelClick() {
    this.props.onCancel();
  },
  render() {
    return (
      <div>
        <h2 style={this.styles.header}>{this.props.info.title}</h2>
        <div style={this.styles.text}>Video format:</div>
        <select
          ref="video"
          style={this.styles.select}
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
        />
        <span> </span>
        <input
          value="Cancel"
          type="button"
          style={this.styles.bigButton}
          onClick={this.handleCancelClick}
        />
      </div>
    );
  },
});
