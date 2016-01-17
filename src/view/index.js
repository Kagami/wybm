/**
 * Preview video and provide cut GUI.
 * @module wybm/view
 */

import {basename, extname} from "path";
import {format} from "util";
import React from "react";
import Stats from "./stats";
import Player from "./player";
import Save from "./save";
import HELP from "raw!./help.html";
import * as dialog from "../dialog";
import {VPaned, HPaned, Table, Text, Br, BigButton, FileButton} from "../theme";
import {ShowHide, showSize, showTime, toCapitalCase} from "../util";

export default React.createClass({
  getInitialState() {
    return {};
  },
  styles: {
    expand: {
      height: "100%",
    },
    left: {
      paddingRight: 30,
    },
    right: {
      padding: 0,
      color: "#999",
      minWidth: 150,
    },
    clickable: {
      cursor: "pointer",
    },
    longText: {
      maxWidth: 300,
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
  },
  checkMarks() {
    // We need this because we get initial marks only after "stats" and
    // "player" were loaded.
    return this.state.mstart != null && this.state.mend != null;
  },
  isMarkStartAtStart() {
    return this.state.mstart === 0;
  },
  isMarkEndAtEnd() {
    if (!this.checkMarks()) return;
    // NOTE(Kagami): It's not possible to cut only single last frame
    // this way (both [last .. EOF] and [START .. last-1] variants).
    // We hope this operation shouldn't be needed often because allowing
    // this special cases will make code more complicated.
    return this.state.mend === (this.state.stats.frames.length - 1);
  },
  getStartTime() {
    if (!this.checkMarks()) return;
    return this.state.stats.frames[this.state.mstart].time;
  },
  getEndTime() {
    if (!this.checkMarks()) return;
    return this.state.stats.frames[this.state.mend].time;
  },
  getEstimatedSize() {
    if (!this.checkMarks()) return;
    return (
      this.state.stats.frames[this.state.mend].pos -
      this.state.stats.frames[this.state.mstart].pos
    );
  },
  getDefaultName() {
    if (!this.checkMarks()) return;
    let name = this.props.source.saveAs || this.props.source.path;
    name = basename(name, extname(name));
    if (!this.isMarkStartAtStart() || !this.isMarkEndAtEnd()) {
      name += "_";
      name += showTime(this.getStartTime(), ".");
      name += "-";
      name += showTime(this.getEndTime(), ".");
    }
    name += ".webm";
    return name;
  },
  getStartText() {
    if (this.isMarkStartAtStart()) {
      return "not set";
    } else {
      return showTime(this.getStartTime());
    }
  },
  getEndText() {
    if (this.isMarkEndAtEnd()) {
      return "not set";
    } else {
      return showTime(this.getEndTime());
    }
  },
  getPreviewText() {
    const preview = this.state.preview;
    if (Number.isFinite(preview)) {
      return showTime(preview);
    } else if (preview != null) {
      return basename(preview);
    } else {
      return "not set";
    }
  },
  handleStatsLoad(stats) {
    const mstart = 0;
    const mend = stats.frames.length - 1;
    this.setState({stats, mstart, mend});
  },
  handleClear() {
    dialog
      .confirm({title: "Are you sure want to cancel editing?"})
      .then(this.props.onClear);
  },
  handleMarkStart(mstart) {
    this.setState({mstart});
  },
  handleMarkStartClear() {
    this.setState({mstart: 0});
  },
  handleMarkEnd(mend) {
    this.setState({mend});
  },
  handleMarkEndClear() {
    this.setState({mend: this.state.stats.frames.length - 1});
  },
  handleImagePreview(file) {
    this.setState({preview: file.path});
  },
  handleFramePreview() {
    this.setState({preview: this.refs.player.getTimeOf()});
  },
  handlePreviewClear() {
    this.setState({preview: null});
  },
  handleInfoClick() {
    const source = this.props.source;
    const stats = this.state.stats;
    const acodec = stats.acodec ? ("+" + toCapitalCase(stats.acodec)) : "";
    const content = `
      <div id="inner">
        <style scoped>
          #inner table{margin:0 auto}
          #inner td:nth-child(2){color:#999;word-break:break-word}
        </style>
        <center><h3>File info</h3></center>
        <table>
        <tr>
          <td width="150">Path:</td>
          <td>${source.path}</td>
        </td>
        <tr>
          <td>Size:</td>
          <td>${showSize(stats.size)}</td>
        </td>
        <tr>
          <td>Duration:</td>
          <td>${showTime(stats.duration)}</td>
        </td>
        <tr>
          <td>Resolution:</td>
          <td>${stats.width}x${stats.height}@${stats.fps}</td>
        </td>
        <tr>
          <td>Codecs:</td>
          <td>${stats.vcodec}${acodec}</td>
        </td>
        </table>
      </div>
    `;
    dialog.alert({title: "File info", content});
  },
  handleHelpClick() {
    const title = "Help on " + WYBM_VERSION;
    dialog.alert({
      title,
      height: 500,
      focusOK: false,
      content: format(HELP, title),
    });
  },
  handleAutofitClick() {
    const def = this.lastDefault || 19.5;
    dialog
      .prompt({title: "Enter desired file size (MiB):", default: def})
      .then(size => {
        this.lastDefault = size;
        size = +size * 1024 * 1024;
        if (!Number.isFinite(size) || size <= 0) return;
        const frames = this.state.stats.frames;
        const startPos = frames[this.state.mstart].pos;
        for (let i = this.state.mstart + 2; i < frames.length; i++) {
          // Mode "find fragment _not_ greater than X" is more useful
          // for us.
          if (frames[i].pos - startPos > size) {
            return this.setState({mend: i - 1});
          }
        }
        // Ok to fit up to the end.
        this.setState({mend: frames.length - 1});
      });
  },
  handleSaveClick(file) {
    this.refs.player.pause();
    this.setState({target: file});
  },
  handleViewAgain() {
    this.setState({target: null});
  },
  render() {
    return (
      <div style={this.styles.expand}>
        <ShowHide show={!this.state.stats}>
          <Stats
            source={this.props.source}
            onLoad={this.handleStatsLoad}
            onCancel={this.props.onClear}
          />
        </ShowHide>
        <ShowHide show={!!this.state.stats}>
          <ShowHide show={!this.state.target} style={this.styles.expand} viaCSS>
            <VPaned>
              <Player
                ref="player"
                height={this.state.videoHeight}
                source={this.props.source}
                stats={this.state.stats}
                mstart={this.state.mstart}
                mend={this.state.mend}
                onMarkStart={this.handleMarkStart}
                onMarkEnd={this.handleMarkEnd}
                onClear={this.handleClear}
              />
              <HPaned padding="20px 20px 21px 20px">
                <Text>
                  <Table>
                  <tr>
                    <td style={this.styles.left}>Start position:</td>
                    <td style={this.styles.right}>
                      <span
                        title="Clear"
                        style={this.styles.clickable}
                        onClick={this.handleMarkStartClear}
                      >
                        {this.getStartText()}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={this.styles.left}>End position:</td>
                    <td style={this.styles.right}>
                      <span
                        title="Clear"
                        style={this.styles.clickable}
                        onClick={this.handleMarkEndClear}
                      >
                        {this.getEndText()}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={this.styles.left}>Preview:</td>
                    <td style={this.styles.right}>
                      <div style={this.styles.longText}>
                        <span
                          title="Clear"
                          style={this.styles.clickable}
                          onClick={this.handlePreviewClear}
                        >
                          {this.getPreviewText()}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style={this.styles.left}>Estimated size:</td>
                    <td style={this.styles.right}>
                      {showSize(this.getEstimatedSize())}
                    </td>
                  </tr>
                  </Table>
                </Text>
                <div>
                  <FileButton
                    width={150}
                    value="Image pr."
                    title="Load image preview"
                    accept="image/*"
                    onChange={this.handleImagePreview}
                  />
                  <span> </span>
                  <BigButton
                    width={150}
                    value="Frame pr."
                    title="Use current video frame as a preview"
                    onClick={this.handleFramePreview}
                  />
                  <Br height={10} />
                  <BigButton
                    width={150}
                    value="File info"
                    title="Show file stats"
                    onClick={this.handleInfoClick}
                  />
                  <span> </span>
                  <BigButton
                    width={150}
                    value="Help"
                    title="Show program's help"
                    onClick={this.handleHelpClick}
                  />
                  <Br height={10} />
                  <BigButton
                    width={150}
                    value="Autofit"
                    title="Fit to limit from start position"
                    onClick={this.handleAutofitClick}
                  />
                  <span> </span>
                  <FileButton
                    width={150}
                    value="Save"
                    title="Save selected fragment to disk"
                    saveAs={this.getDefaultName()}
                    onChange={this.handleSaveClick}
                  />
                </div>
              </HPaned>
            </VPaned>
          </ShowHide>
        </ShowHide>
        <ShowHide show={!!this.state.target}>
          <Save
            source={this.props.source}
            target={this.state.target}
            stats={this.state.stats}
            start={this.isMarkStartAtStart() ? null : this.getStartTime()}
            end={this.isMarkEndAtEnd() ? null : this.getEndTime()}
            preview={this.state.preview}
            onAgain={this.handleViewAgain}
            onClear={this.handleClear}
          />
        </ShowHide>
      </div>
    );
  },
});
