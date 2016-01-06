/**
 * Preview video and provide cut GUI.
 * @module wybm/view
 */

import {basename} from "path";
import React from "react";
import Stats from "./stats";
import Player from "./player";
import Cut from "./cut";
import {VPaned, Table, Text, Br, BigButton, SaveAs} from "../theme";
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
      width: 220,
    },
    right: {
      width: 150,
      color: "#999",
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
      this.state.stats.frames[this.state.mend  ].pos -
      this.state.stats.frames[this.state.mstart].pos
    );
  },
  getDefaultName() {
    if (!this.checkMarks()) return;
    let name = this.props.source.title;
    name = name || basename(this.props.source.path, ".webm");
    name = name.slice(0, 40);
    if (!this.isMarkStartAtStart() || !this.isMarkEndAtEnd()) {
      name += "_";
      name += showTime(this.getStartTime(), ".");
      name += "-";
      name += showTime(this.getEndTime(), ".");
    }
    name += "_cut.webm";
    return name;
  },
  handleStatsLoad(stats) {
    this.setState({stats});
  },
  handleMarkStart(mstart) {
    this.setState({mstart});
  },
  handleMarkEnd(mend) {
    this.setState({mend});
  },
  handleCutClick(file) {
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
                onMarkStart={this.handleMarkStart}
                onMarkEnd={this.handleMarkEnd}
                onClear={this.props.onClear}
              />
              <Text>
                <Table>
                <tr>
                  <td style={this.styles.left}>Start position:</td>
                  <td style={this.styles.right}>
                    {showTime(this.getStartTime())}
                  </td>
                </tr>
                <tr>
                  <td style={this.styles.left}>End position:</td>
                  <td style={this.styles.right}>
                    {showTime(this.getEndTime())}
                  </td>
                </tr>
                <tr>
                  <td style={this.styles.left}>Estimated size:</td>
                  <td style={this.styles.right}>
                    {showSize(this.getEstimatedSize())}
                  </td>
                </tr>
                </Table>
                <Br/>
                <SaveAs
                  value="Cut"
                  onLoad={this.handleCutClick}
                  defaultName={this.getDefaultName()}
                />
              </Text>
            </VPaned>
          </ShowHide>
        </ShowHide>
        <ShowHide show={!!this.state.target}>
          <Cut
            source={this.props.source}
            target={this.state.target}
            start={this.isMarkStartAtStart() ? null : this.getStartTime()}
            end={this.isMarkEndAtEnd() ? null : this.getEndTime()}
            onAgain={this.handleViewAgain}
            onClear={this.props.onClear}
          />
        </ShowHide>
      </div>
    );
  },
});
