/**
 * Enhanced video element for wybm needs.
 * @module wybm/view/player
 */

import React from "react";
import {parseTime, showTime, tryRun} from "../util";
import PLAY from "file?name=[name].[ext]!./play.svg";
import PAUSE from "file?name=[name].[ext]!./pause.svg";
import SCISSORS from "file?name=[name].[ext]!./scissors.svg";
import REPEAT from "file?name=[name].[ext]!./repeat.svg";
import VOLUME_UP from "file?name=[name].[ext]!./volume-up.svg";
import VOLUME_OFF from "file?name=[name].[ext]!./volume-off.svg";
import EJECT from "file?name=[name].[ext]!./eject.svg";

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
    this.framesBySec = Array(nsec).fill().map(() => []);
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

    return {framen: 0};
  },
  componentWillMount() {
    this.setTimeOf(this.state.framen);
  },
  componentDidMount() {
    document.addEventListener("keydown", this.handleDocumentKey, false);
    this.getVideoNode().addEventListener(
      "webkitfullscreenchange", this.handleFullscreenEvent, false
    );
    this.handleVolumeEvent();
  },
  componentWillUnmount() {
    this.getVideoNode().removeEventListener(
      "webkitfullscreenchange", this.handleFullscreenEvent, false
    );
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
  styles: {
    main: {
      position: "relative",
      height: "100%",
    },
  },
  getVideoNode() {
    return this.refs.video.getNode();
  },
  getVideoURL() {
    return "file://" + this.props.source.path;
  },
  getTimeOf(framen) {
    if (framen == null) framen = this.state.framen;
    return this.frames[framen].time;
  },
  isMarkStartDisabled() {
    return (
      this.state.framen === this.props.mstart ||
      this.state.framen >= this.props.mend ||
      !this.frames[this.state.framen].key
    );
  },
  isMarkEndDisabled() {
    return (
      this.state.framen === this.props.mend ||
      this.state.framen <= this.props.mstart
    );
  },
  // "Stupid" play/pause actions.
  play() {
    this.getVideoNode().play();
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
  setTimeOf(framen) {
    const time = this.frames[framen].time;
    const prettyTime = showTime(time);
    const validTime = true;
    this.setState({prettyTime, validTime});
  },
  // "Smart" play/pause action.
  togglePlay() {
    const time = this.getVideoNode().currentTime;
    const action = this.state.playing ? "pause" : "play";
    if (action === "play" &&
        this.state.loopCut &&
        (time < this.frames[this.props.mstart].time ||
         time >= this.frames[this.props.mend].time)) {
      this.seek(this.frames[this.props.mstart]);
    } else if (action === "play" && time >= this.frames[this.lastFramen].time) {
      // If we have e.g. video with duration = 3s which consists of
      // frames with timestamps [0s, 1s, 2s] then if currentTime is at
      // 2s and playing is false, play() call will set currentTime to 3s
      // and playing to false again. This is not what we probably want.
      this.seek(this.frames[0]);
    }
    this[action]();
  },
  toggleFullscreen() {
    if (this.state.fullscreen) {
      document.webkitExitFullscreen();
    } else {
      this.getVideoNode().webkitRequestFullscreen();
    }
  },
  toggleLoopCut() {
    this.setState({loopCut: !this.state.loopCut});
  },
  /* eslint-disable space-infix-ops */
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
  /* eslint-enable space-infix-ops */
  handlePlayEvent() {
    this.setState({playing: true});
  },
  handlePauseEvent() {
    this.setState({playing: false});
  },
  handleSeekEvent() {
    if (this.seekDrag) return;
    const time = this.getVideoNode().currentTime;
    if (this.state.playing &&
        this.state.loopCut &&
        (time < this.frames[this.props.mstart].time ||
         time >= this.frames[this.props.mend].time)) {
      this.seek(this.frames[this.props.mstart]);
      this.play();
      return;
    }
    // NOTE(Kagami): We're not relying on reported timestamps by
    // <video> because time in timeupdate events is not accurate
    // (doesn't correspond to the frame PTS). So we're trying to find
    // best fit in order to pass those values to ffmpeg later.
    const sec = Math.floor(time);
    const secframes = this.framesBySec[sec] || [];
    for (let i = 0; i < secframes.length; i++) {
      const frame = secframes[i];
      if (frame.time >= time) {
        this.setTimeOf(frame.index);
        this.setState({framen: frame.index});
        return;
      }
    }
    // This place is only reached at the very end of file: browser emits
    // timeupdate event with currentTime = video duration, but last
    // frame has non-zero duration so it's not matched by the loop
    // above. This is safe to set current pos to last frame though.
    this.setTimeOf(this.lastFramen);
    this.setState({framen: this.lastFramen});
  },
  handleVolumeEvent() {
    const {volume, muted} = this.getVideoNode();
    // Pass-through to sub-component.
    this.refs.volume.handleVolumeEvent({volume, muted});
  },
  handleWheelEvent(e) {
    let video = this.getVideoNode();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    video.volume = Math.min(Math.max(0, video.volume + delta), 1);
    video.muted = false;
  },
  handleFullscreenEvent() {
    this.setState({fullscreen: !this.state.fullscreen});
  },
  handleMarkStart() {
    this.props.onMarkStart(this.state.framen);
  },
  handleMarkEnd() {
    this.props.onMarkEnd(this.state.framen);
  },
  handleTimeKey(e) {
    e.stopPropagation();
    // See <https://stackoverflow.com/a/24421834>.
    e.nativeEvent.stopImmediatePropagation();
    switch (e.keyCode) {
    case this.KEY_ENTER:
      if (this.state.validTime) this.seek(parseTime(this.state.prettyTime));
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
    this.setTimeOf(framen);
    this.seek(frame);
  },
  handleSeekMouseUp() {
    this.seekDrag = false;
  },
  handleSeekKey(e) {
    e.preventDefault();
  },
  handleControlVolumeChange({volume, muted}) {
    let video = this.getVideoNode();
    video.volume = volume;
    video.muted = muted;
  },
  render() {
    // TODO(Kagami): Confirmation for cancel.
    return (
      <div style={this.styles.main} onWheel={this.handleWheelEvent}>
        <Video
          ref="video"
          src={this.getVideoURL()}
          onClick={this.togglePlay}
          onPlaying={this.handlePlayEvent}
          onPause={this.handlePauseEvent}
          onTimeUpdate={this.handleSeekEvent}
          onVolumeChange={this.handleVolumeEvent}
          onDoubleClick={this.toggleFullscreen}
        />
        <Controls>
          <Control
            icon={this.state.playing ? "pause" : "play"}
            title="Play/pause"
            onClick={this.togglePlay}
          />
          <Control
            flip
            icon="scissors"
            title="Mark fragment start"
            disabled={this.isMarkStartDisabled()}
            onClick={this.handleMarkStart}
          />
          <Time
            value={this.state.prettyTime}
            invalid={!this.state.validTime}
            onChange={this.handleTimeChange}
            onKeyDown={this.handleTimeKey}
          />
          <Control
            icon="scissors"
            title="Mark fragment end"
            disabled={this.isMarkEndDisabled()}
            onClick={this.handleMarkEnd}
          />
          <Control
            icon="repeat"
            title="Toggle fragment looping"
            onClick={this.toggleLoopCut}
            pressed={this.state.loopCut}
          />
          <Control
            right
            icon="eject"
            title="Cancel editing"
            onClick={this.props.onClear}
          />
          <Volume
            ref="volume"
            onChange={this.handleControlVolumeChange}
          />
          <Seek
            value={this.state.framen}
            max={this.lastFramen}
            mstart={this.props.mstart}
            mend={this.props.mend}
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
    outer: {
      position: "absolute",
      width: "100%",
      top: 0,
      bottom: 48,
      background: "#000",
    },
    video: {
      display: "block",
      width: "100%",
      height: "100%",
    },
  },
  getNode() {
    return this.refs.video;
  },
  render() {
    return (
      <div style={this.styles.outer}>
        <video ref="video" style={this.styles.video} {...this.props} />
      </div>
    );
  },
});

const Controls = React.createClass({
  styles: {
    main: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
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
  cid: "wybm-view-player-control",
  ICON_PATH: {
    play: PLAY,
    pause: PAUSE,
    scissors: SCISSORS,
    repeat: REPEAT,
    volume_up: VOLUME_UP,
    volume_off: VOLUME_OFF,
    eject: EJECT,
  },
  styles: {
    main: {
      cursor: "pointer",
      width: 50,
      height: 36,
      marginRight: 5,
      fontSize: "18px",
      verticalAlign: "top",
      border: 0,
      backgroundRepeat: "no-repeat",
      backgroundSize: 18,
      backgroundPosition: "16px 9px",
    },
  },
  getStyles() {
    const float = this.props.right ? "right" : "left";
    const transform = this.props.flip ? "scaleX(-1)" : "none";
    const backgroundImage = `url(${this.ICON_PATH[this.props.icon]})`;
    return Object.assign({float, transform, backgroundImage}, this.styles.main);
  },
  getClassName() {
    let name = this.cid;
    if (this.props.pressed) name += ` ${this.cid}_pressed`;
    return name;
  },
  handleKey(e) {
    e.preventDefault();
  },
  render() {
    return (
      <input
        type="button"
        style={this.getStyles()}
        className={this.getClassName()}
        onKeyDown={this.handleKey}
        {...this.props}
      />
    );
  },
});

const Volume = React.createClass({
  getInitialState() {
    return {};
  },
  styles: {
    main: {
      float: "right",
      position: "relative",
    },
    slider: {
      position: "absolute",
      width: 80,
      height: 20,
      left: -16,
      bottom: 66,
      margin: 0,
      cursor: "pointer",
      WebkitAppearance: "none",
      transform: "rotate(270deg)",
      background: "none",
    },
  },
  getSliderStyles() {
    const display = this.state.shown ? "block" : "none";
    return Object.assign({display}, this.styles.slider);
  },
  toggleMuted() {
    const opts = {volume: this.state.volume, muted: !this.state.muted};
    this.setState(opts);
    this.props.onChange(opts);
  },
  handleVolumeEvent({volume, muted}) {
    if (this.volumeDrag) return;
    this.setState({volume, muted});
  },
  handleMouseOver() {
    this.setState({shown: true});
  },
  handleMouseOut() {
    this.setState({shown: false});
  },
  handleVolumeMouseDown() {
    this.volumeDrag = true;
  },
  handleVolumeChange(e) {
    const opts = {volume: e.target.value / 100, muted: false};
    this.setState(opts);
    this.props.onChange(opts);
  },
  handleVolumeMouseUp() {
    this.volumeDrag = false;
  },
  render() {
    let volPercent = this.state.volume * 100;
    // Fix for different scale resolutions.
    volPercent = this.state.muted
      ? 0
      : volPercent < 15
        ? volPercent * 2
        : volPercent < 50
          ? volPercent * 1.1
          : volPercent / 1.1;
    const icon = (this.state.muted || this.state.volume < 0.01)
      ? "volume_off"
      : "volume_up";
    return (
      <div
        style={this.styles.main}
        onMouseOver={this.handleMouseOver}
        onMouseOut={this.handleMouseOut}
      >
        <style scoped>{`
          .wybm-view-player-volume::-webkit-slider-runnable-track {
            background: -webkit-linear-gradient(
              left,
              #ddd ${volPercent}%,
              #ddd ${volPercent}%,
              #fff ${volPercent}%
            );
          }
        `}</style>
        <input
          type="range"
          title="Change volume"
          style={this.getSliderStyles()}
          className="wybm-view-player-volume"
          value={this.state.muted ? 0 : this.state.volume * 100}
          onMouseDown={this.handleVolumeMouseDown}
          onChange={this.handleVolumeChange}
          onMouseUp={this.handleVolumeMouseUp}
        />
        <Control
          icon={icon}
          title="Toggle mute"
          onClick={this.toggleMuted}
        />
      </div>
    );
  },
});

const Time = React.createClass({
  cid: "wybm-view-player-time",
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
    },
  },
  getClassName() {
    let name = this.cid;
    if (this.props.invalid) name += ` ${this.cid}_invalid`;
    return name;
  },
  render() {
    return (
      <input
        type="text"
        maxLength={9}
        style={this.styles.main}
        className={this.getClassName()}
        {...this.props}
      />
    );
  },
});

const Seek = React.createClass({
  styles: {
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
    const mstartPercent = this.props.mstart / this.props.max * 100;
    const mendPercent = this.props.mend / this.props.max * 100;
    return (
      <div style={this.styles.main}>
        <style scoped>{`
          .wybm-view-player-seek::-webkit-slider-runnable-track {
            background: -webkit-linear-gradient(
              left,
              #ccc ${mstartPercent}%,
              #c90 ${mstartPercent}%,
              #c90 ${mendPercent}%,
              #ccc ${mendPercent}%
            );
          }
        `}</style>
        <input
          type="range"
          list="keyframes"
          style={this.styles.range}
          className="wybm-view-player-seek"
          {...this.props}
        />
        <datalist id="keyframes">
        {this.props.keyframes.map(i => <option key={i}>{i}</option>)}
        </datalist>
      </div>
    );
  },
});
