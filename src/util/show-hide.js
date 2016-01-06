/**
 * Conditional display widget.
 * @module wybm/util/show-hide
 */

import React from "react";

// Taken from webm.js
export default React.createClass({
  propTypes: {
    show: React.PropTypes.bool,
    viaCSS: React.PropTypes.bool,
  },
  render() {
    if (this.props.viaCSS) {
      let style = this.props.show ? {} : {display: "none"};
      Object.assign(style, this.props.style);
      return <div style={style}>{this.props.children}</div>;
    } else {
      if (!this.props.show) return null;
      if (React.Children.count(this.props.children) > 1) {
        return <div {...this.props}>{this.props.children}</div>;
      } else {
        return this.props.children;
      }
    }
  },
});
