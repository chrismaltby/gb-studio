import {
  isActorField,
  isPropertyField,
  isVariableField,
} from "shared/lib/scripts/scriptDefHelpers";
import l10n from "shared/lib/lang/l10n";
import type { ScriptEventHandlers } from "lib/project/loadScriptEventHandlers";
import { scriptValueToString } from "shared/lib/scriptValue/format";
import { isScriptValue } from "shared/lib/scriptValue/types";
import { lexText } from "shared/lib/compiler/lexText";

export const getAutoLabel = (
  command: string,
  args: Record<string, unknown>,
  scriptEventDefs: ScriptEventHandlers
) => {
  const mapArg = (key: string) => {
    const arg = args[key];

    type UnionType = {
      type: string;
      value: unknown;
    };

    const field = scriptEventDefs[command];
    if (!field) {
      return "";
    }

    const fieldLookup = field.fieldsLookup;

    const extractValue = (key: string, arg: unknown): unknown => {
      const fieldType = fieldLookup[key]?.type || "";
      if (
        fieldType === "union" &&
        arg &&
        typeof arg === "object" &&
        "value" in (arg as { value: unknown })
      ) {
        return (arg as { value: unknown }).value;
      }
      return arg;
    };
    const extractFieldType = (key: string, arg: unknown): unknown => {
      const fieldType = fieldLookup[key]?.type || "";
      if (fieldType === "union" && arg && (arg as UnionType).type) {
        return (arg as UnionType).type;
      } else if (fieldType === "union") {
        return fieldLookup[key]?.defaultType;
      }
      return fieldType;
    };

    const argValue = extractValue(key, arg);
    const fieldType = extractFieldType(key, arg);
    const fieldDefault =
      arg && (arg as { type: string })?.type
        ? (fieldLookup[key]?.defaultValue as Record<string, unknown>)?.[
            (arg as { type: string })?.type
          ]
        : fieldLookup[key]?.defaultValue;
    const fieldPlaceholder = fieldLookup[key]?.placeholder;
    const value = argValue ?? fieldDefault ?? fieldPlaceholder ?? argValue;

    const propertyNameForId = (value: string) => {
      if (value === "xpos") {
        return l10n("FIELD_X_POSITION").replace(/ /g, "");
      }
      if (value === "ypos") {
        return l10n("FIELD_Y_POSITION").replace(/ /g, "");
      }
      if (value === "pxpos") {
        return l10n("FIELD_PX_POSITION").replace(/ /g, "");
      }
      if (value === "pypos") {
        return l10n("FIELD_PY_POSITION").replace(/ /g, "");
      }
      if (value === "direction") {
        return l10n("FIELD_DIRECTION").replace(/ /g, "");
      }
      if (value === "frame") {
        return l10n("FIELD_ANIMATION_FRAME").replace(/ /g, "");
      }
      return value;
    };

    const directionForValue = (value: unknown) => {
      if (value === "left") {
        return l10n("FIELD_DIRECTION_LEFT");
      }
      if (value === "right") {
        return l10n("FIELD_DIRECTION_RIGHT");
      }
      if (value === "down") {
        return l10n("FIELD_DIRECTION_DOWN");
      }
      return l10n("FIELD_DIRECTION_UP");
    };

    const animSpeedForValue = (speed: unknown): string => {
      if (typeof speed !== "number") {
        return String(value);
      }
      const animLabelLookup: Record<number, string> = {
        255: `${l10n("FIELD_NONE")}`,
        127: `${l10n("FIELD_SPEED")} 1`,
        63: `${l10n("FIELD_SPEED")} 2`,
        31: `${l10n("FIELD_SPEED")} 3`,
        15: `${l10n("FIELD_SPEED")} 4`,
        7: `${l10n("FIELD_SPEED")} 5`,
        3: `${l10n("FIELD_SPEED")} 6`,
        1: `${l10n("FIELD_SPEED")} 7`,
        0: `${l10n("FIELD_SPEED")} 8`,
      };
      return animLabelLookup[speed];
    };

    const inputForValue = (value: unknown) => {
      const l10nInput = (value: unknown) => {
        if (value === "a") {
          return "A";
        }
        if (value === "b") {
          return "B";
        }
        if (value === "start") {
          return "Start";
        }
        if (value === "select") {
          return "Select";
        }
        if (value === "left") {
          return l10n("FIELD_DIRECTION_LEFT");
        }
        if (value === "right") {
          return l10n("FIELD_DIRECTION_RIGHT");
        }
        if (value === "down") {
          return l10n("FIELD_DIRECTION_DOWN");
        }
        return l10n("FIELD_DIRECTION_UP");
      };
      if (Array.isArray(value)) {
        return value.map(l10nInput).join("/");
      }
      return l10nInput(value);
    };

    if (
      (fieldType === "value" || fieldType === "engineFieldValue") &&
      isScriptValue(value)
    ) {
      return scriptValueToString(value, {
        variableNameForId: (id) => `||variable:${id}||`,
        actorNameForId: (id) => `||actor:${id}||`,
        propertyNameForId,
        directionForValue,
      });
    } else if (isActorField(command, key, args, scriptEventDefs)) {
      return `||actor:${value}||`;
    } else if (isVariableField(command, key, args, scriptEventDefs)) {
      return `||variable:${value}||`;
    } else if (isPropertyField(command, key, args, scriptEventDefs)) {
      const propertyParts = String(value).split(":");
      return `||actor:${propertyParts[0]}||.${propertyNameForId(
        propertyParts[1]
      )}`;
    } else if (fieldType === "matharea") {
      return String(value).replace(/\$([VLT]*[0-9]+)\$/g, (_, match) => {
        return `||variable:${match}||`;
      });
    } else if (fieldType === "scene") {
      return `||scene:${value}||`;
    } else if (fieldType === "direction") {
      return directionForValue(value);
    } else if (fieldType === "animSpeed") {
      return animSpeedForValue(value);
    } else if (fieldType === "sprite") {
      return `||sprite:${value}||`;
    } else if (fieldType === "emote") {
      return `||emote:${value}||`;
    } else if (fieldType === "customEvent") {
      return `||custom-event:${value}||`;
    } else if (fieldType === "input") {
      return inputForValue(value);
    } else if (fieldType === "text" || fieldType === "textarea") {
      return lexText(String(value))
        .map((t) => {
          if (t.type === "text") {
            return t.value;
          } else if (t.type === "variable" && t.fixedLength !== undefined) {
            return `%D${t.fixedLength}||variable:${t.variableId}||`;
          } else if (t.type === "variable") {
            return `||variable:${t.variableId}||`;
          } else if (t.type === "char") {
            return `%c||variable:${t.variableId}||`;
          } else if (t.type === "gotoxy") {
            return " ";
          }
          return "";
        })
        .join("")
        .trim();
    }
    return String(value);
  };

  return scriptEventDefs[command]?.autoLabel?.(mapArg, args) ?? "";
};

