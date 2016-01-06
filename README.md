# wybm

wybm is a GUI application which can download videos from YouTube in WebM format and interactively cut them without reencoding. It's available for all major platforms. [Click here](https://raw.githubusercontent.com/Kagami/wybm/assets/demo.webm) to watch the demo.

### Install

##### Linux

You will need python, ffmpeg, mkvtoolnix and common desktop deps such as X11, gtk, gconf installed. Download [latest release](./releases), unpack it and run `./wybm`.

##### Windows

Everything is included to the build, just download [latest release](./releases), unpack and run `wybm.bat`.

##### Mac

*TODO*

### Manual build

*TODO*

### License

wybm own code, documentation and icon licensed under CC0, but the resulting build also includes the following libraries and assets:

* Libraries in `dependencies` section of [package.json](https://github.com/Kagami/wybm/blob/master/package.json) (BSD-like)
* [NW.js binaries](https://github.com/nwjs/nw.js), see also `credits.html` in release archives
* [MKVToolNix binaries](https://mkvtoolnix.download/) (only in Windows build)
* [Zeranoe FFmpeg binaries](http://ffmpeg.zeranoe.com/builds/) (only in Windows build)

---

wybm - Extract and cut youtube webms

Written in 2016 by Kagami Hiiragi <kagami@genshiken.org>

To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.

You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
