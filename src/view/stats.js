/**
 * Analyze source video frames.
 * @module wybm/view/stats
 */

import React from "react";
import MKVToolNix from "../mkvtoolnix";
import {Center} from "../theme";
import {ShowHide, showErr} from "../util";

export default React.createClass({
  getInitialState() {
    return {};
  },
  componentDidMount() {
    MKVToolNix.getStats(this.props.source.path).then(stats => {
      this.props.onLoad(stats);
    }, error => {
      this.setState({error});
    });
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
    br: {
      height: 20,
    },
    bigButton: {
      fontSize: "30px",
      width: 200,
      cursor: "pointer",
    },
  },
  render() {
    return (
      <Center>
        <h2 style={this.styles.header}>{this.props.source.path}</h2>
        <ShowHide show={!this.state.error}>
          <div style={this.styles.text}>Gathering video info…</div>
        </ShowHide>
        <ShowHide show={!!this.state.error}>
          <div style={this.styles.text}>{showErr(this.state.error)}</div>
        </ShowHide>
        <div style={this.styles.br} />
        <input
          value="Cancel"
          type="button"
          style={this.styles.bigButton}
          onClick={this.props.onCancel}
        />
      </Center>
    );
  },
});
