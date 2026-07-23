import React, { useCallback, useEffect, useState } from "react";
import {
  actorPrefabSelectors,
  actorSelectors,
  customEventSelectors,
  sceneSelectors,
  scriptEventSelectors,
  triggerPrefabSelectors,
  triggerSelectors,
  variableSelectors,
} from "store/features/entities/entitiesSelectors";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { EditableText } from "ui/form/EditableText";
import {
  FormContainer,
  FormDivider,
  FormHeader,
} from "ui/form/layout/FormLayout";
import { MenuItem } from "ui/menu/Menu";
import entitiesActions from "store/features/entities/entitiesActions";
import editorActions from "store/features/editor/editorActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import { Sidebar, SidebarColumn } from "ui/sidebars/Sidebar";
import { FlatList } from "ui/lists/FlatList";
import { EntityListItem } from "ui/lists/EntityListItem";
import useDimensions from "react-cool-dimensions";
import styled from "styled-components";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { SymbolEditorWrapper } from "components/forms/symbols/SymbolEditorWrapper";
import { VariableReference } from "components/forms/ReferencesSelect";
import type { VariableUse, VariableUseResult } from "./VariableUses.worker";
import {
  globalVariableCode,
  globalVariableDefaultName,
  isGlobalVariableId,
} from "shared/lib/variables/variableNames";
import l10n, { getL10NData } from "shared/lib/lang/l10n";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { CodeIcon } from "ui/icons/Icons";

const worker = new Worker(new URL("./VariableUses.worker.ts", import.meta.url));

interface VariableInspectorProps {
  id: string;
}
interface UsesWrapperProps {
  $showSymbols: boolean;
}

const UsesWrapper = styled.div<UsesWrapperProps>`
  position: absolute;
  top: ${(props) => (props.$showSymbols ? `71px` : `38px`)};
  left: 0;
  bottom: 0;
  right: 0;
`;

const UseMessage = styled.div`
  padding: 5px 10px;
  font-size: 11px;
`;

