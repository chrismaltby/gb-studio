import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  actorPrefabSelectors,
  actorSelectors,
  customEventSelectors,
  sceneSelectors,
  scriptEventSelectors,
  selectGlobalVariablesAll,
  triggerPrefabSelectors,
  triggerSelectors,
  variableSelectors,
} from "store/features/entities/entitiesSelectors";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { EditableText } from "ui/form/EditableText";
import {
  FormContainer,
  FormDivider,
  FormField,
  FormHeader,
  FormRow,
} from "ui/form/layout/FormLayout";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
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
import type { VariableUse } from "renderer/lib/workers/VariableUses.worker";
import { globalVariableCode } from "shared/lib/variables/variableNames";
import l10n, { getL10NData } from "shared/lib/lang/l10n";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { CodeIcon } from "ui/icons/Icons";
import { findSelectOption, Option, Select } from "ui/form/Select";
import { SingleValue } from "react-select";
import { NumberInput } from "ui/form/NumberInput";
import { VariableType } from "shared/lib/resources/types";
import { findVariableUses } from "renderer/lib/workers/variableUses";
import { isWorkerRequestAbortError } from "renderer/lib/workers/createWorkerClient";
import { defaultLocalisedVariableName } from "shared/lib/entities/entitiesHelpers";
import { WorldInspector } from "components/world/inspector/WorldInspector";

interface VariableInspectorProps {
  id: string;
}

const VariableSidebar = styled(Sidebar)`
  display: flex;
  flex-direction: column;

  & > :first-child {
    flex-shrink: 0;
  }
`;

const VariableSidebarColumn = styled(SidebarColumn)`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;

  & > :first-child {
    flex-shrink: 0;
  }
`;

const UsesWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
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
  const [name, setName] = useState(variable?.name ?? "");
  const pendingRenameRef = useRef<
    | {
        variableId: string;
        name: string;
      }
    | undefined
  >(undefined);
  const variableIndex = useAppSelector((state) =>
    selectGlobalVariablesAll(state).findIndex((variable) => variable.id === id),
  );
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

  const commitPendingRename = useCallback(
    (variableId: string) => {
      const pendingRename = pendingRenameRef.current;
      if (!pendingRename || pendingRename.variableId !== variableId) {
        return;
      }

      pendingRenameRef.current = undefined;
      dispatch(
        entitiesActions.renameVariable({
          variableId,
          name: pendingRename.name,
        }),
      );
    },
    [dispatch],
  );

  useEffect(() => {
    return () => commitPendingRename(id);
  }, [commitPendingRename, id]);

  useEffect(() => {
    if (variable) {
      setName(variable.name);
    }
  }, [variable]);

  const variableType = variable?.type ?? "number";
  const variableTypeOptions: Option[] = [
    { value: "number", label: l10n("FIELD_NUMBER") },
    { value: "array", label: l10n("FIELD_ARRAY") },
  ];

  useEffect(() => {
    const abortController = new AbortController();
    const loadUses = async () => {
      setFetching(true);
      try {
        const uses = await findVariableUses(
          {
            variableId: id,
            scenes,
            actorsLookup,
            triggersLookup,
            actorPrefabsLookup,
            triggerPrefabsLookup,
            scriptEventsLookup,
            scriptEventDefs,
            customEventsLookup,
            l10NData: getL10NData(),
          },
          { signal: abortController.signal },
        );
        setVariableUses(uses);
        setFetching(false);
      } catch (error) {
        if (!isWorkerRequestAbortError(error)) {
          console.error(error);
          setFetching(false);
        }
      }
    };
    void loadUses();
    return () => abortController.abort();
  }, [
    scenes,
    actorsLookup,
    triggersLookup,
    id,
    scriptEventsLookup,
    scriptEventDefs,
    customEventsLookup,
    actorPrefabsLookup,
    triggerPrefabsLookup,
  ]);

  const onRename = (e: React.ChangeEvent<HTMLInputElement>) => {
    const editValue = e.currentTarget.value;
    setName(editValue);
    pendingRenameRef.current = {
      variableId: id,
      name: editValue,
    };
  };

  const onRenameFinished = () => {
    commitPendingRename(id);
  };

  const onCopyVar = () => {
    dispatch(clipboardActions.copyText(`$${globalVariableCode(id)}$`));
  };

  const onCopyChar = () => {
    dispatch(clipboardActions.copyText(`#${globalVariableCode(id)}#`));
  };

  const onChangeVariableType = (newValue: SingleValue<Option>): void => {
    if (newValue) {
      dispatch(
        entitiesActions.setVariableType({
          variableId: id,
          type: newValue.value as VariableType,
        }),
      );
    }
  };

  const onChangeVariableLength = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    dispatch(
      entitiesActions.setVariableLength({
        variableId: id,
        length: Number(e.currentTarget.value),
      }),
    );
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

  const onRemove = useCallback(() => {
    if (!variable) {
      return;
    }
    dispatch(entitiesActions.confirmRemoveVariable(variable.id));
  }, [dispatch, variable]);

  if (!variable) {
    return <WorldInspector />;
  }

  return (
    <VariableSidebar onClick={selectSidebar}>
      <FormHeader>
        <EditableText
          name="name"
          placeholder={defaultLocalisedVariableName(variableIndex)}
          value={name}
          onChange={onRename}
          onBlur={onRenameFinished}
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
          <MenuDivider />
          <MenuItem onClick={onRemove}>{l10n("MENU_DELETE_VARIABLE")}</MenuItem>
        </DropdownButton>
      </FormHeader>

      <VariableSidebarColumn>
        <FormContainer>
          {showSymbols && (
            <>
              <SymbolEditorWrapper>
                <VariableReference id={id} />
              </SymbolEditorWrapper>
              <FormDivider />
            </>
          )}
          <FormRow>
            <FormField name="variableType" label={l10n("FIELD_TYPE")}>
              <Select
                name="variableType"
                value={findSelectOption(variableTypeOptions, variableType)}
                options={variableTypeOptions}
                onChange={onChangeVariableType}
              />
            </FormField>
            {variableType === "array" && (
              <FormField name="variableLength" label={l10n("FIELD_LENGTH")}>
                <NumberInput
                  id="variableLength"
                  value={variable.type === "array" ? variable.length : 1}
                  min={1}
                  step={1}
                  onChange={onChangeVariableLength}
                />
              </FormField>
            )}
          </FormRow>
        </FormContainer>
        <UsesWrapper ref={observe}>
          <SplitPaneHeader collapsed={false} borderTop>
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
                <UseMessage>{l10n("FIELD_VARIABLE_NOT_USED")}</UseMessage>
              )}
            </>
          )}
        </UsesWrapper>
      </VariableSidebarColumn>
    </VariableSidebar>
  );
};
