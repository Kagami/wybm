/**
 * Download and merge source video.
 * @module wybm/source/download
 */

import fs from "fs";
import path from "path";
import tmp from "tmp";
import request from "request";
import React from "react";
import FFmpeg from "../ffmpeg";
import {ShowHide, showSize, showErr} from "../util";

export default React.createClass({
  getInitialState() {
    return {vdata: 0, adata: 0};
  },
  componentDidMount() {
    const tmpdir = tmp.dirSync({prefix: "wybm-", unsafeCleanup: true}).name;
    const format = this.props.format;
    this.fpath = path.join(tmpdir, "out.webm");
    this.vpath = path.join(tmpdir, "v.webm");
    // Audio is optional.
    this.apath = format.audio ? path.join(tmpdir, "a.webm") : null;
    this.download();
  },
  // FIXME(Kagami): Use header, button, text theme components.
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
    size: {
      color: "#999",
    },
    progress: {
      WebkitAppearance: "none",
      width: 800,
      height: 32,
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
  download() {
    this.setState({vdata: 0, adata: 0, downloadingError: null});
    const format = this.props.format;
    // vp8.0 format lacks file size info.
    const videoHasSize = !!format.video.filesize;

    // TODO(Kagami): How to handle file write errors?
    let vpromise = new Promise((resolve, reject) => {
      this.vreq = request({
        url: format.video.url,
        headers: format.video.http_headers,
      }).on("response", res => {
        if (res.statusCode >= 400) {
          return reject(new Error(
            `Got ${res.statusCode} error while downloading video`
          ));
        }
        if (!videoHasSize) {
          // DOM will be updated on next "data" event.
          const reslen = +res.headers["content-length"];
          if (reslen) format.video.filesize = reslen;
        }
        res.on("error", err => {
          reject(err);
        }).on("data", chunk => {
          this.setState({vdata: this.state.vdata + chunk.length});
        }).on("end", () => {
          // requests's abort() fires "end" event which we obviously
          // don't want.
          if (!this.vreq) return;
          // Don't check against "Content-Length" in case of
          // keep-alive/chunked response.
          if (videoHasSize && this.state.vdata !== format.video.filesize) {
            return reject(new Error("Got wrong video data"));
          }
          resolve();
        }).pipe(fs.createWriteStream(this.vpath));
      }).on("error", err => {
        reject(err);
      });
    });

    let apromise;
    if (this.apath) {
      apromise = new Promise((resolve, reject) => {
        this.areq = request({
          url: format.audio.url,
          headers: format.audio.http_headers,
        }).on("response", res => {
          if (res.statusCode >= 400) {
            return reject(new Error(
              `Got ${res.statusCode} error while downloading audio`
            ));
          }
          res.on("error", err => {
            reject(err);
          }).on("data", chunk => {
            this.setState({adata: this.state.adata + chunk.length});
          }).on("end", () => {
            if (!this.areq) return;
            if (this.state.adata !== format.audio.filesize) {
              return reject(new Error("Got wrong audio data"));
            }
            resolve();
          }).pipe(fs.createWriteStream(this.apath));
        }).on("error", err => {
          reject(err);
        });
      });
    } else {
      apromise = Promise.resolve();
    }

    Promise.all([vpromise, apromise]).then(() => {
      return FFmpeg.merge({
        video: this.vpath,
        audio: this.apath,
        output: this.fpath,
        title: this.props.info.title,
      });
    }).then(() => {
      // Finally provide source to the main component.
      this.props.onLoad({
        path: this.fpath,
        // Will be useful later.
        title: this.props.info.title,
        // Private but useful (we hope ytdl guys did a good job to
        // escape all awkward characters).
        saveAs: this.props.info._filename,
      });
    }, err => {
      this.abort();
      this.setState({downloadingError: err});
    });
  },
  abort() {
    if (this.vreq) {
      // Seems like request's abort() causes exceptions sometimes, see:
      // <https://github.com/request/request/issues/1457>.
      try { this.vreq.abort(); } catch(e) { /* skip */ }
      delete this.vreq;
    }
    if (this.areq) {
      try { this.areq.abort(); } catch(e) { /* skip */ }
      delete this.areq;
    }
  },
  getVideoSize() {
    const format = this.props.format;
    return format.video.filesize ? showSize(format.video.filesize) : "unknown";
  },
  handleCancelClick() {
    this.abort();
    this.props.onCancel();
  },
  render() {
    const format = this.props.format;
    const audioNode = format.audio ? (
      <div>
        <div style={this.styles.br} />
        <div style={this.styles.text}>
          <span>Saving audio (</span>
          <span style={this.styles.size}>{showSize(this.state.adata)}</span>
          <span> of {showSize(format.audio.filesize)}):</span>
        </div>
        <progress
          value={this.state.adata}
          max={format.audio.filesize}
          style={this.styles.progress}
        />
      </div>
    ) : null;
    return (
      <div>
        <h2 style={this.styles.header}>{this.props.info.title}</h2>

        <ShowHide show={!this.state.downloadingError}>
          <div style={this.styles.text}>
            <span>Saving video (</span>
            <span style={this.styles.size}>{showSize(this.state.vdata)}</span>
            <span> of {this.getVideoSize()}):</span>
          </div>
          <progress
            value={this.state.vdata}
            max={format.video.filesize}
            style={this.styles.progress}
          />
          {audioNode}
        </ShowHide>

        <div style={this.styles.text}>
          {showErr(this.state.downloadingError)}
        </div>

        <div style={this.styles.br} />
        <ShowHide show={!!this.state.downloadingError}>
          <input
            value="Retry"
            type="button"
            style={this.styles.bigButton}
            onClick={this.download}
          />
        </ShowHide>
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
