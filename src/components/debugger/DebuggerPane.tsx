import React, { useCallback } from "react";
import editorActions from "store/features/editor/editorActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled from "styled-components";
import { SearchInput } from "ui/form/SearchInput";
import { CaretDownIcon } from "ui/icons/Icons";
import {
  actorSelectors,
  sceneSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesState";
import { actorName, triggerName } from "shared/lib/entities/entitiesHelpers";
import useResizeObserver from "ui/hooks/use-resize-observer";
import DebuggerScriptPane from "components/debugger/DebuggerScriptPane";
import DebuggerVariablesPane from "components/debugger/DebuggerVariablesPane";

const COL1_WIDTH = 290;
const COL2_WIDTH = 350;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  background: ${(props) => props.theme.colors.scripting.form.background};

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

const Column = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  box-sizing: border-box;
  overflow-y: auto;
  border-right: 1px solid ${(props) => props.theme.colors.sidebar.border};
  font-size: 11px;

  &:last-of-type {
    border-right: 0;
  }
`;

const ColumnContent = styled.div`
  border-top: 1px solid ${(props) => props.theme.colors.sidebar.border};
  background: ${(props) => props.theme.colors.scripting.form.background};
  padding: 10px;

  ${SearchInput} {
    width: 100%;
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
  line-height: 11px;

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
  const scriptMap = useAppSelector((state) => state.debug.scriptMap);
  const sceneMap = useAppSelector((state) => state.debug.sceneMap);
  const currentScriptSymbol = useAppSelector(
    (state) => state.debug.currentScriptSymbol
  );
  const currentSceneSymbol = useAppSelector(
    (state) => state.debug.currentSceneSymbol
  );

  const currentScriptEvents = scriptMap[currentScriptSymbol] ?? undefined;
  const currentSceneData = sceneMap[currentSceneSymbol] ?? undefined;

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

  const numColumns = !wrapperSize.width
    ? 0
    : wrapperSize.width > 960
    ? 3
    : wrapperSize.width > 560
    ? 2
    : 1;

  return (
    <Wrapper ref={wrapperEl}>
      {!initialized && (
        <NotInitializedWrapper>
          Debugger not connected. Build your game first.
        </NotInitializedWrapper>
      )}
      {initialized && numColumns > 0 && (
        <>
          <Column style={numColumns > 1 ? { maxWidth: COL1_WIDTH } : undefined}>
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
              <ColumnContent style={{ minHeight: 60 }}>
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
                {currentScriptSymbol && (
                  <DataRow>
                    <DataLabel>Script:</DataLabel>
                    {currentScriptSymbol}
                  </DataRow>
                )}
              </ColumnContent>
            )}
            <Heading>
              <CaretDownIcon /> Breakpoints
            </Heading>
            <ColumnContent></ColumnContent>
            {numColumns < 3 && <DebuggerVariablesPane collapsible={true} />}
            {numColumns < 2 && <DebuggerScriptPane collapsible={true} />}
          </Column>
          {numColumns > 2 && (
            <Column style={{ maxWidth: COL2_WIDTH }}>
              <DebuggerVariablesPane />
            </Column>
          )}
          {numColumns > 1 && (
            <Column
              style={{
                maxWidth:
                  numColumns === 3
                    ? `calc(100% - ${COL1_WIDTH}px - ${COL2_WIDTH}px)`
                    : `calc(100% - ${COL1_WIDTH}px)`,
              }}
            >
              <DebuggerScriptPane />
            </Column>
          )}
        </>
      )}
    </Wrapper>
  );
};

export default DebuggerPane;
