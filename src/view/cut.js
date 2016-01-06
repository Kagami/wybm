/**
 * Cut/merge resulting WebM.
 * @module wybm/view/cut
 */

import fs from "fs";
import React from "react";
import FFmpeg from "../ffmpeg";
import {Center, Header, Text, Br, BigButton} from "../theme";
import {ShowHide, showErr, showSize} from "../util";

export default React.createClass({
  getInitialState() {
    return {};
  },
  componentDidMount() {
    FFmpeg.cut({
      input: this.props.source.path,
      output: this.props.target.path,
      start: this.props.start,
      end: this.props.end,
    }).then(() => {
      const size = fs.statSync(this.props.target.path).size;
      this.setState({size, done: true});
    }).catch(error => {
      this.setState({error});
    });
  },
  styles: {
    size: {
      color: "#999",
    },
  },
  handleOpen() {
    nw.Shell.openItem(this.props.target.path);
  },
  render() {
    return (
      <Center>
        <Header>{this.props.target.path}</Header>
        <ShowHide show={!this.state.error && !this.state.done}>
          <Text>Cutting…</Text>
          <Br/>
          <BigButton value="Cancel" onClick={this.props.onAgain} />
        </ShowHide>
        <ShowHide show={!!this.state.error}>
          <Text>{showErr(this.state.error)}</Text>
          <Br/>
          <BigButton value="Back" onClick={this.props.onAgain} />
        </ShowHide>
        <ShowHide show={!!this.state.done}>
          <Text>
            <span>All is done. Resulting size is </span>
            <span style={this.styles.size}>{showSize(this.state.size)}</span>
            {/*  >.<  <- :3 */}
            <span>.</span>
          </Text>
          <Br/>
          <BigButton value="Open" onClick={this.handleOpen} />
          <Br/>
          <BigButton value="Cut again" onClick={this.props.onAgain} />
          <Br/>
          <BigButton value="New file" onClick={this.props.onClear} />
        </ShowHide>
      </Center>
    );
  },
});
