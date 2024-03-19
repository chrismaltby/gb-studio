import ScriptEditor from "components/script/ScriptEditor";
import React, { useCallback, useEffect, useState } from "react";
import { ScriptEventParentType } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import { ScriptMapItem } from "store/features/debugger/debuggerState";
import { useAppSelector } from "store/hooks";
import styled from "styled-components";
import { SearchInput } from "ui/form/SearchInput";

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

const Heading = styled.div``;

const Column = styled.div`
  flex-grow: 1;
  max-width: 33%;
  padding: 10px;
  box-sizing: border-box;
  overflow: scroll;
  border-right: 1px solid ${(props) => props.theme.colors.sidebar.border};
`;

const DebuggerPane = () => {
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
  const [currentScriptEvents, setCurrentScriptEvents] =
    useState<ScriptMapItem>();

  const [varSearchTerm, setVarSearchTerm] = useState("");

  const onSearchVariables = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setVarSearchTerm(e.currentTarget.value);
    },
    []
  );

  useEffect(() => {
    const getClosestAddress = (bank: number, address: number) => {
      const bankScripts = memoryDict.get(bank);
      const currentAddress = address;
      let closestAddress = -1;
      if (bankScripts) {
        const addresses = Array.from(bankScripts.keys());
        for (let i = 0; i < addresses.length; i++) {
          if (addresses[i] > currentAddress) {
            break;
          } else {
            closestAddress = addresses[i];
          }
        }
      }
      return closestAddress;
    };

    let string = "";
    scriptContexts.forEach((c) => {
      console.log({ memoryDict });
      string += `${c.current ? ">>>" : "   "} [${String(c.bank).padStart(
        3,
        "0"
      )}] ${
        memoryDict.get(c.bank)?.get(getClosestAddress(c.bank, c.address)) ??
        "NONE"
      }:${String(c.address).padStart(6, "0")}\n`;

      if (c.current) {
        const script =
          memoryDict.get(c.bank)?.get(getClosestAddress(c.bank, c.address)) ??
          "";
        console.log(script, scriptMap[script.slice(1)]);
        if (script) {
          setCurrentScriptEvents(scriptMap[script.slice(1)]);
        }
      }
    });
  }, [memoryDict, scriptContexts, scriptMap]);

  return (
    <Wrapper>
      <Column>
        <Heading>VRAM</Heading>
        <img src={vramPreview} alt=""></img>
      </Column>
      <Column>
        <Heading>{l10n("FIELD_VARIABLES")}</Heading>
        <SearchInput value={varSearchTerm} onChange={onSearchVariables} />
        {variableSymbols

          .filter((symbol) => {
            const key =
              `${symbol} ${variableDataBySymbol[symbol]?.name}`.toUpperCase();
            return key.includes(varSearchTerm.toUpperCase());
          })
          .map((symbol, i) => {
            return (
              <div key={symbol}>
                {variableDataBySymbol[symbol]?.name ?? symbol}-{symbol}=
                {variablesData[variableSymbols.indexOf(symbol)]}
              </div>
            );
          })}
      </Column>
      <Column>
        <Heading>{l10n("FIELD_CURRENT_SCRIPT")}</Heading>
        {currentScriptEvents ? (
          <ScriptEditor
            value={currentScriptEvents.script}
            type={currentScriptEvents.entityType as ScriptEventParentType}
            entityId={currentScriptEvents.entityId}
            scriptKey={currentScriptEvents.scriptType}
          />
        ) : (
          ""
        )}
      </Column>
    </Wrapper>
  );
};

export default DebuggerPane;
