/**
 * Helper routines and widgets.
 * @module wybm/util
 */

import assert from "assert";

export {default as ShowHide} from "./show-hide";

const DEFAULT_TITLE = "wybm | extract and cut youtube webms";
export function setTitle(title) {
  if (title) {
    document.title = "wybm | " + title;
  } else {
    document.title = DEFAULT_TITLE;
  }
}

export function toCapitalCase(s) {
  return s[0].toUpperCase() + s.slice(1);
}

export function showSize(size) {
  if (size < 1024) {
    return size + "B";
  } else if (size < 1024 * 1024) {
    size /= 1024;
    return size.toFixed(2) + "KiB";
  } else {
    size /= 1024 * 1024;
    return size.toFixed(2) + "MiB";
  }
}

/** Simple helper since JavaScript lacks coffee's "?." */
export function showErr(err) {
  return err ? err.message : null;
}

// Taken from webm.js
export function parseTime(time) {
  if (Number.isFinite(time)) return time;
  // [hh]:[mm]:[ss[.xxx]]
  const m = time.match(/^(?:(\d+):)?(?:(\d+)+:)?(\d+(?:\.\d+)?)$/);
  assert(m, "Invalid time");
  const [hours, minutes, seconds] = m.slice(1);
  let duration = Number(seconds);
  if (hours) {
    if (minutes) {
      // 1:2:3 -> [1, 2, 3]
      duration += Number(minutes) * 60;
      duration += Number(hours) * 3600;
    } else {
      // 1:2 -> [1, undefined, 2]
      duration += Number(hours) * 60;
    }
  }
  return duration;
}

// Taken from webm.js
export function showTime(duration, sep) {
  function pad2(n) {
    n |= 0;
    return n < 10 ? "0" + n : n.toString();
  }
  let ts = pad2(duration / 60) + (sep || ":");
  ts += pad2(duration % 60);
  ts += (duration % 1).toFixed(3).slice(1, 5);
  return ts;
}

export function tryRun(fn, arg, def) {
  try {
    return fn(arg);
  } catch(e) {
    return def;
  }
}

export function popkeys(obj, keys) {
  let copy = Object.assign({}, obj);
  keys.forEach(key => delete copy[key]);
  return copy;
}
