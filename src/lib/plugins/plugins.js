
import fs from "fs";
import glob from "glob";
import Path from "path";
import chokidar from "chokidar";
import EventEmitter from "events";
import { ipcRenderer } from "electron";

const VM2 = __non_webpack_require__("vm2");
const NodeVM = VM2.NodeVM;

const urlParams = new URLSearchParams(window.location.search);
const projectPath = urlParams.get("path");
const projectRoot = projectPath && Path.dirname(projectPath);

const pluginEventHandlerPaths = projectRoot
  ? glob.sync(`${projectRoot}/plugins/**/events/event*.js`)
  : [];
const pluginMenuHandlerPaths = projectRoot
  ? glob.sync(`${projectRoot}/plugins/**/menu/menu*.js`)
  : [];

const pluginEmitter = new EventEmitter();

const vm = new NodeVM({
  timeout: 1000,
  sandbox: {},
  compiler: (code) => {
    // Convert es6 style modules to commonjs
    let moduleCode = code;
    moduleCode = code.replace(/(^|\n)(\S\s)*export /g, "");
    if (moduleCode.indexOf("module.exports") === -1) {
      const moduleExports = code
        .match(/export [a-z]* [a-zA-Z_$][0-9a-zA-Z_$]*]*/g)
        .map((c) => c.replace(/.* /, ""));
      moduleCode += `\nmodule.exports = { ${moduleExports.join(", ")} };`;
    }
    return moduleCode;
  }
});

const loadPlugin = path => {
  try {
    const pluginCode = fs.readFileSync(path, "utf8");
    const plugin = vm.run(pluginCode);
    if (!plugin.id) {
      throw new Error(`Event plugin ${path} is missing id`);
    }
    plugin.plugin = Path.relative(`${projectRoot}/plugins`, path).split(
      Path.sep
    )[0];
    return plugin;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return null;
  }
};

const pluginEventFilepaths = {};
const pluginMenuFilepaths = {};

const plugins = {
  events: pluginEventHandlerPaths.reduce((memo, path) => {
    const plugin = loadPlugin(path);
    if (!plugin) {
      return memo;
    }
    pluginEventFilepaths[path] = plugin.id;
    if (plugin.fields) {
      // Convert fields from proxy to plain javascript object
      plugin.fields = JSON.parse(JSON.stringify(plugin.fields));
    }    
    return {
      ...memo,
      [plugin.id]: plugin
    };
  }, {}),
  menu: pluginMenuHandlerPaths.reduce((memo, path) => {
    const plugin = loadPlugin(path);
    if (!plugin) {
      return memo;
    }
    pluginMenuFilepaths[path] = plugin.id;
    return {
      ...memo,
      [plugin.id]: plugin
    };
  }, {})
};

if (ipcRenderer) {
  ipcRenderer.send("set-menu-plugins", plugins.menu);

  chokidar
    .watch(`${projectRoot}/plugins/*/events/event*.js`, {
      ignoreInitial: true,
      persistent: true
    })
    .on("add", path => {
      const plugin = loadPlugin(path);
      if (!plugin) {
        return;
      }
      plugins.events[plugin.id] = plugin;
      pluginEmitter.emit("add-event", plugin);
    })
    .on("change", path => {
      const plugin = loadPlugin(path);
      const oldPluginId = pluginEventFilepaths[path];
      if (!plugin || oldPluginId !== plugin.id) {
        pluginEventFilepaths[path] = oldPluginId;
        delete plugins.events[oldPluginId];
        pluginEmitter.emit("remove-event", { id: oldPluginId });
      }
      if (!plugin) {
        return;
      }
      plugins.events[plugin.id] = plugin;
      pluginEventFilepaths[path] = plugin.id;
      pluginEmitter.emit("update-event", plugin);
    })
    .on("unlink", path => {
      const pluginId = pluginEventFilepaths[path];
      delete plugins.events[pluginId];
      delete pluginEventFilepaths[path];
      pluginEmitter.emit("remove-event", { id: pluginId });
    });

  chokidar
    .watch(`${projectRoot}/plugins/*/menu/menu*.js`, {
      ignoreInitial: true,
      persistent: true
    })
    .on("add", path => {
      const plugin = loadPlugin(path);
      if (!plugin) {
        return;
      }
      plugins.menu[plugin.id] = plugin;
      pluginEmitter.emit("add-menu", plugin);
      ipcRenderer.send("set-menu-plugins", plugins.menu);
    })
    .on("change", path => {
      const plugin = loadPlugin(path);
      const oldPluginId = pluginMenuFilepaths[path];
      if (!plugin || oldPluginId !== plugin.id) {
        pluginMenuFilepaths[path] = oldPluginId;
        delete plugins.menu[oldPluginId];
        pluginEmitter.emit("remove-menu", { id: oldPluginId });
      }
      if (!plugin) {
        ipcRenderer.send("set-menu-plugins", plugins.menu);
        return;
      }
      plugins.menu[plugin.id] = plugin;
      pluginMenuFilepaths[path] = plugin.id;
      pluginEmitter.emit("update-menu", plugin);
      ipcRenderer.send("set-menu-plugins", plugins.menu);
    })
    .on("unlink", path => {
      const pluginId = pluginMenuFilepaths[path];
      delete plugins.menu[pluginId];
      delete pluginMenuFilepaths[path];
      pluginEmitter.emit("remove-menu", { id: pluginId });
      ipcRenderer.send("set-menu-plugins", plugins.menu);
    });
}

export default plugins;
export { pluginEmitter };
