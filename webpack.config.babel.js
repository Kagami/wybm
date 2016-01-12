import path from "path";
import webpack from "webpack";
import pkg from "./package.json";

// TODO(Kagami): Support more platforms.
const WIN_BUILD = process.env.PLATFORM === "win32";
const WYBM_VERSION = `"${pkg.name} v${pkg.version} “${pkg.codename}”"`;
const DIST_DIR = path.join("dist", "app");
const DEBUG = process.env.NODE_ENV !== "production";
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

function inmodules(...parts) {
  return new RegExp("^" + path.join(__dirname, "node_modules", ...parts) + "$");
}
function insrc(...parts) {
  return new RegExp("^" + path.join(__dirname, "src", ...parts) + "$");
}

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
      // See <https://github.com/webpack/webpack/issues/184>.
      {test: inmodules(".+\\.json"), loader: "json"},
      {test: insrc(".+\\.js"), loader: "babel"},
    ],
  },
  plugins: PLUGINS,
};
