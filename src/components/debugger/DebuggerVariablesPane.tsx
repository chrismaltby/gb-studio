import React, { useCallback, useEffect, useMemo, useState } from "react";
import l10n from "shared/lib/lang/l10n";
import settingsActions from "store/features/settings/settingsActions";
import editorActions from "store/features/editor/editorActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled, { css } from "styled-components";
import { Button } from "ui/buttons/Button";
import { StyledButton } from "ui/buttons/style";
import { NumberInput } from "ui/form/NumberInput";
import { SearchInput } from "ui/form/SearchInput";
import { StarIcon } from "ui/icons/Icons";
import { FlexGrow } from "ui/spacing/Spacing";
import type { VariableMapData } from "lib/compiler/compileData";
import { getSettings } from "store/features/settings/settingsState";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { castEventToInt } from "renderer/lib/helpers/castEventValue";
import API from "renderer/lib/api";

interface DebuggerVariablesPaneProps {
  collapsible?: boolean;
}

const HeaderSearchInput = styled(SearchInput)`
  width: 100%;
  max-width: 100px;
  height: 22px;
  font-size: 11px;
  margin: -10px 5px;
  padding: 5px;
  border: 1px solid ${(props) => props.theme.colors.input.border};
`;

const VariableRow = styled.div`
  padding: 5px 10px;
  font-size: 11px;
  border-bottom: 1px solid ${(props) => props.theme.colors.sidebar.border};
  background: ${(props) => props.theme.colors.scripting.form.background};
  display: flex;
  align-items: center;
`;

const VariableName = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  max-width: calc(100% - 115px);
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
  text-align right;
  margin-right: 5px;
`;

const InputWrapper = styled.div`
  width: 70px;
  margin-right: 5px;
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

  &:hover {
    color: ${(props) => props.theme.colors.highlight};
  }
`;

const Content = styled.div`
  flex-grow: 1;
  background: ${(props) => props.theme.colors.scripting.form.background};
`;

interface MenuItemFavoriteProps {
  $visible: boolean;
  $isFavorite: boolean;
}

const VariableRowFavorite = styled.div<MenuItemFavoriteProps>`
  opacity: 0;
  svg {
    display: inline-block;
    width: 10px;
    height: 10px;
    fill: ${(props) => props.theme.colors.text};
  }

  ${StyledButton} {
    margin-right: -5px;
    transition: all 0.1s ease-out;
    height: 16px;
    width: 16px;
    padding: 0;
    min-width: 10px;
  }

  ${(props) =>
    props.$isFavorite
      ? css`
          opacity: 1;
        `
      : ""}
  ${(props) =>
    !props.$isFavorite
      ? css`
          svg {
            opacity: 0.3;
          }

          ${StyledButton}:active {
            transform: scale(1.5);
            svg {
              opacity: 1;
            }
          }
        `
      : ""}      
    ${VariableRow}:hover > & {
    opacity: 1;
  }
