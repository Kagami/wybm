import path from "path";
import webpack from "webpack";
import pkg from "./package.json";

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
  q("file-loader", NAMEQ),
  q("ejs-html-loader", {opts: MANIFEST_OPTS, title: WYBM_VERSION}),
];

export default {
  mode: DEBUG ? "development" : "production",
  stats: {
    children: false,
    entrypoints: false,
    modules: false,
  },
  bail: !DEBUG,
  target: "node",
  entry: "./src/index/index",
  output: {
    path: path.join(__dirname, DIST_DIR),
    filename: "index.js",
  },
  module: {
    rules: [
      {test: insrc(".+\\.js"), loader: "babel-loader"},
      {test: insrc("index", "package\\.json\\.ejs"), loaders: PACKAGE_LOADERS},
    ],
  },
  plugins: [
    new webpack.DefinePlugin({WIN_BUILD, WYBM_VERSION}),
  ],
};
