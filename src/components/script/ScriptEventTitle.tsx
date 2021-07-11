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
} from "store/features/entities/entitiesState";
import keyBy from "lodash/keyBy";
import { actorName } from "store/features/entities/entitiesHelpers";
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
      const extractValue = (arg: unknown): unknown => {
        if (typeof arg === "object" && "value" in (arg as { value: unknown })) {
          return (arg as { value: unknown }).value;
        }
        return arg;
      };
      const actorNameForId = (value: unknown) => {
        if (value === "$self$" && editorType === "actor") {
          return l10n("FIELD_SELF");
        } else if (value === "$self$" || value === "player") {
          return l10n("FIELD_PLAYER");
        } else if (actorsLookup[value as string] && sceneActorIds) {
          const actor = actorsLookup[value as string] as Actor;
          return actorName(actor, sceneActorIds?.indexOf(actor.id));
        } else {
          return l10n("FIELD_PLAYER");
        }
      };
      const propertyNameForId = (value: string) => {
        if (value === "xpos") {
          return l10n("FIELD_X_POSITION");
        }
        if (value === "ypos") {
          return l10n("FIELD_Y_POSITION");
        }
        if (value === "direction") {
          return l10n("FIELD_DIRECTION");
        }
        if (value === "frame") {
          return l10n("FIELD_ANIMATION_FRAME");
        }
        return value;
      };

      const mapArg = (key: string) => {
        const arg = args[key];
        const argValue = extractValue(arg);
        if (isActorField(command, key, args)) {
          return actorNameForId(argValue);
        } else if (isVariableField(command, key, args)) {
          return `$${
            namedVariablesLookup[argValue as string]?.name.replace(/ /g, "") ??
            String(argValue)
          }`;
        } else if (isPropertyField(command, key, arg)) {
          const propertyParts = String(argValue).split(":");
          return `${actorNameForId(propertyParts[0]).replace(
            / /g,
            ""
          )} ${propertyNameForId(propertyParts[1]).replace(/ /g, "")}`;
        }
        return String(argValue);
      };
      setAutoName(events[command]?.autoLabel?.(mapArg) || "");
    }
  }, [
    command,
    args,
    namedVariablesLookup,
    editorType,
    actorsLookup,
    sceneActorIds,
  ]);

  return <Wrapper>{String(autoName || labelName || eventName)}</Wrapper>;
};

export default ScriptEventTitle;
