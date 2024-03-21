import ScriptEditor from "components/script/ScriptEditor";
import React, { useCallback, useMemo } from "react";
import l10n from "shared/lib/lang/l10n";
import { getSettings } from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled from "styled-components";
import { Button } from "ui/buttons/Button";
import { CaretDownIcon } from "ui/icons/Icons";
import { FlexGrow } from "ui/spacing/Spacing";
import { CodeEditor } from "ui/form/CodeEditor";
import { ScriptEditorCtx } from "shared/lib/scripts/context";
import { ScriptEditorContext } from "components/script/ScriptEditorContext";
import {
  actorSelectors,
  sceneSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesState";
import {
  ActorScriptKey,
  SceneScriptKey,
  TriggerScriptKey,
} from "shared/lib/entities/entitiesTypes";

interface DebuggerScriptPaneProps {
  collapsible?: boolean;
}

const Heading = styled.div`
  display: flex;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 11px;
  align-items: center;
  padding: 10px;
  background-color: ${(props) => props.theme.colors.sidebar.background};
  border-top: 1px solid ${(props) => props.theme.colors.sidebar.border};

  &:first-of-type {
    border-top: 0;
  }

  svg {
    margin-right: 5px;
    width: 8px;
    height: 8px;
    min-width: 8px;
    fill: ${(props) => props.theme.colors.input.text};
  }

  button {
    padding: 0 3px;
    margin: 0 5px;
    height: auto;
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  border-top: 1px solid ${(props) => props.theme.colors.sidebar.border};
`;

const CodeEditorWrapper = styled.div`
  flex-grow: 1;

  & > div {
    min-height: 100%;
    border-radius: 0;
    border: 0;
  }
`;

const DebuggerScriptPane = ({ collapsible }: DebuggerScriptPaneProps) => {
  const dispatch = useAppDispatch();
  const scriptMap = useAppSelector((state) => state.debug.scriptMap);
  const sceneMap = useAppSelector((state) => state.debug.sceneMap);
  const gbvmScripts = useAppSelector((state) => state.debug.gbvmScripts);
  const viewScriptType = useAppSelector(
    (state) => getSettings(state).debuggerScriptType
  );
  const currentScriptSymbol = useAppSelector(
    (state) => state.debug.currentScriptSymbol
  );
  const currentSceneSymbol = useAppSelector(
    (state) => state.debug.currentSceneSymbol
  );

  const onSetScriptTypeEditor = useCallback(() => {
    dispatch(
      settingsActions.editSettings({
        debuggerScriptType: "editor",
      })
    );
  }, [dispatch]);

  const onSetScriptTypeGBVM = useCallback(() => {
    dispatch(
      settingsActions.editSettings({
        debuggerScriptType: "gbvm",
      })
    );
  }, [dispatch]);

  const currentScriptEvents = scriptMap[currentScriptSymbol] ?? undefined;
  const currentGBVMScript = gbvmScripts[`${currentScriptSymbol}.s`] ?? "";
  const currentSceneData = sceneMap[currentSceneSymbol] ?? undefined;

  const scriptCtx: ScriptEditorCtx | undefined = useMemo(
    () =>
      currentScriptEvents
        ? {
            type: "entity",
            entityType: currentScriptEvents.entityType,
            entityId: currentScriptEvents.entityId,
            sceneId: currentScriptEvents.sceneId,
            scriptKey: currentScriptEvents.scriptType,
          }
        : undefined,
    [currentScriptEvents]
  );

  const actor = useAppSelector((state) =>
    actorSelectors.selectById(state, currentScriptEvents?.entityId)
  );
  const trigger = useAppSelector((state) =>
    triggerSelectors.selectById(state, currentScriptEvents?.entityId)
  );
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(
      state,
      currentSceneData?.id || currentScriptEvents?.entityId
    )
  );

  const currentScript = useMemo(() => {
    if (!currentScriptEvents) {
      return [];
    }
    if (currentScriptEvents.entityType === "actor" && actor) {
      return actor[currentScriptEvents.scriptType as ActorScriptKey];
    } else if (currentScriptEvents.entityType === "trigger" && trigger) {
      return trigger[currentScriptEvents.scriptType as TriggerScriptKey];
    } else if (currentScriptEvents.entityType === "scene" && scene) {
      return scene[currentScriptEvents.scriptType as SceneScriptKey];
    }
    return [];
  }, [actor, currentScriptEvents, scene, trigger]);

  return (
    <>
      <Heading>
        {collapsible && <CaretDownIcon />}
        {l10n("FIELD_CURRENT_SCRIPT")}
        <FlexGrow />
        <Button
          size="small"
          variant={viewScriptType === "editor" ? "underlined" : "transparent"}
          onClick={onSetScriptTypeEditor}
        >
          Editor
        </Button>
        /
        <Button
          size="small"
          variant={viewScriptType === "gbvm" ? "underlined" : "transparent"}
          onClick={onSetScriptTypeGBVM}
        >
          GBVM
        </Button>
      </Heading>
      <Content>
        {viewScriptType === "editor" && currentScriptEvents && scriptCtx ? (
          <ScriptEditorContext.Provider value={scriptCtx}>
            <ScriptEditor value={currentScript} />
          </ScriptEditorContext.Provider>
        ) : undefined}
        {viewScriptType === "gbvm" && currentGBVMScript ? (
          <CodeEditorWrapper>
            <CodeEditor value={currentGBVMScript} onChange={() => {}} />
          </CodeEditorWrapper>
        ) : undefined}
      </Content>
    </>
  );
};

export default DebuggerScriptPane;
