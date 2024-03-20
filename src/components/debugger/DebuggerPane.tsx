import ScriptEditor from "components/script/ScriptEditor";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScriptEventParentType } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import { ScriptMapItem } from "store/features/debugger/debuggerState";
import { getSettings } from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled from "styled-components";
import { Button } from "ui/buttons/Button";
import { NumberInput } from "ui/form/NumberInput";
import { SearchInput } from "ui/form/SearchInput";
import { CaretDownIcon } from "ui/icons/Icons";
import { FlexGrow } from "ui/spacing/Spacing";
import { CodeEditor } from "ui/form/CodeEditor";

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  background-color: ${(props) => props.theme.colors.sidebar.background};

  img {
    image-rendering: pixelated;
  }
`;

const Heading = styled.div`
  display: flex;
  text-transform: uppercase;
  font-size: 10px;
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
  max-width: 33.3333%;
  box-sizing: border-box;
  overflow: auto;
  border-right: 1px solid ${(props) => props.theme.colors.sidebar.border};

  &:last-of-type {
    border-right: 0;
  }
`;

const ColumnContent = styled.div`
  padding: 5px;

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
`;

const VariableName = styled.div`
  display: flex;
  flex-direction: column;
`;

const Symbol = styled.span`
  opacity: 0.5;
  font-size: 8px;
  padding-top: 5px;
`;

const Eq = styled.span`
  flex-grow: 1;
  text-align right;
  margin-right: 5px;
`;

const InputWrapper = styled.div`
  width: 150px;
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

const NotInitializedWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
`;

const DebuggerPane = () => {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector((state) => state.debug.initialized);
  const vramPreview = useAppSelector((state) => state.debug.vramPreview);
  const memoryDict = useAppSelector((state) => state.debug.memoryDict);
  const variableDataBySymbol = useAppSelector(
    (state) => state.debug.variableDataBySymbol
  );
  const variableSymbols = useAppSelector(
    (state) => state.debug.variableSymbols
  );
  const variablesData = useAppSelector((state) => state.debug.variablesData);
  const scriptContexts = useAppSelector((state) => state.debug.scriptContexts);
  const scriptMap = useAppSelector((state) => state.debug.scriptMap);
  const gbvmScripts = useAppSelector((state) => state.debug.gbvmScripts);
  const viewScriptType = useAppSelector(
    (state) => getSettings(state).debuggerScriptType
  );
  const currentScriptSymbol = useAppSelector(
    (state) => state.debug.currentScriptSymbol
  );
  //   const [currentScriptEvents, setCurrentScriptEvents] =
  // useState<ScriptMapItem>();
  //   const [currentScript, setCurrentScript] = useState("");

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

  if (!initialized) {
    return (
      <NotInitializedWrapper>
        Debugger not connected. Build your game first.
      </NotInitializedWrapper>
    );
  }

  return (
    <Wrapper>
      <Column>
        <Heading>
          <CaretDownIcon /> VRAM
        </Heading>
        <ColumnContent>
          <img src={vramPreview} alt=""></img>
        </ColumnContent>
        <Heading>
          <CaretDownIcon /> Current Scene
        </Heading>
        <ColumnContent></ColumnContent>
        <Heading>
          <CaretDownIcon /> Breakpoints
        </Heading>
        <ColumnContent></ColumnContent>
      </Column>
      <Column>
        <Heading>
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
                  {variableDataBySymbol[symbol]?.name ?? symbol}
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
      </Column>
      <Column>
        <Heading>
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
        {viewScriptType === "editor" && currentScriptEvents ? (
          <ScriptEditor
            value={currentScriptEvents.script}
            type={currentScriptEvents.entityType as ScriptEventParentType}
            entityId={currentScriptEvents.entityId}
            scriptKey={currentScriptEvents.scriptType}
          />
        ) : undefined}
        {viewScriptType === "gbvm" && currentGBVMScript ? (
          <CodeEditorWrapper>
            <CodeEditor value={currentGBVMScript} onChange={() => {}} />
          </CodeEditorWrapper>
        ) : undefined}
      </Column>
    </Wrapper>
  );
};

export default DebuggerPane;
