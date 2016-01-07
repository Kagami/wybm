/**
 * Theme-related variables and components.
 * @module wybm/theme
 */

import React from "react";

/**
 * Vertically centered div using
 * <https://css-tricks.com/centering-in-the-unknown/> technique.
 */
export const Center = React.createClass({
  styles: {
    outer: {
      height: "100%",
    },
    ghost: {
      display: "inline-block",
      verticalAlign: "middle",
      height: "100%",
    },
    inner: {
      display: "inline-block",
      verticalAlign: "middle",
    },
  },
  render() {
    return (
      <div style={this.styles.outer}>
        <div style={this.styles.ghost}></div>
        <div style={this.styles.inner}>
          {this.props.children}
        </div>
      </div>
    );
  },
});

/** Vertically aligned pane widget similar to gtk's. */
export const VPaned = React.createClass({
  styles: {
    outer: {
      width: "100%",
      height: "100%",
      borderSpacing: 0,
    },
    inner: {
      padding: 0,
      verticalAlign: "middle",
    },
  },
  getInnerStyle(i) {
    // XXX(Kagami): This widget is used only in one place so it's ok to
    // have such hacks. Currently we need to vertically center all
    // columns except the first one so we make it as small as possible.
    const style = i === 0 ? {height: 1} : {};
    return Object.assign(style, this.styles.inner);
  },
  render() {
    return (
      <table style={this.styles.outer}>
        <tbody>
        {React.Children.map(this.props.children, (col, i) =>
          <tr><td style={this.getInnerStyle(i)}>{col}</td></tr>
        )}
        </tbody>
      </table>
    );
  },
});

/** Horizontally aligned pane widget similar to gtk's. */
export const HPaned = React.createClass({
  styles: {
    outer: {
      width: "100%",
      height: "100%",
      borderSpacing: 0,
    },
    inner: {
      padding: 0,
    },
  },
  render() {
    return (
      <table style={this.styles.outer}>
        <tbody>
          <tr>
          {React.Children.map(this.props.children, row =>
            <td style={this.styles.inner}>{row}</td>
          )}
          </tr>
        </tbody>
      </table>
    );
  },
});

/** Simple helper. */
export const Br = React.createClass({
  render() {
    const style = {height: this.props.height || 20};
    return <div style={style} />;
  },
});

/** Common theme text. */
export const Text = React.createClass({
  styles: {
    main: {
      fontSize: "25px",
    },
  },
  render() {
    return (
      <div style={this.styles.main} {...this.props}>
        {this.props.children}
      </div>
    );
  },
});

/** Common theme button. */
export const BigButton = React.createClass({
  styles: {
    main: {
      fontSize: "30px",
      width: 200,
      cursor: "pointer",
    },
  },
  render() {
    return <input type="button" style={this.styles.main} {...this.props} />;
  },
});

/** Simple table markup in order to avoid boilerplate. */
export const Table = React.createClass({
  styles: {
    main: {
      margin: "0 auto",
      textAlign: "left",
    },
  },
  render() {
    return (
      <table style={this.styles.main}>
        <tbody>
          {this.props.children}
        </tbody>
      </table>
    );
  },
});

/** Common theme header. */
export const Header = React.createClass({
  styles: {
    main: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
    },
  },
  render() {
    return <h2 style={this.styles.main}>{this.props.children}</h2>;
  },
});

export const FileButton = React.createClass({
  componentDidMount() {
    // Non-standard dialog provided by NW.js.
    if (this.props.saveAs) {
      this.refs.file.setAttribute("nwsaveas", this.props.saveAs);
    }
  },
  componentDidUpdate() {
    if (this.props.saveAs) {
      this.refs.file.setAttribute("nwsaveas", this.props.saveAs);
    }
  },
  styles: {
    file: {
      display: "none",
    },
  },
  handleFileButtonClick() {
    this.refs.file.click();
  },
  handleFileChange() {
    // TODO(Kagami): For some reason there is noticeable delay between
    // "save" click inside file dialog and "onchange" event. NW issue?
    const file = this.refs.file.files[0];
    this.refs.file.value = null;
    this.props.onChange(file);
  },
  render() {
    return (
      <div>
        <BigButton
          onClick={this.handleFileButtonClick}
          {...this.props}
        />
        <input
          ref="file"
          type="file"
          onChange={this.handleFileChange}
          style={this.styles.file}
          accept={this.props.accept}
        />
      </div>
    );
  },
});
