import React, { useCallback, useMemo, useState } from "react";
import l10n from "shared/lib/lang/l10n";
import settingsActions from "store/features/settings/settingsActions";
import editorActions from "store/features/editor/editorActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled, { css } from "styled-components";
import { Button } from "ui/buttons/Button";
import { NumberInput } from "ui/form/NumberInput";
import { SearchInput } from "ui/form/SearchInput";
import { CaretDownIcon, StarIcon } from "ui/icons/Icons";
import { FlexGrow } from "ui/spacing/Spacing";
import type { VariableMapData } from "lib/compiler/compileData";
import { getSettings } from "store/features/settings/settingsState";

interface DebuggerVariablesPaneProps {
  collapsible?: boolean;
}

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

  :hover {
    color: ${(props) => props.theme.colors.highlight};
  }
`;

interface MenuItemFavoriteProps {
  visible: boolean;
  isFavorite: boolean;
}

const VariableRowFavorite = styled.div<MenuItemFavoriteProps>`
  opacity: 0;
  svg {
    display: inline-block;
    width: 10px;
    height: 10px;
    fill: ${(props) => props.theme.colors.text};
  }

  ${Button} {
    margin-right: -5px;
    transition: all 0.1s ease-out;
    height: 16px;
    width: 16px;
    padding: 0;
    min-width: 10px;
  }

  ${(props) =>
    props.isFavorite
      ? css`
          opacity: 1;
        `
      : ""}
  ${(props) =>
    !props.isFavorite
      ? css`
          svg {
            opacity: 0.3;
          }

          ${Button}:active {
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
    (state) => getSettings(state).watchedVariables
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

  return (
    <>
      <Heading>
        {collapsible && <CaretDownIcon />}
        {l10n("FIELD_VARIABLES")}
        <FlexGrow />
        <Button
          size="small"
          variant={variablesFilter === "all" ? "underlined" : "transparent"}
          onClick={onSetVariablesFilterAll}
        >
          All
        </Button>
        /
        <Button
          size="small"
          variant={variablesFilter === "watched" ? "underlined" : "transparent"}
          onClick={onSetVariablesFilterWatched}
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
              <NumberInput min={0} max={65535} value={variableData.value} />
            </InputWrapper>
            <VariableRowFavorite
              visible={false}
              isFavorite={variableData.isFavorite}
            >
              <Button
                size="small"
                variant="transparent"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleWatchedVariable(variableData.id);
                }}
              >
                <StarIcon />
              </Button>
            </VariableRowFavorite>
          </VariableRow>
        );
      })}
    </>
  );
};

export default DebuggerVariablesPane;
