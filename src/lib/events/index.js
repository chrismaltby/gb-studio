/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import glob from "glob";
import plugins, { pluginEmitter } from "../plugins/plugins";

const internalEventHandlerPaths = glob.sync(`${__dirname}/event*.js`);

const eventHandlers = {
  ...internalEventHandlerPaths.reduce((memo, path) => {
    const handler = require(path);
    if (!handler.id) {
      throw new Error(`Event handler ${path} is missing id`);
    }
    return {
      ...memo,
      [handler.id]: handler
    };
  }, {}),
  ...plugins.events
};

pluginEmitter.on("update-event", plugin => {
  eventHandlers[plugin.id] = plugin;
});

pluginEmitter.on("add-event", plugin => {
  eventHandlers[plugin.id] = plugin;
});

pluginEmitter.on("remove-event", plugin => {
  delete eventHandlers[plugin.id];
});

export default eventHandlers;
