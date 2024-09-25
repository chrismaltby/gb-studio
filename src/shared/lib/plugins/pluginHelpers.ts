import type { PluginType } from "lib/pluginManager/types";

const globalPlugins: PluginType[] = ["theme", "lang", "template"];

export const isGlobalPluginType = (type: PluginType) => {
  return globalPlugins.includes(type);
};
