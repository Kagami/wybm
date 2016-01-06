/**
 * Download source from given youtube url or use local file.
 * @module wybm/source
 */

import fs from "fs";
import React from "react";
import Info from "./info";
import Format from "./format";
import Download from "./download";
import {Center} from "../theme";
import {ShowHide} from "../util";

export default React.createClass({
  getInitialState() {
    let info = process.env.WYBM_DEBUG_INFO;
    if (info) {
      info = fs.readFileSync(info, {encoding: "utf-8"});
      info = JSON.parse(info);
    }
    return {info};
  },
  handleInfoLoad(info) {
    this.setState({info});
  },
  handleFormatLoad(format) {
    this.setState({format});
  },
  handleCancel() {
    this.setState({info: null, format: null});
  },
  render() {
    return (
      <Center>
        <ShowHide show={!this.state.info}>
          <Info
            onInfo={this.handleInfoLoad}
            onSource={this.props.onLoad}
          />
        </ShowHide>
        <ShowHide show={!!this.state.info && !this.state.format}>
          <Format
            info={this.state.info}
            onLoad={this.handleFormatLoad}
            onCancel={this.handleCancel}
          />
        </ShowHide>
        <ShowHide show={!!this.state.format}>
          <Download
            info={this.state.info}
            format={this.state.format}
            onLoad={this.props.onLoad}
            onCancel={this.handleCancel}
          />
        </ShowHide>
      </Center>
    );
  },
});
