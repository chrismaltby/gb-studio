import React, { FC, RefObject, useCallback, useEffect, useState } from "react";
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
import { Sidebar, SidebarColumn } from "ui/sidebars/Sidebar";
import { FlatList } from "ui/lists/FlatList";
import { EntityListItem } from "ui/lists/EntityListItem";
import useDimensions from "react-cool-dimensions";
import styled from "styled-components";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { SymbolEditorWrapper } from "components/forms/symbols/SymbolEditorWrapper";
import { VariableReference } from "components/forms/ReferencesSelect";
import VariableUsesWorker, {
  VariableUse,
  VariableUseResult,
} from "./VariableUses.worker";
import {
  globalVariableCode,
  globalVariableDefaultName,
} from "shared/lib/variables/variableNames";
import l10n, { getL10NData } from "shared/lib/lang/l10n";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";
import { useAppDispatch, useAppSelector } from "store/hooks";

const worker = new VariableUsesWorker();

interface VariableEditorProps {
  id: string;
}
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
  const [fetching, setFetching] = useState(true);
  const { ref, height } = useDimensions();
  const variable = useAppSelector((state) =>
    variableSelectors.selectById(state, id)
  );
  const [variableUses, setVariableUses] = useState<VariableUse[]>([]);
  const scenes = useAppSelector((state) => sceneSelectors.selectAll(state));
  const actorsLookup = useAppSelector((state) =>
    actorSelectors.selectEntities(state)
  );
  const triggersLookup = useAppSelector((state) =>
    triggerSelectors.selectEntities(state)
  );
  const scriptEventsLookup = useAppSelector((state) =>
    scriptEventSelectors.selectEntities(state)
  );
  const [showSymbols, setShowSymbols] = useState(false);

  const scriptEventDefs = useAppSelector((state) =>
    selectScriptEventDefs(state)
  );

  const dispatch = useAppDispatch();

  const onWorkerComplete = useCallback(
    (e: MessageEvent<VariableUseResult>) => {
      if (e.data.id === id) {
        setFetching(false);
        setVariableUses(e.data.uses);
      }
    },
    [id]
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
      scenes,
      actorsLookup,
      triggersLookup,
      scriptEventsLookup,
      scriptEventDefs,
      l10NData: getL10NData(),
    });
  }, [
    scenes,
    actorsLookup,
    triggersLookup,
    id,
    scriptEventsLookup,
    scriptEventDefs,
  ]);

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
    dispatch(editorActions.editSearchTerm(""));
    dispatch(editorActions.editSearchTerm(item.sceneId));
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
          {fetching ? (
            <UseMessage>...</UseMessage>
          ) : (
            <>
              {variableUses.length > 0 ? (
                <FlatList
                  items={variableUses}
                  height={height - 30}
                  setSelectedId={setSelectedId}
                  children={({ item }) =>
                    item.type === "scene" ? (
                      <EntityListItem item={item} type={item.type} />
                    ) : (
                      <EntityListItem
                        item={item}
                        type={item.type}
                        nestLevel={1}
                      />
                    )
                  }
                />
              ) : (
                <UseMessage>{l10n("FIELD_VARIABLE_NOT_USED")}</UseMessage>
              )}
            </>
          )}
        </UsesWrapper>
      </SidebarColumn>
    </Sidebar>
  );
};
