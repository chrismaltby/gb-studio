/**
 * Shared Handler Utilities
 *
 * Common functionality used by both secure VM and trusted execution handlers.
 */

import type {
  FileReaderFn,
  ScriptEventHandler,
  ScriptEventHandlerFieldSchema,
  ScriptEventHelperDef,
  ScriptEventPresetValue,
  UserPresetsGroup,
} from "lib/scriptEventsHandlers/handlerTypes";
import * as eventHelpers from "lib/events/helpers";
import * as eventSystemHelpers from "lib/helpers/eventSystem";
import * as compileEntityEvents from "lib/compiler/compileEntityEvents";
import * as scriptValueTypes from "shared/lib/scriptValue/types";
import * as scriptValueHelpers from "shared/lib/scriptValue/helpers";
import * as l10n from "shared/lib/lang/l10n";
import trimLines from "shared/lib/helpers/trimlines";
import { createScriptEventHandlerAPI } from "./handlerApi";

/**
 * Creates the standard set of mock dependencies available to handler code.
 */
export const createMockRequire = (
  readFile: FileReaderFn,
): Record<string, unknown> => {
  return {
    "plugin-api": createScriptEventHandlerAPI(readFile),
    // Legacy compatibility for older plugins
    "./helpers": eventHelpers,
    "../helpers/l10n": l10n,
    "../helpers/eventSystem": eventSystemHelpers,
    "../compiler/compileEntityEvents": compileEntityEvents,
    "../helpers/trimlines": trimLines,
    "shared/lib/helpers/trimlines": trimLines,
    "shared/lib/scriptValue/helpers": scriptValueHelpers,
    "shared/lib/scriptValue/types": scriptValueTypes,
  };
};

/**
 * Analyzes JavaScript code to determine module system (ES modules vs CommonJS).
 */
