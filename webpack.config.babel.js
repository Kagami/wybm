import path from "path";
import webpack from "webpack";
import pkg from "./package.json";

function inmodules(...parts) {
  return new RegExp("^" + path.join(__dirname, "node_modules", ...parts) + "$");
}

function insrc(...parts) {
  return new RegExp("^" + path.join(__dirname, "src", ...parts) + "$");
}

function q(loader, query) {
  return loader + "?" + JSON.stringify(query);
}

const DIST_DIR = path.join("dist", "app");
const DEBUG = process.env.NODE_ENV !== "production";
const WIN_BUILD = process.env.PLATFORM === "win32";
const WYBM_VERSION = `"${pkg.name} v${pkg.version} “${pkg.codename}”"`;
const NAMEQ = {name: "[name]"};
const MANIFEST_OPTS = WIN_BUILD
  /* eslint-disable quotes */
  ? ',"chromium-args": "--user-data-dir=WybmAppData"'
  /* eslint-enable quotes */
  : "";
const PACKAGE_LOADERS = [
  q("file", NAMEQ),
  q("ejs-html", {opts: MANIFEST_OPTS, title: WYBM_VERSION}),
];
const COMMON_PLUGINS = [
  new webpack.DefinePlugin({WIN_BUILD, WYBM_VERSION}),
];
const PLUGINS = DEBUG ? COMMON_PLUGINS : COMMON_PLUGINS.concat([
  new webpack.optimize.OccurenceOrderPlugin(),
  new webpack.optimize.UglifyJsPlugin({
    output: {comments: false},
    compress: {warnings: false},
  }),
]);

export default {
  target: "node",
  entry: "./src/index/index",
  output: {
    path: path.join(__dirname, DIST_DIR),
    filename: "index.js",
  },
  module: {
    // See <https://github.com/webpack/webpack/issues/138>.
    noParse: inmodules(".*json-schema", "lib", "validate\\.js"),
    loaders: [
      {test: inmodules(".+\\.json"), loader: "json"},
      {test: insrc(".+\\.js"), loader: "babel"},
      {test: insrc("index", "package\\.json\\.ejs"), loaders: PACKAGE_LOADERS},
    ],
  },
  plugins: PLUGINS,
};
