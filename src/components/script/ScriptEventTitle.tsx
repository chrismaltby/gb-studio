import React, { useEffect, useState } from "react";
import events from "lib/events";
import {
  isActorField,
  isPropertyField,
  isVariableField,
} from "lib/helpers/eventSystem";
import l10n from "lib/helpers/l10n";
import { NamedVariable, namedVariablesByContext } from "lib/helpers/variables";
import { Dictionary } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import {
  customEventSelectors,
  variableSelectors,
  getSceneActorIds,
  actorSelectors,
  sceneSelectors,
  spriteSheetSelectors,
  emoteSelectors,
} from "store/features/entities/entitiesState";
import keyBy from "lodash/keyBy";
import {
  actorName,
  customEventName,
  sceneName,
} from "store/features/entities/entitiesHelpers";
import { Actor } from "store/features/entities/entitiesTypes";
import styled from "styled-components";
import { fadeIn } from "ui/animations/animations";
import { animLabelLookup } from "components/forms/AnimationSpeedSelect";

interface ScriptEventTitleProps {
  command: string;
  args?: Record<string, unknown>;
}

type UnionType = {
  type: string;
  value: unknown;
};

const Wrapper = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  animation: ${fadeIn} 0.1s linear;
`;

const customEventActorsLookup = keyBy(
  Array.from(Array(10).keys()).map((i) => ({
    id: String(i),
    name: `Actor ${String.fromCharCode("A".charCodeAt(0) + i)}`,
  })),
  "id"
);

const ScriptEventTitle = ({ command, args = {} }: ScriptEventTitleProps) => {
  const localisedCommand = l10n(command);
  const eventName =
    localisedCommand !== command
      ? localisedCommand
      : (events[command] && events[command]?.name) || command;
  const labelName = args?.__label ? args.__label : undefined;

  const [autoName, setAutoName] = useState("");
  const [namedVariablesLookup, setNamedVariablesLookup] = useState<
    Dictionary<NamedVariable>
  >({});
  const editorType = useSelector((state: RootState) => state.editor.type);

  const sceneId = useSelector((state: RootState) => state.editor.scene);
  const entityId =
    useSelector((state: RootState) => state.editor.entityId) || sceneId;

  const variablesLookup = useSelector((state: RootState) =>
    variableSelectors.selectEntities(state)
  );
  const customEvent = useSelector((state: RootState) =>
    customEventSelectors.selectById(state, entityId)
  );
  const sceneActorIds = useSelector((state: RootState) =>
    getSceneActorIds(state, { id: sceneId })
  );
  const actorsLookup = useSelector((state: RootState) =>
    actorSelectors.selectEntities(state)
  );
  const scenesLookup = useSelector((state: RootState) =>
    sceneSelectors.selectEntities(state)
  );
  const scenes = useSelector((state: RootState) =>
    sceneSelectors.selectAll(state)
  );
  const spriteSheetsLookup = useSelector((state: RootState) =>
    spriteSheetSelectors.selectEntities(state)
  );
  const spriteSheets = useSelector((state: RootState) =>
    spriteSheetSelectors.selectAll(state)
  );
  const emotesLookup = useSelector((state: RootState) =>
    emoteSelectors.selectEntities(state)
  );
  const emotes = useSelector((state: RootState) =>
    emoteSelectors.selectAll(state)
  );
  const customEventsLookup = useSelector((state: RootState) =>
    customEventSelectors.selectEntities(state)
  );
  const customEvents = useSelector((state: RootState) =>
    customEventSelectors.selectAll(state)
  );

  useEffect(() => {
    const variables = namedVariablesByContext(
      editorType,
      entityId,
      variablesLookup,
      customEvent
    );
    const namedLookup = keyBy(variables, "id");
    setNamedVariablesLookup(namedLookup);
  }, [entityId, variablesLookup, editorType, customEvent]);

  useEffect(() => {
    if (events[command]?.autoLabel) {
      const fieldLookup = keyBy(events[command]?.fields || [], "key");

      const extractValue = (arg: unknown): unknown => {
        if (
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
      const actorNameForId = (value: unknown) => {
        if (editorType === "customEvent" && customEvent) {
          return (
            customEvent.actors[value as string]?.name ||
            customEventActorsLookup[value as string]?.name ||
            l10n("FIELD_PLAYER")
          ).replace(/ /g, "");
        }
        if (value === "$self$" && editorType === "actor") {
          return l10n("FIELD_SELF");
        } else if (value === "$self$" || value === "player") {
          return l10n("FIELD_PLAYER");
        } else if (actorsLookup[value as string] && sceneActorIds) {
          const actor = actorsLookup[value as string] as Actor;
          return actorName(actor, sceneActorIds?.indexOf(actor.id)).replace(
            / /g,
            ""
          );
        } else {
          return l10n("FIELD_PLAYER");
        }
      };
      const propertyNameForId = (value: string) => {
        if (value === "xpos") {
          return l10n("FIELD_X_POSITION").replace(/ /g, "");
        }
        if (value === "ypos") {
          return l10n("FIELD_Y_POSITION").replace(/ /g, "");
        }
        if (value === "direction") {
          return l10n("FIELD_DIRECTION").replace(/ /g, "");
        }
        if (value === "frame") {
          return l10n("FIELD_ANIMATION_FRAME").replace(/ /g, "");
        }
        return value;
      };
      const variableNameForId = (value: unknown) => {
        const id = String(value).replace(/^0*(.+)/, "$1");
        return `$${
          namedVariablesLookup[id]?.name.replace(/ /g, "") ?? String(value)
        }`;
      };
      const sceneNameForId = (value: unknown) => {
        const scene = scenesLookup[value as string];
        if (scene) {
          return sceneName(scene, scenes.indexOf(scene)).replace(/ /g, "");
        }
        return String(value);
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
      const animSpeedForValue = (value: unknown) => {
        return animLabelLookup[value as number] || String(value);
      };
      const spriteForValue = (value: unknown) => {
        return (
          spriteSheetsLookup[value as string]?.name ||
          spriteSheets[0]?.name ||
          String(value)
        );
      };
      const emoteForValue = (value: unknown) => {
        return (
          emotesLookup[value as string]?.name ||
          emotes[0]?.name ||
          String(value)
        );
      };
      const customEventNameForId = (value: unknown) => {
        const customEvent = customEventsLookup[value as string];
        if (customEvent) {
          return customEventName(
            customEvent,
            customEvents.indexOf(customEvent)
          ).replace(/ /g, "");
        }
        return String(value);
      };

      const mapArg = (key: string) => {
        const arg = args[key];
        const argValue = extractValue(arg);
        const fieldType = extractFieldType(key, arg);
        const fieldDefault =
          arg && (arg as { type: string })?.type
            ? (fieldLookup[key]?.defaultValue as Record<string, unknown>)?.[
                (arg as { type: string })?.type
              ]
            : fieldLookup[key]?.defaultValue;
        const fieldPlaceholder = fieldLookup[key]?.placeholder;

        const value =
          (argValue || fieldDefault || fieldPlaceholder) ?? argValue;

        if (isActorField(command, key, args)) {
          return actorNameForId(value);
        } else if (isVariableField(command, key, args)) {
          return variableNameForId(value);
        } else if (isPropertyField(command, key, args)) {
          const propertyParts = String(value).split(":");
          return `${actorNameForId(propertyParts[0])}.${propertyNameForId(
            propertyParts[1]
          )}`;
        } else if (fieldType === "matharea") {
          return String(value).replace(/\$([VLT]*[0-9]+)\$/g, (_, match) => {
            return variableNameForId(match);
          });
        } else if (fieldType === "scene") {
          return sceneNameForId(value);
        } else if (fieldType === "direction") {
          return directionForValue(value);
        } else if (fieldType === "animSpeed") {
          return animSpeedForValue(value);
        } else if (fieldType === "sprite") {
          return spriteForValue(value);
        } else if (fieldType === "emote") {
          return emoteForValue(value);
        } else if (fieldType === "customEvent") {
          return customEventNameForId(value);
        } else if (fieldType === "input") {
          return inputForValue(value);
        }
        return String(value);
      };
      try {
        setAutoName(events[command]?.autoLabel?.(mapArg, args) || "");
      } catch (e) {
        console.error(`Auto name failed for ${command} with args`, args);
        console.error(e);
      }
    }
  }, [
    command,
    args,
    namedVariablesLookup,
    editorType,
    actorsLookup,
    sceneActorIds,
    scenesLookup,
    scenes,
    customEvent,
    spriteSheetsLookup,
    spriteSheets,
    emotesLookup,
    emotes,
    customEventsLookup,
    customEvents,
  ]);

  return <Wrapper>{String(labelName || autoName || eventName)}</Wrapper>;
};

export default ScriptEventTitle;
