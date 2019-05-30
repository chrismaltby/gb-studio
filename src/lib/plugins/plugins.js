import { NodeVM } from "vm2";
import fs from "fs";
import glob from "glob";
import Path from "path";

const babel = require("@babel/standalone");
const importExportPlugin = require("@babel/plugin-transform-modules-commonjs");
const jsxPlugin = require("@babel/plugin-transform-react-jsx");

const urlParams = new URLSearchParams(window.location.search);
const projectPath = urlParams.get("path");
const projectRoot = projectPath && Path.dirname(projectPath);

const pluginEventHandlerPaths = projectRoot
  ? glob.sync(`${projectRoot}/assets/plugins/**/event*.js`)
  : [];

const compiler = code =>
  babel.transform(code, {
    plugins: [importExportPlugin, jsxPlugin]
  }).code;

const vm = new NodeVM({
  timeout: 1000,
  sandbox: {},
  compiler
});

const plugins = {
  events: pluginEventHandlerPaths.reduce((memo, path) => {
    const pluginCode = fs.readFileSync(path, "utf8");
    const handler = vm.run(pluginCode);
    if (!handler.id) {
      throw new Error(`Event handler ${path} is missing id`);
    }
    return {
      ...memo,
      [handler.id]: handler
    };
  }, {})
};

export default plugins;
