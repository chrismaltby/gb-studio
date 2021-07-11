import React, { useEffect, useState } from "react";
import events from "lib/events";
import {
  isActorField,
  isPropertyField,
  isVariableField,
} from "lib/helpers/eventSystem";
import l10n from "lib/helpers/l10n";
import { EVENT_COMMENT } from "lib/compiler/eventTypes";
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
} from "store/features/entities/entitiesState";
import keyBy from "lodash/keyBy";
import { actorName, sceneName } from "store/features/entities/entitiesHelpers";
import { Actor } from "store/features/entities/entitiesTypes";
import styled from "styled-components";

interface ScriptEventTitleProps {
  command: string;
  args?: Record<string, unknown>;
}

const Wrapper = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const customEventActorsLookup = keyBy(
  Array.from(Array(10).keys()).map((i) => ({
    id: String(i),
    name: `Actor ${String.fromCharCode("A".charCodeAt(0) + i)}`,
  })),
  "id"
);

const ScriptEventTitle = ({ command, args = {} }: ScriptEventTitleProps) => {
  const isComment = command === EVENT_COMMENT;
  const localisedCommand = l10n(command);
  const eventName =
    localisedCommand !== command
      ? localisedCommand
      : (events[command] && events[command]?.name) || command;
  const labelName =
    (args?.__label ? args.__label : isComment && args?.text) || undefined;

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
      const actorNameForId = (value: unknown) => {
        if (
          editorType === "customEvent" &&
          customEventActorsLookup[value as string]
        ) {
          return customEventActorsLookup[value as string].name.replace(
            / /g,
            ""
          );
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

      const mapArg = (key: string) => {
        const arg = args[key];
        const argValue = extractValue(arg);
        const fieldType = fieldLookup[key]?.type || "";
        const fieldDefault =
          arg && (arg as { type: string })?.type
            ? (fieldLookup[key]?.defaultValue as Record<string, unknown>)?.[
                (arg as { type: string })?.type
              ]
            : fieldLookup[key]?.defaultValue;
        const fieldPlaceholder = fieldLookup[key]?.placeholder;

        const value =
          argValue || (fieldDefault ?? fieldPlaceholder ?? argValue);

        if (isActorField(command, key, args)) {
          return actorNameForId(value);
        } else if (isVariableField(command, key, args)) {
          return variableNameForId(value);
        } else if (isPropertyField(command, key, arg)) {
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
        }
        return String(value);
      };
      setAutoName(events[command]?.autoLabel?.(mapArg, args) || "");
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
  ]);

  return <Wrapper>{String(labelName || autoName || eventName)}</Wrapper>;
};

export default ScriptEventTitle;
