/**
 * Generate resulting WebM.
 * @module wybm/view/save
 */

import fs from "fs";
import tmp from "tmp";
import React from "react";
import FFmpeg from "../ffmpeg";
import {Center, Header, Text, Br, BigButton} from "../theme";
import {ShowHide, showErr, showSize} from "../util";

export default React.createClass({
  getInitialState() {
    return {};
  },
  componentDidMount() {
    let previewVideo;
    Promise.resolve().then(() => {
      const preview = this.props.preview;
      if (preview != null) {
        const isVideoInput = Number.isFinite(preview);
        const time = isVideoInput ? preview : null;
        const input = isVideoInput ? this.props.source.path : preview;
        previewVideo = tmp.fileSync({prefix: "wybm-", postfix: ".webm"}).name;
        return FFmpeg.preview({
          time,
          input,
          output: previewVideo,
          width: this.props.stats.width + 1,
          height: this.props.stats.height + 1,
        });
      }
    }).then(() => {
      return FFmpeg.cut({
        input: this.props.source.path,
        output: this.props.target.path,
        start: this.props.start,
        end: this.props.end,
        preview: previewVideo,
      });
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
    global.nw.Shell.openItem(this.props.target.path);
  },
  render() {
    return (
      <Center>
        <Header>{this.props.target.path}</Header>
        <ShowHide show={!this.state.error && !this.state.done}>
          <Text>Saving…</Text>
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
