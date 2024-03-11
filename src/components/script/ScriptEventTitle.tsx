import React, { useContext, useEffect, useState } from "react";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import { NamedVariable, namedVariablesByContext } from "renderer/lib/variables";
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
} from "shared/lib/entities/entitiesHelpers";
import { ActorNormalized } from "shared/lib/entities/entitiesTypes";
import styled from "styled-components";
import { fadeIn } from "ui/animations/animations";
import { ScriptEditorContext } from "./ScriptEditorContext";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";
import API from "renderer/lib/api";
import { replaceAutoLabelLocalValues } from "shared/lib/scripts/autoLabel";

interface ScriptEventTitleProps {
  command: string;
  args?: Record<string, unknown>;
}

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
  const context = useContext(ScriptEditorContext);
  const scriptEventDefs = useSelector((state: RootState) =>
    selectScriptEventDefs(state)
  );
  const localisedCommand = l10n(command as L10NKey);
  const eventName =
    localisedCommand !== command
      ? localisedCommand
      : (scriptEventDefs[command] && scriptEventDefs[command]?.name) || command;
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
      context,
      entityId,
      variablesLookup,
      customEvent
    );
    const namedLookup = keyBy(variables, "id");
    setNamedVariablesLookup(namedLookup);
  }, [entityId, variablesLookup, context, customEvent]);

  useEffect(() => {
    async function fetchAutoLabel() {
      if (scriptEventDefs[command]?.hasAutoLabel) {
        const actorNameForId = (value: unknown) => {
          if (context === "script" && customEvent) {
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
            const actor = actorsLookup[value as string] as ActorNormalized;
            return actorName(actor, sceneActorIds?.indexOf(actor.id)).replace(
              / /g,
              ""
            );
          } else {
            return l10n("FIELD_PLAYER");
          }
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
        const spriteNameForId = (value: unknown) => {
          return (
            spriteSheetsLookup[value as string]?.name ||
            spriteSheets[0]?.name ||
            String(value)
          );
        };
        const emoteNameForId = (value: unknown) => {
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

        try {
          if (scriptEventDefs[command]?.hasAutoLabel) {
            setAutoName(
              replaceAutoLabelLocalValues(
                await API.script.getScriptAutoLabel(command, args),
                {
                  actorNameForId,
                  variableNameForId,
                  sceneNameForId,
                  spriteNameForId,
                  emoteNameForId,
                  customEventNameForId,
                }
              )
            );
          }
        } catch (e) {
          console.error(`Auto name failed for ${command} with args`, args);
          console.error(e);
        }
      }
    }
    fetchAutoLabel();
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
    context,
    scriptEventDefs,
  ]);

  return <Wrapper>{String(labelName || autoName || eventName)}</Wrapper>;
};

export default ScriptEventTitle;
