/**
 * Download and merge source video.
 * @module wybm/source/download
 */

import fs from "fs";
import path from "path";
import http from "http";
import https from "https";
import assert from "assert";
import tmp from "tmp";
import React from "react";
import FFmpeg from "../ffmpeg";
import {ShowHide, showSize, showErr} from "../util";

export default React.createClass({
  getInitialState() {
    return {vdata: 0, adata: 0};
  },
  componentDidMount() {
    const tmpdir = tmp.dirSync({unsafeCleanup: true}).name;
    // TODO(Kagami): Keep title and original filename.
    this.fpath = path.join(tmpdir, "out.webm");
    this.vpath = path.join(tmpdir, "v.webm");
    this.apath = path.join(tmpdir, "a.webm");
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
  get(url, ...args) {
    // NOTE(Kagami): This is kinda vulnerable to SSRF attacks but
    // seems like emitting GET requests to local URLs is not that
    // dangerous.
    if (url.startsWith("https://")) {
      return https.get(url, ...args);
    } else if (url.startsWith("http://")) {
      return http.get(url, ...args);
    } else {
      assert(false, "Bad protocol");
    }
  },
  download() {
    this.setState({vdata: 0, adata: 0, downloadingError: null});
    const format = this.props.format;

    let vstream = fs.createWriteStream(this.vpath);
    let vpromise = new Promise((resolve, reject) => {
      this.vreq = this.get(format.video.url, res => {
        if (res.statusCode >= 400) {
          return reject(new Error(
            `Got ${res.statusCode} error while downloading video`
          ));
        }
        res.on("data", chunk => {
          this.setState({vdata: this.state.vdata + chunk.length});
        }).on("end", () => {
          if (this.state.vdata !== format.video.filesize) {
            return reject(new Error("Got wrong video data"));
          }
          resolve();
        }).on("error", err => {
          reject(err);
        });
        res.pipe(vstream);
      }).on("error", err => {
        reject(err);
      });
    });

    let astream = fs.createWriteStream(this.apath);
    let apromise = new Promise((resolve, reject) => {
      this.areq = this.get(format.audio.url, res => {
        if (res.statusCode >= 400) {
          return reject(new Error(
            `Got ${res.statusCode} error while downloading audio`
          ));
        }
        res.on("data", chunk => {
          this.setState({adata: this.state.adata + chunk.length});
        }).on("end", () => {
          if (this.state.adata !== format.audio.filesize) {
            return reject(new Error("Got wrong audio data"));
          }
          resolve();
        }).on("error", err => {
          reject(err);
        });
        res.pipe(astream);
      }).on("error", err => {
        reject(err);
      });
    });

    Promise.all([vpromise, apromise]).then(() => {
      return FFmpeg.merge({
        video: this.vpath,
        audio: this.apath,
        output: this.fpath,
      });
    }).then(() => {
      this.props.onLoad({path: this.fpath});
    }, err => {
      this.abort();
      this.setState({downloadingError: err});
    });
  },
  abort() {
    if (this.vreq) this.vreq.abort();
    if (this.areq) this.areq.abort();
  },
  handleCancelClick() {
    // TODO(Kagami): Confirmation.
    this.abort();
    this.props.onCancel();
  },
  render() {
    const format = this.props.format;
    return (
      <div>
        <h2 style={this.styles.header}>{this.props.info.title}</h2>

        <ShowHide show={!this.state.downloadingError}>
          <div style={this.styles.text}>
            <span>Saving video ({showSize(this.state.vdata)} </span>
            <span>of {showSize(format.video.filesize)}):</span>
          </div>
          <progress
            value={this.state.vdata}
            max={format.video.filesize}
            style={this.styles.progress}
          />
          <div style={this.styles.br} />
          <div style={this.styles.text}>
            <span>Saving audio ({showSize(this.state.adata)} </span>
            <span>of {showSize(format.audio.filesize)}):</span>
          </div>
          <progress
            value={this.state.adata}
            max={format.audio.filesize}
            style={this.styles.progress}
          />
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
