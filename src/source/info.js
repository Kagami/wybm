/**
 * Source info form. Returns either YouTube JSON or local file.
 * @module wybm/source/info
 */

import React from "react";
import YouTubeDL from "../youtube-dl";
import {ShowHide} from "../util";

export default React.createClass({
  getInitialState() {
    return {};
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
    // FIXME(Kagami): Validate youtube URL (see youtube-dl's regexp).
    // Don't allow playlists, channels, etc.
    this.setState({url: e.target.value});
  },
  handleInfoGet(e) {
    e.preventDefault();
    if (!this.state.url) return;
    this.setState({loadingInfo: true});
    YouTubeDL.getInfo(this.state.url).then(info => {
      this.props.onInfo(info);
    }, err => {
      this.setState({loadingInfo: false, loadingError: err});
    });
  },
  handleClearClick() {
    this.setState({loadingError: null, url: null});
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
          disabled={this.state.loadingInfo || !!this.state.loadingError}
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
            disabled={this.state.loadingInfo}
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
