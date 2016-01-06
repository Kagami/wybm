/**
 * Enhanced video element for wybm needs.
 * @module wybm/view/player
 */

import React from "react";
import ReactDOM from "react-dom";
import {parseTime, showTime, tryRun} from "../util";

// TODO(Kagami): Show filename in window's title.
export default React.createClass({
  getInitialState() {
    this.frames = this.props.stats.frames;
    this.lastFramen = this.frames.length - 1;
    this.lastFrame = this.frames[this.lastFramen];

    // Needed for slider ticks.
    this.keyframes = [];
    this.frames.forEach((f, i) => {
      if (f.key) this.keyframes.push(i);
    });

    // Speedup search.
    let prev = 0;
    const nsec = Math.floor(this.lastFrame.time) + 1;
    this.framesBySec = Array(nsec).fill().map(_ => []);
    this.frames.forEach(f => {
      const sec = Math.floor(f.time);
      this.framesBySec[sec].push(f);
      // To prevent situations like:
      // "frame1(1.8) < currentTime(1.9) < frame2(2.0)"
      // Frame PTS are always monothonic as ensured by mkvtoolnix
      // module.
      if (sec > prev) this.framesBySec[prev].push(f);
      prev = sec;
    });

    return {framen: 0, mstart: 0, mend: this.lastFramen};
  },
  componentWillMount() {
    this.props.onMarkStart(this.state.mstart);
    this.props.onMarkEnd(this.state.mend);
    this.setTimeOf(this.state.framen);
  },
  componentDidMount() {
    document.addEventListener("keydown", this.handleDocumentKey, false);
    this.getVideoNode().addEventListener(
      "playing", this.handlePlayEvent, false
    );
    this.getVideoNode().addEventListener(
      "pause", this.handlePauseEvent, false
    );
    this.getVideoNode().addEventListener(
      "timeupdate", this.handleSeekEvent, false
    );
    this.getVideoNode().addEventListener(
      "webkitfullscreenchange", this.handleFullscreenEvent, false
    );
  },
  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleDocumentKey, false);
  },
  KEY_ESC: 27,
  KEY_SPACE: 32,
  KEY_ENTER: 13,
  KEY_LEFT: 37,
  KEY_RIGHT: 39,
  KEY_COMMA: 188,
  KEY_DOT: 190,
  KEY_F: 70,
  getVideoNode() {
    return ReactDOM.findDOMNode(this.refs.video);
  },
  getVideoURL() {
    return "file://" + this.props.source.path;
  },
  isMarkStartDisabled() {
    return (
      this.state.framen == this.state.mstart ||
      this.state.framen >= this.state.mend ||
      !this.frames[this.state.framen].key
    );
  },
  isMarkEndDisabled() {
    return (
      this.state.framen == this.state.mend ||
      this.state.framen <= this.state.mstart
    );
  },
  setTimeOf(framen) {
    const time = this.frames[framen].time;
    const prettyTime = showTime(time);
    const validTime = true;
    this.setState({prettyTime, validTime});
  },
  togglePlay() {
    const action = this.state.playing ? "pause" : "play";
    this.getVideoNode()[action]();
  },
  toggleFullscreen() {
    if (this.state.fullscreen) {
      document.webkitExitFullscreen();
    } else {
      this.getVideoNode().webkitRequestFullscreen();
    }
  },
  toggleKeySeek() {
    this.setState({keySeek: !this.state.keySeek});
  },
  pause() {
    this.getVideoNode().pause();
  },
  seek(time) {
    if (!Number.isFinite(time)) {
      // Improve experience by changing slider pos immediately.
      this.setState({framen: time.index});
      time = time.time;
    }
    // NOTE(Kagami): This is rather slow even if we seek to keyframe and
    // Chrome doesn't have "fastSeek" unfortunately. Is there some
    // better way to quickly change video position?
    this.getVideoNode().currentTime = time;
  },
  handleDocumentKey(e) {
    switch (e.keyCode) {
    case this.KEY_SPACE:
      this.togglePlay();
      break;
    case this.KEY_ESC:
      if (this.state.fullscreen) this.toggleFullscreen();
      break;
    case this.KEY_COMMA:
      if (this.state.framen > 0) {
        this.seek(this.frames[this.state.framen-1]);
      }
      break;
    case this.KEY_DOT:
      if (this.state.framen < this.lastFramen) {
        this.seek(this.frames[this.state.framen+1]);
      }
      break;
    case this.KEY_LEFT:
      for (let i = this.state.framen-1; i >= 0; i--) {
        const frame = this.frames[i];
        if (frame.key) {
          this.seek(frame);
          break;
        }
      }
      break;
    case this.KEY_RIGHT:
      for (let i = this.state.framen+1; i <= this.lastFramen; i++) {
        const frame = this.frames[i];
        if (frame.key) {
          this.seek(frame);
          break;
        }
      }
      break;
    case this.KEY_F:
      this.toggleFullscreen();
      break;
    }
  },
  handlePlayEvent() {
    this.setState({playing: true});
  },
  handlePauseEvent() {
    this.setState({playing: false});
  },
  handleSeekEvent() {
    if (this.seekDrag) return;
    // NOTE(Kagami): We're not relying on reported timestamps by
    // <video> because time in timeupdate events is not accurate
    // (doesn't correspond to the frame PTS). So we're trying to find
    // best fit in order to pass those values to mkvmerge later.
    const time = this.getVideoNode().currentTime;
    const sec = Math.floor(time);
    const secframes = this.framesBySec[sec] || [];
    for (let i = 0; i < secframes.length; i++) {
      const secframe = secframes[i];
      if (secframe.time >= time) {
        this.setTimeOf(secframe.index);
        this.setState({framen: secframe.index});
        return;
      }
    }
    // This place is only reached at the very end of file - browser
    // emits timeupdate event with currentTime = video duration, but
    // last frame has non-zero duration so it's not matched by the loop
    // above. This is safe to set current pos to last frame though.
    this.setTimeOf(this.lastFramen);
    this.setState({framen: this.lastFramen});
  },
  handleFullscreenEvent() {
    this.setState({fullscreen: !this.state.fullscreen});
  },
  handleMarkStart() {
    this.setState({mstart: this.state.framen});
    this.props.onMarkStart(this.state.framen);
  },
  handleMarkEnd() {
    this.setState({mend: this.state.framen});
    this.props.onMarkEnd(this.state.framen);
  },
  handleTimeKey(e) {
    e.stopPropagation();
    // See <https://stackoverflow.com/a/24421834>.
    e.nativeEvent.stopImmediatePropagation();
    switch (e.keyCode) {
    case this.KEY_ENTER:
      if (this.state.validTime) this.seek(parseTime(this.state.prettyTime))
      break;
    }
  },
  handleTimeChange(e) {
    const prettyTime = e.target.value;
    const time = tryRun(parseTime, prettyTime);
    const validTime = time != null && time <= this.lastFrame.time;
    this.setState({prettyTime, validTime});
  },
  handleSeekMouseDown() {
    this.seekDrag = true;
  },
  handleSeekChange(e) {
    const framen = e.target.value;
    const frame = this.frames[framen];
    if (frame.key || !this.state.keySeek) {
      this.setTimeOf(framen);
      this.seek(frame);
    }
  },
  handleSeekMouseUp() {
    this.seekDrag = false;
    if (this.state.keySeek && !this.frames[this.state.framen].key) {
      for (let i = this.state.framen; i >= 0; i--) {
        const frame = this.frames[i];
        if (frame.key) {
          this.seek(frame);
          break;
        }
      }
    }
  },
  handleSeekKey(e) {
    e.preventDefault();
  },
  render() {
    // TODO(Kagami): Confirmation for cancel.
    return (
      <div>
        <Video
          ref="video"
          src={this.getVideoURL()}
          onClick={this.togglePlay}
          onDoubleClick={this.toggleFullscreen}
        />
        <Controls>
          <Control
            value={this.state.playing ? "▮▮" : "▶"}
            title="Play/pause"
            onClick={this.togglePlay}
          />
          <Control
            value="⧏"
            title="Mark fragment start"
            disabled={this.isMarkStartDisabled()}
            onClick={this.handleMarkStart}
          />
          <Time
            value={this.state.prettyTime}
            onChange={this.handleTimeChange}
            onKeyDown={this.handleTimeKey}
          />
          <Control
            value="⧐"
            title="Mark fragment end"
            disabled={this.isMarkEndDisabled()}
            onClick={this.handleMarkEnd}
          />
          <Control
            value="⚷"
            title="Toggle keyframe seeking"
            onClick={this.toggleKeySeek}
            pressed={this.state.keySeek}
          />
          <Control
            right
            value="⏏"
            title="Cancel editing"
            onClick={this.props.onClear}
          />
          <Seek
            value={this.state.framen}
            max={this.lastFramen}
            keyframes={this.keyframes}
            onMouseDown={this.handleSeekMouseDown}
            onChange={this.handleSeekChange}
            onMouseUp={this.handleSeekMouseUp}
            onKeyDown={this.handleSeekKey}
          />
        </Controls>
      </div>
    );
  },
});

