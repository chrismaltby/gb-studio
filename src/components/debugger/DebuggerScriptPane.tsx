import ScriptEditor from "components/script/ScriptEditor";
import React, { useCallback, useMemo } from "react";
import l10n from "shared/lib/lang/l10n";
import { getSettings } from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled from "styled-components";
import { Button } from "ui/buttons/Button";
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
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";

interface DebuggerScriptPaneProps {
  collapsible?: boolean;
}

const Content = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
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
  const vmOpSizes = useAppSelector((state) => state.debug.vmOpSizes);
  const viewScriptType = useAppSelector(
    (state) => getSettings(state).debuggerScriptType
  );
  const currentScriptSymbol = useAppSelector(
    (state) => state.debug.currentScriptSymbol
  );
  const currentSceneSymbol = useAppSelector(
    (state) => state.debug.currentSceneSymbol
  );
  const currentScriptOffset = useAppSelector(
    (state) => state.debug.currentScriptOffset
  );
  const isCollapsed = useAppSelector(
    (state) =>
      !!collapsible &&
      getSettings(state).debuggerCollapsedPanes.includes("script")
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

  const gbvmSourceMap = useMemo(() => {
    const lines = currentGBVMScript.split("\n");

    let offset = 0;
    const lookupTable: { [offset: number]: number } = {};

    // Iterate over each line
    lines.forEach((line, index) => {
      console.log(index, ": ", line);
      console.log({ line });
      // Remove comments
      const lineWithoutComments = line.split(";")[0].trim();

      // Ignore empty lines
      if (lineWithoutComments === "") return;

      // Handle .asciz strings
      if (lineWithoutComments.startsWith(".asciz")) {
        // const match = lineWithoutComments.match(/".*"/);
        // if (match) {
        //   // Subtract 2 for the quotes, then count \\ as single characters
        //   const stringLength =
        //     match[0].length - 2 - (match[0].split("\\").length - 1);
        //   lookupTable[offset] = index;
        //   offset += stringLength + 1; // zero terminated strings
        // }

        const stringLiteralMatch = lineWithoutComments.match(/".*"/);
        if (stringLiteralMatch) {
          // const stringLiteral = stringLiteralMatch[0];
          // // Initially count all characters except the quotes
          // let stringLength = stringLiteral.length - 2;

          // // Correcting for octal sequences
          // // Each octal sequence (\ and three digits) should be counted as one character
          // const octalSequences = stringLiteral.match(/\\[0-7]{3}/g) || [];
          // stringLength -= octalSequences.length * 3; // Subtract 3 for each octal sequence since they were overcounted

          // Remove the surrounding quotes to process the content
          const stringLiteral = stringLiteralMatch[0].slice(1, -1);
          // const stringLiteral = '\\001\\001\\002\\002@A\\nBC\\001\\003\\004\\001\\377\\002\\001DO NOT FEED\\nTHE ELEPHANT'
          // Initialize the string length, starting from 0
          let stringLength = 0;

          // Counting octal sequences (\001, \002, etc.)
          const octalMatches = stringLiteral.match(/\\[0-7]{3}/g) || [];
          stringLength += octalMatches.length;
          console.log(stringLength);

          // Removing counted octal sequences to avoid double counting in the next step
          const stringWithoutOctals = stringLiteral.replace(/\\[0-7]{3}/g, "");
          stringLength += stringWithoutOctals.length;

          // Counting other escape sequences (\n, \\, etc.), after removing octal sequences
          const otherEscapes = stringWithoutOctals.match(/\\./g) || [];
          stringLength -= otherEscapes.length;

          // Add 1 for zero termination
          stringLength += 1;

          // console.log(stringLength); // Now should correctly reflect 3 for the octal sequences plus 1 for zero termination

          // const stringLiteral = stringLiteralMatch[0];
          // // Calculate the length, considering escape sequences and zero termination
          // let stringLength = stringLiteral.length - 2; // Subtract quotes
          // stringLength -= (stringLiteral.match(/\\./g) || []).length; // Subtract one for each escape sequence
          // stringLength += (stringLiteral.match(/\\[0-7]{3}/g) || []).length; // Add back for octal escapes (as they count as one)
          // stringLength += 1; // For zero termination

          console.log("STRING", { stringLiteral, stringLength });

          lookupTable[offset] = index + 1;
          offset += stringLength;
        }

        return;
      }

      // Handle VM instructions
      const instructionMatch = lineWithoutComments.match(/(VM_\w+)/);
      if (instructionMatch) {
        const instruction = instructionMatch[0];
        const instructionSize =
          vmOpSizes[instruction] !== undefined ? vmOpSizes[instruction] : 0;

        console.log({ instruction, instructionSize, offset });
        lookupTable[offset] = index + 1;
        offset += instructionSize;
        return;
      }
    });

    console.log("SOURCE MAP", { lookupTable });

    return lookupTable;
  }, [currentGBVMScript, vmOpSizes]);

  const currentScriptLineNum = useMemo(() => {
    return gbvmSourceMap[currentScriptOffset];
  }, [currentScriptOffset, gbvmSourceMap]);

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

  const onToggleCollapsed = useCallback(() => {
    dispatch(settingsActions.toggleDebuggerPaneCollapsed("script"));
  }, [dispatch]);

  return (
    <>
      <SplitPaneHeader
        onToggle={collapsible ? onToggleCollapsed : undefined}
        collapsed={isCollapsed}
        variant="secondary"
        buttons={
          !isCollapsed && (
            <>
              <Button
                size="small"
                variant={
                  viewScriptType === "editor" ? "underlined" : "transparent"
                }
                onClick={onSetScriptTypeEditor}
              >
                Editor
              </Button>
              /
              <Button
                size="small"
                variant={
                  viewScriptType === "gbvm" ? "underlined" : "transparent"
                }
                onClick={onSetScriptTypeGBVM}
              >
                GBVM
              </Button>
            </>
          )
        }
      >
        {l10n("FIELD_CURRENT_SCRIPT")}
      </SplitPaneHeader>
      {!isCollapsed && (
        <Content>
          {viewScriptType === "editor" && currentScriptEvents && scriptCtx ? (
            <ScriptEditorContext.Provider value={scriptCtx}>
              <ScriptEditor value={currentScript} />
            </ScriptEditorContext.Provider>
          ) : undefined}
          {viewScriptType === "gbvm" && currentGBVMScript ? (
            <CodeEditorWrapper>
              <CodeEditor
                value={currentGBVMScript}
                onChange={() => {}}
                currentLineNum={currentScriptLineNum}
              />
            </CodeEditorWrapper>
          ) : undefined}
        </Content>
      )}
    </>
  );
};

export default DebuggerScriptPane;
