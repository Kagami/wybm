/**
 * Generate resulting WebM.
 * @module wybm/view/save
 */

import fs from "fs";
import path from "path";
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
    new Promise((resolve, reject) => {
      // Normally we should do this checks at the previous screen but OS
      // dialog will ask about identical file anyway so we would fail
      // here only in very rare cases.
      function normalize(s) {
        s = path.resolve(s);
        if (WIN_BUILD) s = s.toLowerCase();
        return s;
      }

      const input = this.props.source.path;
      const output = this.props.target.path;

      // Resolve relative paths and cases.
      if (normalize(input) === normalize(output)) {
        return reject(new Error("Input path equals to output"));
      }

      // Resolve symlinks and hardlinks.
      try {
        if (fs.statSync(input).ino === fs.statSync(output).ino) {
          return reject(new Error("Input file equals to output"));
        }
      } catch(e) {
        /* skip */
      }
      resolve();
    }).then(() => {
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
          width: this.props.stats.width,
          height: this.props.stats.height,
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
  handleOpenFolder() {
    global.nw.Shell.showItemInFolder(this.props.target.path);
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
        <ShowHide show={this.state.error}>
          <Text>{showErr(this.state.error)}</Text>
          <Br/>
          <BigButton value="Back" onClick={this.props.onAgain} />
        </ShowHide>
        <ShowHide show={this.state.done}>
          <Text>
            <span>All is done. Resulting size is </span>
            <span style={this.styles.size}>{showSize(this.state.size)}</span>
            {/*  >.<  <- :3 */}
            <span>.</span>
          </Text>
          <Br/>
          <BigButton
            value="Open"
            title="Open produced file"
            onClick={this.handleOpen}
          />
          <Br/>
          <BigButton
            value="Open folder"
            title="Open folder of the produced file"
            onClick={this.handleOpenFolder}
          />
          <Br/>
          <BigButton
            value="Back"
            title="Go back to previous screen"
            onClick={this.props.onAgain}
          />
          <Br/>
          <BigButton
            value="New file"
            title="Start with new file/URL"
            onClick={this.props.onClear}
          />
        </ShowHide>
      </Center>
    );
  },
});