export const replaceAutoLabelLocalValues = (
  label: string,
  lookups: {
    actorNameForId: (value: unknown) => string;
    variableNameForId: (value: unknown) => string;
    sceneNameForId: (value: unknown) => string;
    spriteNameForId: (value: unknown) => string;
    emoteNameForId: (value: unknown) => string;
    customEventNameForId: (value: unknown) => string;
  }
) => {
  return label
    .replace(
      /\|\|actor:([a-zA-Z0-9$-]+)\|\|/g,
      (match, id) => lookups.actorNameForId(id) ?? match
    )
    .replace(
      /\|\|variable:([a-zA-Z0-9$-]+)\|\|/g,
      (match, id) => lookups.variableNameForId(id) ?? match
    )
    .replace(
      /\|\|scene:([a-zA-Z0-9$-]+)\|\|/g,
      (match, id) => lookups.sceneNameForId(id) ?? match
    )
    .replace(
      /\|\|sprite:([a-zA-Z0-9$-]+)\|\|/g,
      (match, id) => lookups.spriteNameForId(id) ?? match
    )
    .replace(
      /\|\|emote:([a-zA-Z0-9$-]+)\|\|/g,
      (match, id) => lookups.emoteNameForId(id) ?? match
    )
    .replace(
      /\|\|custom-event:([a-zA-Z0-9$-]+)\|\|/g,
      (match, id) => lookups.customEventNameForId(id) ?? match
    );
};
