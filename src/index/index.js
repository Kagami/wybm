/**
 * Entry point of the application.
 * @module wybm/index
 */

import tmp from "tmp";
import React from "react";
import ReactDOM from "react-dom";
import Source from "../source";
import View from "../view";
import * as dialog from "../dialog";
import {ShowHide, setTitle} from "../util";
import "./package.json.ejs";
import "./index.html.ejs";
import "file?name=[name].[ext]!./icon.png";
import "file?name=[name].[ext]!./opensans-regular.woff2";
import "file?name=[name].[ext]!./opensans-bold.woff2";

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

const mainWindow = window.nw.Window.get();
mainWindow.on("close", () => {
  dialog
    .confirm({title: "Are you sure you want to exit?", focusOK: true})
    .then(() => { mainWindow.close(true); });
});

ReactDOM.render(<Index/>, document.getElementById("wybm-index"));