// Player sub-elements.

const Video = React.createClass({
  styles: {
    main: {
      display: "block",
      width: "100%",
    },
  },
  render() {
    return <video style={this.styles.main} {...this.props} />;
  },
});

const Controls = React.createClass({
  styles: {
    main: {
      padding: "5px 0 5px 5px",
      backgroundColor: "#fff",
      border: "solid #ccc",
      borderWidth: "1px 0",
    },
  },
  render() {
    return <div style={this.styles.main}>{this.props.children}</div>;
  },
});

const Control = React.createClass({
  styles: {
    main: {
      cursor: "pointer",
      width: 50,
      height: 36,
      marginRight: 5,
      fontSize: "18px",
      verticalAlign: "top",
      border: 0,
    },
  },
  getStyles() {
    const float = this.props.right ? "right" : "left";
    const backgroundColor = this.props.pressed ? "#ccc" : "#fff";
    return Object.assign({float, backgroundColor}, this.styles.main);
  },
  handleKey(e) {
    e.preventDefault();
  },
  render() {
    return (
      <input
        type="button"
        style={this.getStyles()}
        className="wybm-view-player-control"
        onKeyDown={this.handleKey}
        {...this.props}
      />
    );
  },
});

const Time = React.createClass({
  styles: {
    main: {
      width: 120,
      height: 36,
      verticalAlign: "top",
      boxSizing: "border-box",
      textAlign: "center",
      fontSize: "22px",
      float: "left",
      marginRight: 5,
      border: "1px solid #ccc",
      color: "#444",
    },
  },
  render() {
    return (
      <input
        type="text"
        maxLength={9}
        style={this.styles.main}
        className="wybm-view-player-time"
        {...this.props}
      />
    );
  },
});

const Seek = React.createClass({
  styles: {
    // TODO(Kagami): Use flex instead of block/float hack.
    main: {
      display: "block",
      overflow: "hidden",
      padding: "0 10px",
    },
    range: {
      display: "block",
      width: "100%",
      height: 36,
      margin: 0,
      cursor: "pointer",
      backgroundColor: "#fff",
      WebkitAppearance: "none",
    },
  },
  render() {
    return (
      <div style={this.styles.main}>
        <input
          type="range"
          list="keyframes"
          style={this.styles.range}
          {...this.props}
        />
        <datalist id="keyframes">
        {this.props.keyframes.map(i => <option key={i}>{i}</option>)}
        </datalist>
      </div>
    );
  },
});
