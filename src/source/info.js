/**
 * Source info form. Returns either YouTube JSON or local file.
 * @module wybm/source/info
 */

import React from "react";
import XRegExp from "xregexp";
import YouTubeDL from "../youtube-dl";
import {ShowHide} from "../util";

export default React.createClass({
  getInitialState() {
    let clipboard = nw.Clipboard.get();
    const text = clipboard.get("text");
    // Try to auto-paste only link-like text, there is high chance of
    // false-positiveness with bare IDs.
    const url = (this.fixURL(text).startsWith("http") && this.checkURL(text))
      ? text
      : "";
    return {url};
  },
  componentDidMount() {
    let url = this.refs.url;
    url.setSelectionRange(url.value.length, url.value.length);
    url.scrollLeft = url.scrollWidth;
  },
  NBSP: "\u00a0",
  styles: {
    input: {
      fontSize: "30px",
      textAlign: "center",
      width: 500,
    },
    text: {
      marginBottom: 3,
      fontSize: "30px",
    },
    error: {
      marginBottom: 3,
      fontSize: "25px",
    },
    fileButton: {
      fontSize: "30px",
      width: 500,
      cursor: "pointer",
    },
    file: {
      display: "none",
    },
    bigButton: {
      fontSize: "30px",
      width: 200,
      cursor: "pointer",
    },
  },
  fixURL(url) {
    // Hack to forbid long bare IDs (previously allowed by removing of
    // "$" in checkURL).
    if (/^[0-9A-Za-z_-]{12,}$/.test(url)) return "";
    // ytdl doesn't support URLs without protocol but they may be rather
    // convenient to use. We fix it in separate function to avoid
    // messing with complex regexp.
    return (url.startsWith("youtu") || url.startsWith("www."))
      ? "https://" + url
      : url;
  },
  checkURL: (function() {
    // Taken from youtube-dl with several modifications:
    //
    // * Comments are removed (they are too long)
    // * "(?!.*?&list=)" at the end is removed (we want to support
    //   playlist video links via single regexp)
    // * "(?(1).+)?$" at the end is removed (not supported by JS)
    //
    // It will have few false-positives but it's not that bad.
    const yre = XRegExp(String.raw`(?x)^
      (
          (?:https?://|//)
          (?:(?:(?:(?:\w+\.)?[yY][oO][uU][tT][uU][bB][eE](?:-nocookie)?\.com/|
             (?:www\.)?deturl\.com/www\.youtube\.com/|
             (?:www\.)?pwnyoutube\.com/|
             (?:www\.)?yourepeat\.com/|
             tube\.majestyc\.net/|
             youtube\.googleapis\.com/)
          (?:.*?\#/)?
          (?:
              (?:(?:v|embed|e)/(?!videoseries))
              |(?:
                  (?:(?:watch|movie)(?:_popup)?(?:\.php)?/?)?
                  (?:\?|\#!?)
                  (?:.*?[&;])??
                  v=
              )
          ))
          |(?:
             youtu\.be|
             vid\.plus
          )/
          |(?:www\.)?cleanvideosearch\.com/media/action/yt/watch\?videoId=
          )
      )?
      ([0-9A-Za-z_-]{11})
    `);
    return function(url) {
      return yre.test(this.fixURL(url));
    };
  })(),
  getText() {
    const err = this.state.loadingError;
    return this.state.url
      ? (err ? err.message : this.NBSP)
      : "- or -";
  },
  getTextStyle() {
    return this.state.loadingError ? this.styles.error : this.styles.text;
  },
  handleFileButtonClick() {
    this.refs.file.click();
  },
  handleFileLoad() {
    const file = this.refs.file.files[0];
    this.props.onSource({path: file.path});
  },
  handleURLChange(e) {
    this.setState({url: e.target.value});
  },
  handleInfoGet(e) {
    e.preventDefault();
    if (!this.state.url) return;
    this.setState({loadingInfo: true});
    YouTubeDL.getInfo(this.fixURL(this.state.url)).then(info => {
      this.props.onInfo(info);
    }, err => {
      this.setState({loadingInfo: false, loadingError: err});
    });
  },
  handleClearClick() {
    this.setState({loadingError: null, url: ""});
    // We can't focus disabled input and state updates will be flushed
    // only on a next tick. This is a bit hacky.
    this.refs.url.disabled = false;
    this.refs.url.focus();
  },
  render() {
    return (
      <form onSubmit={this.handleInfoGet}>
        <input
          autoFocus
          ref="url"
          type="text"
          style={this.styles.input}
          placeholder="Enter YouTube URL"
          value={this.state.url}
          onChange={this.handleURLChange}
          disabled={this.state.loadingInfo || this.state.loadingError}
        />

        <div style={this.getTextStyle()}>{this.getText()}</div>

        <ShowHide show={!this.state.url}>
          <input
            type="button"
            style={this.styles.fileButton}
            onClick={this.handleFileButtonClick}
            value="Select WebM file"
          />
        </ShowHide>
        <input
          ref="file"
          type="file"
          onChange={this.handleFileLoad}
          style={this.styles.file}
          accept="video/webm"
        />

        <ShowHide show={this.state.url && !this.state.loadingError}>
          <input
            type="submit"
            style={this.styles.bigButton}
            value="Get info"
            disabled={this.state.loadingInfo || !this.checkURL(this.state.url)}
          />
        </ShowHide>
        <ShowHide show={this.state.url && this.state.loadingError}>
          <input
            value="Clear"
            type="button"
            style={this.styles.bigButton}
            onClick={this.handleClearClick}
          />
        </ShowHide>
      </form>
    );
  },
});
