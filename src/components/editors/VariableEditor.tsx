import React, { FC, RefObject, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  globalVariableCode,
  globalVariableDefaultName,
} from "lib/helpers/variables";
import { RootState } from "store/configureStore";
import {
  actorSelectors,
  sceneSelectors,
  scriptEventSelectors,
  triggerSelectors,
  variableSelectors,
} from "store/features/entities/entitiesState";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { EditableText } from "ui/form/EditableText";
import { FormContainer, FormDivider, FormHeader } from "ui/form/FormLayout";
import { MenuItem } from "ui/menu/Menu";
import entitiesActions from "store/features/entities/entitiesActions";
import editorActions from "store/features/editor/editorActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import { isVariableField } from "lib/helpers/eventSystem";
import {
  Actor,
  Scene,
  ScriptEvent,
  Trigger,
} from "store/features/entities/entitiesTypes";
import l10n from "lib/helpers/l10n";
import { Sidebar, SidebarColumn } from "ui/sidebars/Sidebar";
import { FlatList } from "ui/lists/FlatList";
import { EntityListItem } from "ui/lists/EntityListItem";
import { Dictionary } from "@reduxjs/toolkit";
import useDimensions from "react-cool-dimensions";
import styled from "styled-components";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import {
  isUnionValue,
  walkNormalisedActorEvents,
  walkNormalisedSceneSpecificEvents,
  walkNormalisedTriggerEvents,
} from "store/features/entities/entitiesHelpers";
import { SymbolEditorWrapper } from "components/forms/symbols/SymbolEditorWrapper";
import { VariableReference } from "components/forms/ReferencesSelect";

interface VariableEditorProps {
  id: string;
}

type VariableUse = {
  id: string;
  name: string;
  sceneId: string;
  scene: Scene;
  sceneIndex: number;
  event: ScriptEvent;
} & (
  | {
      type: "scene";
    }
  | {
      type: "actor";
      actor: Actor;
      actorIndex: number;
      scene: Scene;
      sceneIndex: number;
    }
  | {
      type: "trigger";
      trigger: Trigger;
      triggerIndex: number;
      scene: Scene;
      sceneIndex: number;
    }
);

const sceneName = (scene: Scene, sceneIndex: number) =>
  scene.name ? scene.name : `Scene ${sceneIndex + 1}`;

const actorName = (actor: Actor, actorIndex: number) =>
  actor.name ? actor.name : `Actor ${actorIndex + 1}`;

const triggerName = (trigger: Trigger, triggerIndex: number) =>
  trigger.name ? trigger.name : `Trigger ${triggerIndex + 1}`;

const onVariableEventContainingId =
  (id: string, callback: (event: ScriptEvent) => void) =>
  (event: ScriptEvent) => {
    if (event.args) {
      for (const arg in event.args) {
        if (isVariableField(event.command, arg, event.args)) {
          const argValue = event.args[arg];
          if (
            argValue === id ||
            (isUnionValue(argValue) &&
              argValue.type === "variable" &&
              argValue.value === id)
          ) {
            callback(event);
          }
        }
      }
    }
  };

interface UsesWrapperProps {
  showSymbols: boolean;
}

const UsesWrapper = styled.div<UsesWrapperProps>`
  position: absolute;
  top: ${(props) => (props.showSymbols ? `71px` : `38px`)};
  left: 0;
  bottom: 0;
  right: 0;
`;

const UseMessage = styled.div`
  padding: 5px 10px;
  font-size: 11px;
`;