const ESM_RE =
  /(^|\n|\r)\s*import\s+(?!\()|(^|\n|\r)\s*export\s+(?:\*|default|{|\w)/m;

export const detectModuleSystem = (code: string): "module" | "global" => {
  const isESM = ESM_RE.test(code);
  return isESM ? "module" : "global";
};

/**
 * Validates that the loaded handler exports the required properties.
 */
export const validateHandlerMetadata = (
  metadata: unknown,
  filename: string,
): void => {
  if (
    !metadata ||
    typeof metadata !== "object" ||
    !("id" in metadata) ||
    typeof metadata.id !== "string"
  ) {
    throw new Error(
      `Script event handler at ${filename} does not export an 'id' property.`,
    );
  }
};

/**
 * Creates a flat lookup table for efficient field access during editor runtime.
 */
export const buildFieldsLookup = (
  handler: ScriptEventHandler,
  fields: ScriptEventHandlerFieldSchema[],
): void => {
  for (const field of fields) {
    if (field.type === "group" && field.fields) {
      buildFieldsLookup(handler, field.fields);
    } else if (field.key) {
      // Mark fields that have post-update callbacks for renderer optimization
      const fieldRecord = field as Record<string, unknown>;
      (field as ScriptEventHandlerFieldSchema).hasPostUpdateFn =
        !!fieldRecord.postUpdateFn;
      handler.fieldsLookup[field.key] = field;
    }
  }
};

/**
 * Validates that user preset groups account for all handler fields.
 */
export const validateUserPresets = (handler: ScriptEventHandler): void => {
  if (!handler.userPresetsGroups) return;

  const allFields = Object.keys(handler.fieldsLookup);

  const presetFields = handler.userPresetsGroups
    .map((group: { fields: string[] }) => group.fields)
    .flat()
    .concat(handler.userPresetsIgnore ?? []);

  const missingFields = allFields.filter((key) => !presetFields.includes(key));

  if (missingFields.length > 0) {
    console.error(
      `${handler.id} defined userPresetsGroups but did not include some fields in either userPresetsGroups or userPresetsIgnore`,
    );
    console.error("Missing fields: " + missingFields.join(", "));
  }
};

/**
 * Creates the base handler object structure with all required properties.
 */
export const createHandlerBase = (
  metadata: Record<string, unknown>,
  hasAutoLabelFunction: boolean,
  cleanup: () => void,
): Omit<
  ScriptEventHandler & { cleanup: () => void },
  "autoLabel" | "compile"
> => {
  const handler = {
    ...metadata,
    id: metadata.id as string,
    fields: Array.isArray(metadata.fields)
      ? (metadata.fields as ScriptEventHandlerFieldSchema[])
      : [],
    cleanup,
    hasAutoLabel: hasAutoLabelFunction,
    fieldsLookup: {} as Record<string, ScriptEventHandlerFieldSchema>,
    name: metadata.name as string | undefined,
    description: metadata.description as string | undefined,
    groups: metadata.groups as string[] | string | undefined,
    subGroups: metadata.subGroups as Record<string, string> | undefined,
    deprecated: metadata.deprecated as boolean | undefined,
    isConditional: false,
    editableSymbol: metadata.editableSymbol as boolean | undefined,
    allowChildrenBeforeInitFade: metadata.allowChildrenBeforeInitFade as
      | boolean
      | undefined,
    waitUntilAfterInitFade: metadata.waitUntilAfterInitFade as
      | boolean
      | undefined,
    helper: metadata.helper as ScriptEventHelperDef | undefined,
    presets: metadata.presets as ScriptEventPresetValue[] | undefined,
    userPresetsGroups: metadata.userPresetsGroups as
      | UserPresetsGroup[]
      | undefined,
    userPresetsIgnore: metadata.userPresetsIgnore as string[] | undefined,
  };

  // Set conditional flag based on presence of events fields
  handler.isConditional =
    handler.fields && !!handler.fields.find((f) => f.type === "events");

  // Mark fields that have post-update callbacks for renderer optimization
  for (const field of handler.fields) {
    const fieldRecord = field as Record<string, unknown>;
    (field as ScriptEventHandlerFieldSchema).hasPostUpdateFn =
      !!fieldRecord.postUpdateFn;
  }

  return handler;
};

/**
 * Assembles a complete handler by building lookup tables and validating configuration.
 */
export const finalizeHandler = (handler: ScriptEventHandler): void => {
  buildFieldsLookup(handler, handler.fields);
  validateUserPresets(handler);
};

export const noReadFileFn: FileReaderFn = (_path: string): string => {
  throw new Error("This handler is not configured to read files.");
};

/**
 * Converts ES modules to CommonJS for eval compatibility.
 */
export const convertESMToCommonJS = (code: string): string => {
  let convertedCode = code;

  // Convert export default statements
  convertedCode = convertedCode.replace(
    /export\s+default\s+(.+?)(?:;|$)/gm,
    "module.exports = $1;",
  );

  // Convert named exports
  convertedCode = convertedCode.replace(
    /export\s*\{\s*([^}]+)\s*\}\s*;?/gm,
    (match, exports) => {
      const exportList = exports
        .split(",")
        .map((exp: string) => exp.trim())
        .filter((exp: string) => exp);
      return `module.exports = { ${exportList.join(", ")} };`;
    },
  );

  // Track individual exports to build a combined module.exports
  const individualExports: string[] = [];

  // Convert individual export declarations like "export const id = 'value'"
  convertedCode = convertedCode.replace(
    /export\s+(const|let|var|function|class)\s+(\w+)(\s*=\s*[^;]+)?/gm,
    (match, keyword, name, assignment) => {
      individualExports.push(name);
      if (assignment) {
        return `${keyword} ${name}${assignment}`;
      } else {
        return `${keyword} ${name}`;
      }
    },
  );

  // If we found individual exports, add them to module.exports
  if (individualExports.length > 0) {
    const exportsAssignment = individualExports
      .map((name) => `${name}`)
      .join(", ");
    convertedCode += `\nmodule.exports = { ${exportsAssignment} };`;
  }

  // Convert import statements to require calls
  convertedCode = convertedCode.replace(
    /import\s+(\w+)\s+from\s+['"](.+?)['"];?\s*$/gm,
    (match, varName, moduleName) => {
      return `const _mod_${varName} = require("${moduleName}"); const ${varName} = _mod_${varName}.default || _mod_${varName}.${varName} || _mod_${varName};`;
    },
  );

  convertedCode = convertedCode.replace(
    /import\s*\{\s*([^}]+)\s*\}\s*from\s+['"](.+?)['"];?\s*$/gm,
    'const { $1 } = require("$2");',
  );

  return convertedCode;
};
