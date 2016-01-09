/**
 * Preview video and provide cut GUI.
 * @module wybm/view
 */

import {basename, extname} from "path";
import React from "react";
import Stats from "./stats";
import Player from "./player";
import Save from "./save";
import dialog from "../dialog";
import {VPaned, HPaned, Table, Text, Br, BigButton, FileButton} from "../theme";
import {ShowHide, showSize, showTime} from "../util";

export default React.createClass({
  getInitialState() {
    return {};
  },
  styles: {
    expand: {
      height: "100%",
    },
    left: {
      boxSizing: "border-box",
      width: 350,
      paddingLeft: 100,
    },
    right: {
      padding: 0,
      color: "#999",
    },
    clickable: {
      cursor: "pointer",
    },
    longText: {
      width: 250,
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    ops: {
      width: 350,
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
    name = name.slice(0, 40);
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
  handlePlayerClear() {
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
    const content = `
      <div>
        <style scoped>
          table{margin:0 auto}
          td:nth-child(2){color:#999;word-break:break-word}
        </style>
        <center><h3>File info</h3></center>
        <table>
        <tbody>
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
        </tbody>
        </table>
      </div>
    `;
    dialog.alert({title: "File info", content});
  },
  handleHelpClick() {
  },
  handleAutofitClick() {
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
                source={this.props.source}
                stats={this.state.stats}
                mstart={this.state.mstart}
                mend={this.state.mend}
                onMarkStart={this.handleMarkStart}
                onMarkEnd={this.handleMarkEnd}
                onClear={this.handlePlayerClear}
              />
              <HPaned>
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
                <div style={this.styles.ops}>
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
                    onClick={this.handleAutofitClick()}
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
            onClear={this.props.onClear}
          />
        </ShowHide>
      </div>
    );
  },
});