export const VariableEditor: FC<VariableEditorProps> = ({ id }) => {
  const { ref, height } = useDimensions();
  const variable = useSelector((state: RootState) =>
    variableSelectors.selectById(state, id)
  );
  const [variableUses, setVariableUses] = useState<VariableUse[]>([]);
  const scenes = useSelector((state: RootState) =>
    sceneSelectors.selectAll(state)
  );
  const actorsLookup = useSelector((state: RootState) =>
    actorSelectors.selectEntities(state)
  );
  const triggersLookup = useSelector((state: RootState) =>
    triggerSelectors.selectEntities(state)
  );
  const scriptEventsLookup = useSelector((state: RootState) =>
    scriptEventSelectors.selectEntities(state)
  );
  const [showSymbols, setShowSymbols] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    const uses: VariableUse[] = [];
    const useLookup: Dictionary<boolean> = {};

    for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {
      const scene = scenes[sceneIndex];
      walkNormalisedSceneSpecificEvents(
        scene,
        scriptEventsLookup,
        undefined,
        onVariableEventContainingId(id, (event: ScriptEvent) => {
          if (!useLookup[scene.id]) {
            uses.push({
              id: scene.id,
              name: sceneName(scene, sceneIndex),
              event,
              type: "scene",
              scene,
              sceneIndex,
              sceneId: scene.id,
            });
            useLookup[scene.id] = true;
          }
        })
      );
      for (let actorIndex = 0; actorIndex < scenes.length; actorIndex++) {
        const actorId = scene.actors[actorIndex];
        const actor = actorsLookup[actorId];
        if (actor) {
          walkNormalisedActorEvents(
            actor,
            scriptEventsLookup,
            undefined,
            onVariableEventContainingId(id, (event: ScriptEvent) => {
              if (!useLookup[scene.id]) {
                uses.push({
                  id: scene.id,
                  name: sceneName(scene, sceneIndex),
                  event,
                  type: "scene",
                  scene,
                  sceneIndex,
                  sceneId: scene.id,
                });
                useLookup[scene.id] = true;
              }
              if (!useLookup[actor.id]) {
                uses.push({
                  id: actor.id,
                  name: actorName(actor, actorIndex),
                  event,
                  type: "actor",
                  actor,
                  actorIndex,
                  scene,
                  sceneIndex,
                  sceneId: scene.id,
                });
                useLookup[actor.id] = true;
              }
            })
          );
        }
      }
      for (let triggerIndex = 0; triggerIndex < scenes.length; triggerIndex++) {
        const triggerId = scene.triggers[triggerIndex];
        const trigger = triggersLookup[triggerId];
        if (trigger) {
          walkNormalisedTriggerEvents(
            trigger,
            scriptEventsLookup,
            undefined,
            onVariableEventContainingId(id, (event: ScriptEvent) => {
              if (!useLookup[scene.id]) {
                uses.push({
                  id: scene.id,
                  name: sceneName(scene, sceneIndex),
                  event,
                  type: "scene",
                  scene,
                  sceneIndex,
                  sceneId: scene.id,
                });
                useLookup[scene.id] = true;
              }
              if (!useLookup[trigger.id]) {
                uses.push({
                  id: trigger.id,
                  name: triggerName(trigger, triggerIndex),
                  event,
                  type: "trigger",
                  trigger,
                  triggerIndex,
                  scene,
                  sceneIndex,
                  sceneId: scene.id,
                });
                useLookup[trigger.id] = true;
              }
            })
          );
        }
      }
    }

    setVariableUses(uses);
  }, [scenes, actorsLookup, triggersLookup, id, scriptEventsLookup]);

  const onRename = (e: React.ChangeEvent<HTMLInputElement>) => {
    const editValue = e.currentTarget.value;
    dispatch(
      entitiesActions.renameVariable({
        variableId: id,
        name: editValue,
      })
    );
  };

  const onCopyVar = () => {
    dispatch(clipboardActions.copyText(`$${globalVariableCode(id)}$`));
  };

  const onCopyChar = () => {
    dispatch(clipboardActions.copyText(`#${globalVariableCode(id)}#`));
  };

  const setSelectedId = (id: string, item: VariableUse) => {
    if (item.type === "actor") {
      dispatch(
        editorActions.selectActor({ actorId: id, sceneId: item.sceneId })
      );
    } else if (item.type === "trigger") {
      dispatch(
        editorActions.selectTrigger({ triggerId: id, sceneId: item.sceneId })
      );
    } else {
      dispatch(editorActions.selectScene({ sceneId: id }));
    }
    dispatch(editorActions.setFocusSceneId(item.sceneId));
  };

  const selectSidebar = () => {
    dispatch(editorActions.selectSidebar());
  };

  return (
    <Sidebar onClick={selectSidebar}>
      <SidebarColumn>
        <FormContainer>
          <FormHeader>
            <EditableText
              name="name"
              placeholder={globalVariableDefaultName(id)}
              value={variable?.name || ""}
              onChange={onRename}
            />
            <DropdownButton
              size="small"
              variant="transparent"
              menuDirection="right"
            >
              {!showSymbols && (
                <MenuItem onClick={() => setShowSymbols(true)}>
                  {l10n("FIELD_VIEW_GBVM_SYMBOLS")}
                </MenuItem>
              )}
              <MenuItem onClick={onCopyVar}>
                {l10n("MENU_VARIABLE_COPY_EMBED")}
              </MenuItem>
              <MenuItem onClick={onCopyChar}>
                {l10n("MENU_VARIABLE_COPY_EMBED_CHAR")}
              </MenuItem>
            </DropdownButton>
          </FormHeader>
          {showSymbols && (
            <>
              <SymbolEditorWrapper>
                <VariableReference id={id} />
              </SymbolEditorWrapper>
              <FormDivider />
            </>
          )}
        </FormContainer>
        <UsesWrapper
          ref={ref as RefObject<HTMLDivElement>}
          showSymbols={showSymbols}
        >
          <SplitPaneHeader collapsed={false}>
            {l10n("SIDEBAR_VARIABLE_USES")}
          </SplitPaneHeader>
          {variableUses.length > 0 ? (
            <FlatList
              items={variableUses}
              height={height - 30}
              setSelectedId={setSelectedId}
              children={({ item }) =>
                item.type === "scene" ? (
                  <EntityListItem item={item} type={item.type} />
                ) : (
                  <EntityListItem item={item} type={item.type} nestLevel={1} />
                )
              }
            />
          ) : (
            <UseMessage>{l10n("FIELD_VARIABLE_NOT_USED")}</UseMessage>
          )}
        </UsesWrapper>
      </SidebarColumn>
    </Sidebar>
  );
};
