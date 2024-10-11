import type { PluginType } from "lib/pluginManager/types";
import { assertUnreachable } from "shared/lib/helpers/assert";
import l10n from "shared/lib/lang/l10n";

const globalPlugins: PluginType[] = ["theme", "lang", "template"];

export const isGlobalPluginType = (type: PluginType) => {
  return globalPlugins.includes(type);
};

export const pluginNameForType = (type: PluginType) => {
  if (type === "assetPack") {
    return l10n("FIELD_ASSET_PACK");
  }
  if (type === "eventsPlugin") {
    return l10n("FIELD_EVENTS_PLUGIN");
  }
  if (type === "enginePlugin") {
    return l10n("FIELD_ENGINE_PLUGIN");
  }
  if (type === "lang") {
    return l10n("FIELD_LANGUAGE_PLUGIN");
  }
  if (type === "template") {
    return l10n("FIELD_TEMPLATE_PLUGIN");
  }
  if (type === "theme") {
    return l10n("MENU_THEME");
  }
  assertUnreachable(type);
};

export const pluginDescriptionForType = (type: PluginType) => {
  if (type === "assetPack") {
    return l10n("FIELD_ASSET_PACK_DESC");
  }
  if (type === "eventsPlugin") {
    return l10n("FIELD_EVENTS_PLUGIN_DESC");
  }
  if (type === "enginePlugin") {
    return l10n("FIELD_ENGINE_PLUGIN_DESC");
  }
  if (type === "lang") {
    return l10n("FIELD_LANGUAGE_PLUGIN_DESC");
  }
  if (type === "template") {
    return l10n("FIELD_TEMPLATE_PLUGIN_DESC");
  }
  if (type === "theme") {
    return l10n("FIELD_THEME_PLUGIN_DESC");
  }
  assertUnreachable(type);
};
