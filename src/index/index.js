/**
 * Entry point of the application.
 * @module wybm/index
 */

import tmp from "tmp";
import React from "react";
import ReactDOM from "react-dom";
import Source from "../source";
import View from "../view";
import {ShowHide, setTitle} from "../util";
import "file?name=[name].[ext]!./package.json";
import "file?name=[name].[ext]!./index.html";
import "file?name=[name].[ext]!./icon.png";

const Index = React.createClass({
  getInitialState() {
    return {};
  },
  styles: {
    main: {
      height: "100%",
      textAlign: "center",
    },
  },
  handleSourceLoad(source) {
    this.setState({source});
  },
  handleSourceClear() {
    setTitle();
    this.setState({source: null});
  },
  render() {
    return (
      <div style={this.styles.main}>
        <ShowHide show={!this.state.source}>
          <Source onLoad={this.handleSourceLoad} />
        </ShowHide>
        <ShowHide show={!!this.state.source}>
          <View source={this.state.source} onClear={this.handleSourceClear} />
        </ShowHide>
      </div>
    );
  },
});

tmp.setGracefulCleanup();
ReactDOM.render(<Index/>, document.getElementById("wybm-index"));
