import ScriptEditor from "components/script/ScriptEditor";
import React, { useCallback, useMemo, useState } from "react";
import l10n from "shared/lib/lang/l10n";
import { getSettings } from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import editorActions from "store/features/editor/editorActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled from "styled-components";
import { Button } from "ui/buttons/Button";
import { NumberInput } from "ui/form/NumberInput";
import { SearchInput } from "ui/form/SearchInput";
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
import { actorName, triggerName } from "shared/lib/entities/entitiesHelpers";
import type { VariableMapData } from "lib/compiler/compileData";
import useResizeObserver from "ui/hooks/use-resize-observer";

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  font-size: 10px;
  background-color: ${(props) => props.theme.colors.sidebar.background};

  img {
    image-rendering: pixelated;
  }
`;

const Heading = styled.div`
  display: flex;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 11px;
  align-items: center;
  padding: 10px;

  border-top: 1px solid ${(props) => props.theme.colors.sidebar.border};

  &:first-of-type {
    border-top: 0;
  }

  svg {
    margin-right: 5px;
    width: 8px;
    height: 8px;
    fill: ${(props) => props.theme.colors.input.text};
  }

  button {
    padding: 0 3px;
    margin: 0 5px;
    height: auto;
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  box-sizing: border-box;
  overflow: auto;
  border-right: 1px solid ${(props) => props.theme.colors.sidebar.border};

  &:last-of-type {
    border-right: 0;
  }
`;

const ColumnContent = styled.div`
  padding: 0 10px;

  ${SearchInput} {
    width: 100%;
  }
`;

const VariableRow = styled.div`
  padding: 5px 10px;
  font-size: 11px;
  border-bottom: 1px solid ${(props) => props.theme.colors.input.border};
  display: flex;
  align-items: center;

  &:last-of-type {
    border-bottom: 0;
  }
`;

const VariableName = styled.div`
  display: flex;
  flex-direction: column;
  width: calc(100% - 100px);
`;

const Symbol = styled.span`
  opacity: 0.5;
  font-size: 8px;
  padding-top: 5px;

  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 100%;
  overflow: hidden;
`;

const Eq = styled.span`
  flex-grow: 1;
  text-align right;
  margin-right: 5px;
`;

const InputWrapper = styled.div`
  width: 70px;
`;

const CodeEditorWrapper = styled.div`
  flex-grow: 1;

  & > div {
    min-height: 100%;
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    border-bottom: 0;
  }
`;

const DataRow = styled.div`
  padding-bottom: 5px;
  &:last-of-type {
    padding-bottom: 10px;
  }
`;

const DataLabel = styled.span`
  font-weight: bold;
  padding-right: 5px;
`;

const ValueButton = styled.button`
  background: transparent;
  color: ${(props) => props.theme.colors.text};
  display: inline;
  padding: 0;
  font-size: 11px;
  border: 0;
  margin: 0;
  height: 11px;
  text-align: left;

  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 100%;
  overflow: hidden;

  :hover {
    color: ${(props) => props.theme.colors.highlight};
  }
`;

const NotInitializedWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
`;

const DebuggerPane = () => {
  const dispatch = useAppDispatch();
  const [wrapperEl, wrapperSize] = useResizeObserver<HTMLDivElement>();

  const initialized = useAppSelector((state) => state.debug.initialized);
  const vramPreview = useAppSelector((state) => state.debug.vramPreview);
  const variableDataBySymbol = useAppSelector(
    (state) => state.debug.variableDataBySymbol
  );
  const variableSymbols = useAppSelector(
    (state) => state.debug.variableSymbols
  );
  const variablesData = useAppSelector((state) => state.debug.variablesData);
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

  const [varSearchTerm, setVarSearchTerm] = useState("");

  const onSearchVariables = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setVarSearchTerm(e.currentTarget.value);
    },
    []
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

  const actorIndex = scene?.actors.indexOf(actor?.id ?? "") ?? -1;
  const triggerIndex = scene?.triggers.indexOf(trigger?.id ?? "") ?? -1;

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

  const onSelectScene = useCallback(
    (sceneId: string) => {
      dispatch(editorActions.selectScene({ sceneId }));
      dispatch(editorActions.editSearchTerm(""));
      dispatch(editorActions.editSearchTerm(sceneId));
    },
    [dispatch]
  );

  const onSelectActor = useCallback(
    (actorId: string, sceneId: string) => {
      dispatch(editorActions.selectActor({ sceneId, actorId }));
      dispatch(editorActions.editSearchTerm(""));
      dispatch(editorActions.editSearchTerm(sceneId));
    },
    [dispatch]
  );

  const onSelectTrigger = useCallback(
    (triggerId: string, sceneId: string) => {
      dispatch(
        editorActions.selectTrigger({
          sceneId,
          triggerId,
        })
      );
      dispatch(editorActions.editSearchTerm(""));
      dispatch(editorActions.editSearchTerm(sceneId));
    },
    [dispatch]
  );

  const onSelectVariable = useCallback(
    (variableData: VariableMapData) => {
      if (!variableData.isLocal) {
        dispatch(
          editorActions.selectVariable({
            variableId: variableData.id,
          })
        );
      } else if (variableData.entityType === "scene") {
        onSelectScene(variableData.sceneId);
      } else if (variableData.entityType === "actor") {
        onSelectActor(variableData.entityId, variableData.sceneId);
      } else if (variableData.entityType === "trigger") {
        onSelectTrigger(variableData.entityId, variableData.sceneId);
      }
    },
    [dispatch, onSelectActor, onSelectScene, onSelectTrigger]
  );

  const numColumns = !wrapperSize.width
    ? 0
    : wrapperSize.width > 960
    ? 3
    : wrapperSize.width > 560
    ? 2
    : 1;

  const variablesPane = (
    <>
      <Heading>
        {numColumns <= 2 && <CaretDownIcon />}
        {l10n("FIELD_VARIABLES")}
        <FlexGrow />
        <Button
          size="small"
          variant={viewScriptType === "editor" ? "underlined" : "transparent"}
          onClick={onSetScriptTypeEditor}
        >
          All
        </Button>
        /
        <Button
          size="small"
          variant={viewScriptType === "gbvm" ? "underlined" : "transparent"}
          onClick={onSetScriptTypeGBVM}
        >
          Watched
        </Button>
      </Heading>
      <ColumnContent>
        <SearchInput
          value={varSearchTerm}
          placeholder={l10n("TOOLBAR_SEARCH")}
          onChange={onSearchVariables}
        />
      </ColumnContent>

      {variableSymbols

        .filter((symbol) => {
          const key =
            `${symbol} ${variableDataBySymbol[symbol]?.name}`.toUpperCase();
          return key.includes(varSearchTerm.toUpperCase());
        })
        .map((symbol) => {
          return (
            <VariableRow key={symbol}>
              <VariableName>
                <ValueButton
                  onClick={() => onSelectVariable(variableDataBySymbol[symbol])}
                >
                  {variableDataBySymbol[symbol]?.name ?? symbol}
                </ValueButton>
                <Symbol>{symbol}</Symbol>
              </VariableName>
              <Eq>=</Eq>
              <InputWrapper>
                <NumberInput
                  min={0}
                  max={65535}
                  value={variablesData[variableSymbols.indexOf(symbol)]}
                />
              </InputWrapper>
            </VariableRow>
          );
        })}
    </>
  );

  const scriptPane = (
    <>
      <Heading>
        {numColumns === 1 && <CaretDownIcon />}
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
    </>
  );

  return (
    <Wrapper ref={wrapperEl}>
      {!initialized && (
        <NotInitializedWrapper>
          Debugger not connected. Build your game first.
        </NotInitializedWrapper>
      )}
      {initialized && numColumns > 0 && (
        <>
          <Column style={numColumns > 1 ? { maxWidth: 275 } : undefined}>
            <Heading>
              <CaretDownIcon /> VRAM
            </Heading>
            <ColumnContent>
              <img src={vramPreview} alt=""></img>
            </ColumnContent>
            <Heading>
              <CaretDownIcon /> Current State
            </Heading>
            {currentSceneData && (
              <ColumnContent>
                {currentSceneData && (
                  <DataRow>
                    <DataLabel>Scene:</DataLabel>
                    <ValueButton
                      onClick={() => onSelectScene(currentSceneData.id)}
                    >
                      {currentSceneData.name}
                    </ValueButton>
                  </DataRow>
                )}
                {actor && actorIndex > -1 && (
                  <DataRow>
                    <DataLabel>Actor:</DataLabel>
                    <ValueButton
                      onClick={() =>
                        onSelectActor(actor.id, currentSceneData.id)
                      }
                    >
                      {actorName(actor, actorIndex)}
                    </ValueButton>
                  </DataRow>
                )}
                {trigger && triggerIndex > -1 && (
                  <DataRow>
                    <DataLabel>Trigger:</DataLabel>
                    <ValueButton
                      onClick={() =>
                        onSelectTrigger(trigger.id, currentSceneData.id)
                      }
                    >
                      {triggerName(trigger, triggerIndex)}
                    </ValueButton>
                  </DataRow>
                )}
              </ColumnContent>
            )}
            <Heading>
              <CaretDownIcon /> Breakpoints
            </Heading>
            <ColumnContent></ColumnContent>
            {numColumns < 3 && variablesPane}
            {numColumns < 2 && scriptPane}
          </Column>
          {numColumns > 2 && (
            <Column style={{ maxWidth: 350 }}>{variablesPane}</Column>
          )}
          {numColumns > 1 && (
            <Column
              style={{
                maxWidth:
                  numColumns === 3
                    ? `calc(100% - 350px - 275px)`
                    : `calc(100% - 275px)`,
              }}
            >
              {scriptPane}
            </Column>
          )}
        </>
      )}
    </Wrapper>
  );
};

export default DebuggerPane;
