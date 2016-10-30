# wybm

wybm is a GUI application which can download videos from YouTube in WebM format and interactively cut them without reencoding. It's available for all major platforms. [Click here](https://raw.githubusercontent.com/Kagami/wybm/assets/demo.webm) to watch the demo.

![](https://raw.githubusercontent.com/Kagami/wybm/assets/player.png)

## Install

### Windows

Download [latest release](https://github.com/Kagami/wybm/releases), unpack and run `wybm.exe`. **NOTE:** download release build from the releases page, not the source code!

### Linux

You need FFmpeg and MKVToolNix installed. Download [latest release](https://github.com/Kagami/wybm/releases), unpack and run `./wybm`.

### Mac OS (experimental)

You need FFmpeg and MKVToolNix installed (use HomeBrew). Download [latest release](https://github.com/Kagami/wybm/releases), unpack and launch `nwjs.app`. **NOTE:** Gatekeeper should be turned off.

## License

wybm own code, documentation and icon licensed under CC0, but the resulting build also includes the following libraries and assets:

* Libraries in `dependencies` section of [package.json](package.json) (BSD-like)
* [NW.js binaries](https://github.com/nwjs/nw.js), see also `credits.html` in release archives
* [OpenSans font](https://www.google.com/fonts/specimen/Open+Sans), see `LICENSE.OPENSANS`
* [Font Awesome icons](https://github.com/FortAwesome/Font-Awesome), see `LICENSE.FONTAWESOME`
* [libpython](https://www.python.org/) (as part of `youtube-dl.exe`, only in Windows build, see `LICENSE.PYTHON`)
* [MKVToolNix binaries](https://mkvtoolnix.download/) (only in Windows build, see `LICENSE.MKVTOOLNIX`)
* [Zeranoe FFmpeg binaries](http://ffmpeg.zeranoe.com/builds/) (only in Windows build, see `LICENSE.FFMPEG`)

---

wybm - Extract and cut youtube webms

Written in 2016 by Kagami Hiiragi <kagami@genshiken.org>

To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.

You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
