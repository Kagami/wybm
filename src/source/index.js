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
import {ShowHide, setTitle} from "../util";

export default React.createClass({
  getInitialState() {
    return {};
  },
  componentWillMount() {
    let info = process.env.WYBM_DEBUG_INFO;
    let source = process.env.WYBM_DEBUG_SOURCE;
    if (info) {
      info = fs.readFileSync(info, {encoding: "utf-8"});
      this.handleInfoLoad(JSON.parse(info));
    } else if (source) {
      this.handleSourceLoad({path: source});
    }
  },
  handleInfoLoad(info) {
    setTitle(info.title);
    this.setState({info});
  },
  handleSourceLoad(source) {
    setTitle(source.path);
    this.props.onLoad(source);
  },
  handleFormatLoad(format) {
    this.setState({format});
  },
  handleCancel() {
    setTitle();
    this.setState({info: null, format: null});
  },
  render() {
    return (
      <Center>
        <ShowHide show={!this.state.info}>
          <Info
            onInfo={this.handleInfoLoad}
            onSource={this.handleSourceLoad}
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