export const VariableInspector = ({ id }: VariableInspectorProps) => {
  const [fetching, setFetching] = useState(true);
  const { observe, height } = useDimensions();
  const variable = useAppSelector((state) =>
    variableSelectors.selectById(state, id),
  );
  // Selecting a folder in the variables navigator sets the folder path as
  // the entity id — show a variable array inspector for it instead
  const isFolder = !isGlobalVariableId(id);
  const [folderNameEdit, setFolderNameEdit] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    setFolderNameEdit(undefined);
  }, [id]);
  const [variableUses, setVariableUses] = useState<VariableUse[]>([]);
  const scenes = useAppSelector((state) => sceneSelectors.selectAll(state));
  const actorsLookup = useAppSelector((state) =>
    actorSelectors.selectEntities(state),
  );
  const triggersLookup = useAppSelector((state) =>
    triggerSelectors.selectEntities(state),
  );
  const scriptEventsLookup = useAppSelector((state) =>
    scriptEventSelectors.selectEntities(state),
  );
  const customEventsLookup = useAppSelector((state) =>
    customEventSelectors.selectEntities(state),
  );
  const actorPrefabsLookup = useAppSelector(
    actorPrefabSelectors.selectEntities,
  );
  const triggerPrefabsLookup = useAppSelector(
    triggerPrefabSelectors.selectEntities,
  );
  const [showSymbols, setShowSymbols] = useState(false);

  const scriptEventDefs = useAppSelector((state) =>
    selectScriptEventDefs(state),
  );

  const dispatch = useAppDispatch();

  const onWorkerComplete = useCallback(
    (e: MessageEvent<VariableUseResult>) => {
      if (e.data.id === id) {
        setFetching(false);
        setVariableUses(e.data.uses);
      }
    },
    [id],
  );

  useEffect(() => {
    worker.addEventListener("message", onWorkerComplete);
    return () => {
      worker.removeEventListener("message", onWorkerComplete);
    };
  }, [onWorkerComplete]);

  useEffect(() => {
    setFetching(true);
    worker.postMessage({
      id,
      variableId: id,
      arrayPath: isFolder ? id : undefined,
      scenes,
      actorsLookup,
      triggersLookup,
      actorPrefabsLookup,
      triggerPrefabsLookup,
      scriptEventsLookup,
      scriptEventDefs,
      customEventsLookup,
      l10NData: getL10NData(),
    });
  }, [
    scenes,
    actorsLookup,
    triggersLookup,
    id,
    isFolder,
    scriptEventsLookup,
    scriptEventDefs,
    customEventsLookup,
    actorPrefabsLookup,
    triggerPrefabsLookup,
  ]);

  const onRename = (e: React.ChangeEvent<HTMLInputElement>) => {
    const editValue = e.currentTarget.value;
    dispatch(
      entitiesActions.renameVariable({
        variableId: id,
        name: editValue,
      }),
    );
  };

  const onRenameFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFolderNameEdit(e.currentTarget.value);
  };

  const onRenameFolderComplete = () => {
    if (folderNameEdit === undefined) {
      return;
    }
    const newPath = folderNameEdit.replace(/\\/g, "/").replace(/\/+$/, "").trim();
    setFolderNameEdit(undefined);
    if (!newPath || newPath === id || newPath.startsWith(`${id}/`)) {
      return;
    }
    dispatch(
      entitiesActions.renameVariablesFolder({
        fromPath: id,
        toPath: newPath,
        scriptEventDefs,
      }),
    );
    dispatch(editorActions.selectVariable({ variableId: newPath }));
  };

  const onRenameFolderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onRenameFolderComplete();
    } else if (e.key === "Escape") {
      setFolderNameEdit(undefined);
    }
  };

  const onCopyVar = () => {
    dispatch(clipboardActions.copyText(`$${globalVariableCode(id)}$`));
  };

  const onCopyChar = () => {
    dispatch(clipboardActions.copyText(`#${globalVariableCode(id)}#`));
  };

  const setSelectedId = (id: string, item: VariableUse) => {
    if (item.type === "scene") {
      dispatch(editorActions.selectScene({ sceneId: id }));
      dispatch(editorActions.setFocusSceneId(item.sceneId));
    } else if (item.type === "actor") {
      dispatch(
        editorActions.selectActor({ actorId: id, sceneId: item.sceneId }),
      );
      dispatch(editorActions.setFocusSceneId(item.sceneId));
    } else if (item.type === "trigger") {
      dispatch(
        editorActions.selectTrigger({ triggerId: id, sceneId: item.sceneId }),
      );
      dispatch(editorActions.setFocusSceneId(item.sceneId));
    } else if (item.type === "custom") {
      dispatch(editorActions.selectCustomEvent({ customEventId: id }));
    }
  };

  const selectSidebar = () => {
    dispatch(editorActions.selectSidebar());
  };

  return (
    <Sidebar onClick={selectSidebar}>
      <FormHeader>
        {isFolder ? (
          <EditableText
            name="name"
            placeholder={id}
            value={folderNameEdit ?? id}
            onChange={onRenameFolder}
            onBlur={onRenameFolderComplete}
            onKeyDown={onRenameFolderKeyDown}
          />
        ) : (
          <EditableText
            name="name"
            placeholder={globalVariableDefaultName(id)}
            value={variable?.name || ""}
            onChange={onRename}
          />
        )}
        {!isFolder && (
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
        )}
      </FormHeader>

      <SidebarColumn>
        <FormContainer>
          {showSymbols && !isFolder && (
            <>
              <SymbolEditorWrapper>
                <VariableReference id={id} />
              </SymbolEditorWrapper>
              <FormDivider />
            </>
          )}
        </FormContainer>
        <UsesWrapper ref={observe} $showSymbols={showSymbols && !isFolder}>
          <SplitPaneHeader collapsed={false}>
            {isFolder
              ? l10n("SIDEBAR_ARRAY_USES")
              : l10n("SIDEBAR_VARIABLE_USES")}
          </SplitPaneHeader>
          {fetching ? (
            <UseMessage>...</UseMessage>
          ) : (
            <>
              {variableUses.length > 0 ? (
                <FlatList
                  items={variableUses}
                  height={height - 30}
                  setSelectedId={setSelectedId}
                  children={({ item }) => {
                    switch (item.type) {
                      case "scene":
                        return <EntityListItem item={item} type={item.type} />;
                      case "custom":
                        return (
                          <EntityListItem
                            item={item}
                            type={item.type}
                            icon={<CodeIcon />}
                          />
                        );
                      default:
                        return (
                          <EntityListItem
                            item={item}
                            type={item.type}
                            nestLevel={1}
                          />
                        );
                    }
                  }}
                />
              ) : (
                <UseMessage>
                  {isFolder
                    ? l10n("FIELD_ARRAY_NOT_USED")
                    : l10n("FIELD_VARIABLE_NOT_USED")}
                </UseMessage>
              )}
            </>
          )}
        </UsesWrapper>
      </SidebarColumn>
    </Sidebar>
  );
};