`;

const DebuggerVariablesPane = ({ collapsible }: DebuggerVariablesPaneProps) => {
  const dispatch = useAppDispatch();

  const variableDataBySymbol = useAppSelector(
    (state) => state.debug.variableDataBySymbol
  );
  const variableSymbols = useAppSelector(
    (state) => state.debug.variableSymbols
  );
  const variablesFilter = useAppSelector(
    (state) => getSettings(state).debuggerVariablesFilter
  );
  const variablesData = useAppSelector((state) => state.debug.variablesData);
  const watchedVariableIds = useAppSelector(
    (state) => getSettings(state).debuggerWatchedVariables
  );
  const isCollapsed = useAppSelector(
    (state) =>
      !!collapsible &&
      getSettings(state).debuggerCollapsedPanes.includes("variables")
  );
  const [varSearchTerm, setVarSearchTerm] = useState("");

  const onSearchVariables = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setVarSearchTerm(e.currentTarget.value);
    },
    []
  );

  const onSetVariablesFilterAll = useCallback(() => {
    dispatch(
      settingsActions.editSettings({
        debuggerVariablesFilter: "all",
      })
    );
  }, [dispatch]);

  const onSetVariablesFilterWatched = useCallback(() => {
    dispatch(
      settingsActions.editSettings({
        debuggerVariablesFilter: "watched",
      })
    );
  }, [dispatch]);

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

  const onToggleWatchedVariable = useCallback(
    (variableId: string) => {
      dispatch(settingsActions.toggleWatchedVariable(variableId));
    },
    [dispatch]
  );

  const onToggleCollapsed = useCallback(() => {
    dispatch(settingsActions.toggleDebuggerPaneCollapsed("variables"));
  }, [dispatch]);

  const filteredVariables = useMemo(() => {
    return variableSymbols
      .filter((symbol) => {
        const key =
          `${symbol} ${variableDataBySymbol[symbol]?.name}`.toUpperCase();
        return key.includes(varSearchTerm.toUpperCase());
      })
      .map((symbol) => {
        const variableData = variableDataBySymbol[symbol];
        if (!variableData) {
          return undefined;
        }
        const isFavorite = watchedVariableIds.includes(variableData.id);
        if (variablesFilter === "watched" && !isFavorite) {
          return undefined;
        }
        return {
          ...variableData,
          isFavorite,
          value: variablesData[variableSymbols.indexOf(variableData.symbol)],
        };
      })
      .filter((i) => i) as (VariableMapData & {
      isFavorite: boolean;
      value: number;
    })[];
  }, [
    varSearchTerm,
    variableDataBySymbol,
    variableSymbols,
    variablesData,
    variablesFilter,
    watchedVariableIds,
  ]);

  useEffect(() => {
    API.debugger.setWatchedVariableIds(watchedVariableIds);
  }, [watchedVariableIds]);

  return (
    <>
      <SplitPaneHeader
        onToggle={collapsible ? onToggleCollapsed : undefined}
        collapsed={isCollapsed}
        variant="secondary"
        buttons={
          !isCollapsed && (
            <>
              <HeaderSearchInput
                value={varSearchTerm}
                placeholder={l10n("TOOLBAR_SEARCH")}
                onChange={onSearchVariables}
              />
              <Button
                size="small"
                variant={
                  variablesFilter === "all" ? "underlined" : "transparent"
                }
                onClick={onSetVariablesFilterAll}
              >
                {l10n("FIELD_ALL")}
              </Button>
              /
              <Button
                size="small"
                variant={
                  variablesFilter === "watched" ? "underlined" : "transparent"
                }
                onClick={onSetVariablesFilterWatched}
              >
                {l10n("FIELD_WATCHED")}
              </Button>
            </>
          )
        }
      >
        {l10n("FIELD_VARIABLES")}
      </SplitPaneHeader>
      {!isCollapsed && (
        <Content>
          {filteredVariables.map((variableData) => {
            return (
              <VariableRow key={variableData.symbol}>
                <VariableName>
                  <ValueButton onClick={() => onSelectVariable(variableData)}>
                    {variableData.name ?? variableData.symbol}
                  </ValueButton>
                  <Symbol>{variableData.symbol}</Symbol>
                </VariableName>
                <FlexGrow />
                <Eq>=</Eq>
                <InputWrapper>
                  <NumberInput
                    min={0}
                    max={65535}
                    value={variableData.value}
                    onChange={(e) => {
                      const newValue = castEventToInt(e, 0);
                      API.debugger.setGlobal(variableData.symbol, newValue);
                    }}
                  />
                </InputWrapper>
                <VariableRowFavorite
                  $visible={false}
                  $isFavorite={variableData.isFavorite}
                >
                  <Button
                    size="small"
                    variant="transparent"
                    onClick={() => {
                      onToggleWatchedVariable(variableData.id);
                    }}
                    title={l10n("FIELD_WATCH")}
                  >
                    <StarIcon />
                  </Button>
                </VariableRowFavorite>
              </VariableRow>
            );
          })}
        </Content>
      )}
    </>
  );
};

export default DebuggerVariablesPane;
