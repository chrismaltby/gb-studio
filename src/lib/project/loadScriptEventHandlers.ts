import glob from "glob";
import { promisify } from "util";
import { eventsRoot } from "consts";
import * as l10n from "shared/lib/lang/l10n";
import * as eventHelpers from "lib/events/helpers";
import * as eventSystemHelpers from "lib/helpers/eventSystem";
import * as compileEntityEvents from "lib/compiler/compileEntityEvents";
import type { ScriptEventFieldSchema } from "shared/lib/entities/entitiesTypes";
import { readFile } from "fs-extra";
import trimLines from "shared/lib/helpers/trimlines";
import * as scriptValueHelpers from "shared/lib/scriptValue/helpers";
import * as scriptValueTypes from "shared/lib/scriptValue/types";

const globAsync = promisify(glob);

const VM2 = __non_webpack_require__("vm2");
const NodeVM = VM2.NodeVM;

export type ScriptEventHelperDef =
  | {
      type: "position";
      x: string;
      y: string;
      units?: string;
      tileSize?: string;
      tileWidth?: number;
      tileHeight?: number;
    }
  | {
      type: "camera";
      x: string;
      y: string;
      units?: string;
    }
  | {
      type: "overlay";
      x: string;
      y: string;
      color?: string;
      units?: string;
    }
  | {
      type: "scanline";
      y: string;
      units?: string;
    }
  | {
      type: "distance";
      actorId: string;
      distance: string;
      operator: string;
    }
  | {
      type: "bounds";
      actorId: string;
      x: string;
      y: string;
      width: string;
      height: string;
    }
  | {
      type: "text";
      text: string;
      avatarId: string;
      minHeight: string;
      maxHeight: string;
      showFrame: string;
      clearPrevious: string;
      textX: string;
      textY: string;
      textHeight: string;
    }
  | {
      type: "textdraw";
      text: string;
      x: string;
      y: string;
      location: string;
    };

export type ScriptEventPresetValue = {
  id: string;
  name: string;
  description?: string;
  groups?: string[] | string;
  subGroups?: Record<string, string>;
  values: Record<string, unknown>;
};

export type UserPresetsGroup = {
  id: string;
  label: string;
  fields: string[];
  selected?: boolean;
};

export interface ScriptEventDef {
  id: string;
  fields: ScriptEventFieldSchema[];
  name?: string;
  description?: string;
  groups?: string[] | string;
  subGroups?: Record<string, string>;
  deprecated?: boolean;
  isConditional?: boolean;
  editableSymbol?: boolean;
  allowChildrenBeforeInitFade?: boolean;
  waitUntilAfterInitFade?: boolean;
  hasAutoLabel: boolean;
  helper?: ScriptEventHelperDef;
  presets?: ScriptEventPresetValue[];
  userPresetsGroups?: UserPresetsGroup[];
  userPresetsIgnore?: string[];
  fieldsLookup: Record<string, ScriptEventFieldSchema>;
}

export type ScriptEventHandlerFieldSchema = ScriptEventFieldSchema & {
  postUpdateFn?: (
    newArgs: Record<string, unknown>,
    prevArgs: Record<string, unknown>
  ) => void | Record<string, unknown>;
};

export type ScriptEventHandler = ScriptEventDef & {
  autoLabel?: (
    lookup: (key: string) => string,
    args: Record<string, unknown>
  ) => string;
  compile: (input: unknown, helpers: unknown) => void;
  fields: ScriptEventHandlerFieldSchema[];
  fieldsLookup: Record<string, ScriptEventHandlerFieldSchema>;
};

export type ScriptEventHandlers = Record<string, ScriptEventHandler>;

const vm = new NodeVM({
  timeout: 1000,
  console: process.env.NODE_ENV !== "development" ? "off" : "inherit",
  sandbox: {},
  compiler: (code: string) => {
    // Convert es6 style modules to commonjs
    let moduleCode = code;
    moduleCode = code.replace(/(^|\n)(\S\s)*export /g, "");
    if (moduleCode.indexOf("module.exports") === -1) {
      const moduleExports =
        code
          .match(/export [a-z]* [a-zA-Z_$][0-9a-zA-Z_$]*]*/g)
          ?.map((c) => c.replace(/.* /, "")) ?? [];
      moduleCode += `\nmodule.exports = { ${moduleExports.join(", ")} };`;
    }
    return moduleCode;
  },
  require: {
    mock: {
      "./helpers": eventHelpers,
      "../helpers/l10n": l10n,
      "../helpers/eventSystem": eventSystemHelpers,
      "../compiler/compileEntityEvents": compileEntityEvents,
      "../helpers/trimlines": trimLines,
      "shared/lib/helpers/trimlines": trimLines,
      "shared/lib/scriptValue/helpers": scriptValueHelpers,
      "shared/lib/scriptValue/types": scriptValueTypes,
    },
  },
});

const loadScriptEventHandler = async (
  path: string
): Promise<ScriptEventHandler> => {
  const handlerCode = await readFile(path, "utf8");
  const handler = vm.run(handlerCode) as ScriptEventHandler;
  if (!handler.id) {
    throw new Error(`Event handler ${path} is missing id`);
  }
  handler.isConditional =
    handler.fields && !!handler.fields.find((f) => f.type === "events");
  handler.hasAutoLabel = !!handler.autoLabel;
  handler.fieldsLookup = {};

  // Add flags for existence of field callsbacks
  // Needed so renderer knows if API call to main process is needed
  for (const field of handler.fields) {
    field.hasPostUpdateFn = !!field.postUpdateFn;
  }

  // Build flat lookup table of field keys to field
  // To prevent needing to recursively loop through
  // nested fields at editor runtime
  const buildFieldsLookup = (fields: ScriptEventFieldSchema[]): void => {
    for (const field of fields) {
      if (field.type === "group" && field.fields) {
        buildFieldsLookup(field.fields);
      } else if (field.key) {
        handler.fieldsLookup[field.key] = field;
      }
    }
  };
  buildFieldsLookup(handler.fields);

  if (handler.userPresetsGroups) {
    // If an script event supports user presets
    // validate that all fields have been accounted for
    const allFields = Object.keys(handler.fieldsLookup);

    const presetFields = handler.userPresetsGroups
      .map((group) => group.fields)
      .flat()
      .concat(handler.userPresetsIgnore ?? []);

    const missingFields = allFields.filter(
      (key) => !presetFields.includes(key)
    );

    if (missingFields.length > 0) {
      console.error(
        `${handler.id} defined userPresetsGroups but did not include some fields in either userPresetsGroups or userPresetsIgnore`
      );
      console.error("Missing fields: " + missingFields.join(", "));
    }
  }

  return handler;
};

const loadAllScriptEventHandlers = async (projectRoot: string) => {
  const corePaths = await globAsync(`${eventsRoot}/event*.js`);

  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/**/events/event*.js`
  );

  const eventHandlers: ScriptEventHandlers = {};
  for (const path of corePaths) {
    const handler = await loadScriptEventHandler(path);
    eventHandlers[handler.id] = handler;
  }
  for (const path of pluginPaths) {
    const handler = await loadScriptEventHandler(path);
    eventHandlers[handler.id] = handler;
  }

  return eventHandlers;
};

export default loadAllScriptEventHandlers;
