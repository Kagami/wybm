MKVToolNix 8.7.0
================

# Table of contents

1. Introduction
2. Installation
  1. Requirements
  2. Optional components
  3. Building libEBML and libMatroska
  4. Building MKVToolNix
  5. Notes for compilation on (Open)Solaris
  6. Unit tests
3. Reporting bugs
4. Included libraries and their licenses
  1. avilib
  2. Boost's utf8_codecvt_facet
  3. libEBML
  4. libMatroska
  5. librmff
  6. nlohmann's JSON
  7. pugixml
  8. utf8-cpp

-----------------

# 1. Introduction

With these tools one can get information about (mkvinfo) Matroska
files, extract tracks/data from (mkvextract) Matroska files and create
(mkvmerge) Matroska files from other media files. Matroska is a new
multimedia file format aiming to become THE new container format for
the future. You can find more information about it and its underlying
technology, the Extensible Binary Meta Language (EBML), at

http://www.matroska.org/

The full documentation for each command is now maintained in its
man page only. Type `mkvmerge -h` to get you started.

This code comes under the GPL v2 (see www.gnu.org or the file COPYING).
Modify as needed.

The icons are based on the work of Alexandr Grigorcea and modified by
Eduard Geier. They're licensed under the terms of the
[Creative Commons Attribution 3.0 Unported license](http://creativecommons.org/licenses/by/3.0/).

The newest version can always be found at
https://mkvtoolnix.download/

Moritz Bunkus <moritz@bunkus.org>


# 2. Installation

If you want to compile the tools yourself then you must first decide
if you want to use a 'proper' release version or the current
development version. As both Matroska and MKVToolNix are under heavy
development there might be features available in the git repository
that are not available in the releases. On the other hand the git
repository version might not even compile.

## 2.1. Requirements

In order to compile MKVToolNix you need a couple of libraries. Most of
them should be available pre-compiled for your distribution. The
programs and libraries you absolutely need are:

- A C++ compiler that supports several features of the C++11 standard:
  initializer lists, range-based "for" loops, right angle brackets,
  the "auto" keyword, lambda functions, the "nullptr" key word, tuples
  and alias declarations. Others may be needed, to. For GCC this means
  at least v4.8.0; for clang v3.4 or later.

- [libEBML v1.3.3](http://dl.matroska.org/downloads/libebml/) or later
  and [libMatroska v1.4.4](http://dl.matroska.org/downloads/libmatroska/)
  or later for low-level access to Matroska files. Instructions on how to
  compile them are a bit further down in this file.

- [libOgg](http://downloads.xiph.org/releases/ogg/) and
  [libVorbis](http://downloads.xiph.org/releases/vorbis/) for access to Ogg/OGM
  files and Vorbis support

- [zlib](http://www.zlib.net/) -- a compression library

- [Boost](http://www.boost.org/) -- Several of Boost's libraries are
  used: "format", "RegEx", "filesystem", "system", "math",
  "Range", "rational", "variant". At least v1.46.0 is required.

You also need the `rake` or `drake` build program or at least the
programming language Ruby and the "rubygems" package. MKVToolNix comes
bundled with its own copy of "drake" in case you cannot install it
yourself. If you want to install it yourself I suggest you use the
"drake" version because it will be able to use all available CPU cores
for parallel builds.

Installing "drake" is simple. As root run the following command:

    gem install drake

## 2.2. Optional components

Other libraries are optional and only limit the features that are
built. These include:

- [Qt](http://www.qt.io/) v5.2 or newer -- a cross-platform GUI
  toolkit. You need this if you want to use the MKVToolNix GUI or
  mkvinfo's GUI.

- [libFLAC](http://downloads.xiph.org/releases/flac/) for FLAC
  support (Free Lossless Audio Codec)

- [lzo](http://www.oberhumer.com/opensource/lzo/) and
  [bzip2](http://www.bzip.org/) are compression libraries. These are
  the least important libraries as almost no application supports
  Matroska content that is compressed with either of these libs. The
  aforementioned zlib is what every program supports.

- [libMagic](http://www.darwinsys.com/file/) from the "file" package
  for automatic content type detection

- [libcurl](http://curl.haxx.se/) for online update checks

## 2.3. Building libEBML and libMatroska

This is optional as MKVToolNix comes with its own set of the
libraries. It will use them if no version is found on the system.

Start with the two libraries. Either download releases of
[libEBML 1.3.3](http://dl.matroska.org/downloads/libebml/) and
[libMatroska 1.4.4](http://dl.matroska.org/downloads/libmatroska/) or
get a fresh copy from the git repository:

    git clone https://github.com/Matroska-Org/libebml.git
    git clone https://github.com/Matroska-Org/libmatroska.git

First change to libEBML's directory and run `./configure` followed by
`make`. Now install libEBML by running `make install` as root
(e.g. via `sudo`). Change to libMatroska's directory and go through
the same steps: first `./configure` followed by `make` as a normal
user and lastly `make install` as root.

## 2.4. Building MKVToolNix

Either download the current release from
[the MKVToolNix home page](https://mkvtoolnix.download/)
and unpack it or get a development snapshot from my Git repository.

### 2.4.1. Getting and building a development snapshot

You can ignore this subsection if you want to build from a release
tarball.

All you need for Git repository access is to download a Git client
from the Git homepage at http://git-scm.com/. There are clients
for both Unix/Linux and Windows.

First clone my Git repository with this command:

    git clone https://github.com/mbunkus/mkvtoolnix.git

Now change to the MKVToolNix directory with `cd mkvtoolnix` and run
`./autogen.sh` which will generate the "configure" script. You need
the GNU "autoconf" utility for this step.

### 2.4.2. Configuration and compilation

If you have run `make install` for both libraries then `configure`
should automatically find the libraries' position. Otherwise you need
to tell `configure` where the libEBML and libMatroska include and
library files are:

    ./configure \
      --with-extra-includes=/where/i/put/libebml\;/where/i/put/libmatroska \
      --with-extra-libs=/where/i/put/libebml/make/linux\;/where/i/put/libmatroska/make/linux

Now run `rake` and, as "root", `rake install`. If you don't have
"rake" installed yourself then use the version bundled with
MKVToolNix: `./drake` and `./drake install`.

If you want to use all available CPU cores for building then you have
to use `drake` instead of `rake`. `drake` knows the parameter `-j`
much like `make` does. You can also set the environment variable
DRAKETHREADS to a number and the build process will automatically use
that number of threads for a parallel build:

    ./drake -j4

or

    export DRAKETHREADS=4
    ./drake

## 2.5. Notes for compilation on (Open)Solaris

You can compile mkvtoolnix with Sun's sunstudio compiler, but you need
additional options for `configure`:

    ./configure --prefix=/usr \
      CXX="/opt/sunstudio12.1/bin/CC -library=stlport4" \
      CXXFLAGS="-D_POSIX_PTHREAD_SEMANTICS" \
      --with-extra-includes=/where/i/put/libebml\;/where/i/put/libmatroska \
      --with-extra-libs=/where/i/put/libebml/make/linux\;/where/i/put/libmatroska/make/linux

## 2.6. Unit tests

Building and running unit tests is completely optional. If you want to
do this then you have to follow these steps:

1. Download the "googletest" framework from
   http://code.google.com/p/googletest/ (at the time of writing the
   file to download was "gtest-1.6.0.zip")

2. Make `gtest` usable:

  1. Either extract the framework inside the "lib" sub-folder and
     rename the resulting folder "gtest-1.6.0" to "gtest"

     or…

  2. Extract the archive somewhere and create a symbolic link to it
     inside the "lib" folder called or create a symbolic link called
     "gtest".

3. Configure MKVToolNix normally.

4. Build the unit test executable and run it with

        ./drake tests:unit


# 3. Reporting bugs

If you're sure you've found a bug -- e.g. if one of my programs crashes
with an obscur error message, or if the resulting file is missing part
of the original data, then by all means submit a bug report.

I use [GitHub's issue system](https://github.com/mbunkus/mkvtoolnix/issues)
as my bug database. You can submit your bug reports there. Please be as
verbose as possible – e.g. include the command line, if you use Windows
or Linux etc.pp.

If at all possible please include sample files as well so that I can
reproduce the issue. If they are larger than 1M then please upload
them somewhere and post a link in the issue. You can also upload them
to my FTP server. Details on how to connect can be found in the
[MKVToolNix FAQ](https://github.com/mbunkus/mkvtoolnix/wiki/FTP-server).

# 4. Included libraries and their licenses

MKVToolNix includes and uses the following libraries:

## 4.1. avilib

Reading and writing avi files.

Copyright (C) 1999 Rainer Johanni <Rainer@Johanni.de>, originally part
of the transcode package.

License: GNU General Public License v2
URL: http://www.transcoding.org/

## 4.2. Boost's utf8_codecvt_facet

A class utf8_codecvt_facet, derived from std::codecvt<wchar_t, char>,
which can be used to convert utf8 data in files into wchar_t strings
in the application.

License: Boost Software License - Version 1.0
URL: http://www.boost.org

## 4.3. libEBML

a C++ library to parse EBML files

License: GNU Lesser General Public License v2.1
URL: http://www.matroska.org/

## 4.4. libMatroska

a C++ library to parse Matroska files

License: GNU Lesser General Public License v2.1
URL: http://www.matroska.org/

## 4.5. librmff

librmff is short for 'RealMedia file format access library'. It aims
at providing the programmer an easy way to read and write RealMedia
files.

License: GNU Lesser General Public License v2.1
URL: https://www.bunkus.org/videotools/librmff/index.html

## 4.6. nlohmann's JSON

JSON for Modern C++

License: MIT
URL: https://github.com/nlohmann/json

## 4.7. pugixml

an XML processing library

License: MIT
URL: http://pugixml.org/

## 4.8. utf8-cpp

UTF-8 with C++ in a Portable Way

License: custom (see lib/utf8-cpp/source/utf8.hpp)
URL: http://utfcpp.sourceforge.net/
