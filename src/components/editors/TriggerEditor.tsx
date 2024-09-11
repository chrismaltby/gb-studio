import React, { useCallback, useState } from "react";
import { castEventToInt } from "renderer/lib/helpers/castEventValue";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import { WorldEditor } from "./WorldEditor";
import {
  triggerSelectors,
  sceneSelectors,
  triggerPrefabSelectors,
} from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { SidebarColumn, Sidebar, SidebarColumns } from "ui/sidebars/Sidebar";
import {
  FormContainer,
  FormDivider,
  FormHeader,
  FormRow,
} from "ui/form/layout/FormLayout";
import { EditableText } from "ui/form/EditableText";
import { TriggerNormalized } from "shared/lib/entities/entitiesTypes";
import { CoordinateInput } from "ui/form/CoordinateInput";
import { NoteField } from "ui/form/NoteField";
import { ClipboardTypeTriggers } from "store/features/clipboard/clipboardTypes";
import { TriggerSymbolsEditor } from "components/forms/symbols/TriggerSymbolsEditor";
import { SymbolEditorWrapper } from "components/forms/symbols/SymbolEditorWrapper";
import { triggerName } from "shared/lib/entities/entitiesHelpers";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import CachedScroll from "ui/util/CachedScroll";
import { TriggerPrefabEditorScripts } from "./prefab/TriggerPrefabEditorScripts";
import { TriggerEditorScripts } from "./trigger/TriggerEditorScripts";
import { PrefabHeader } from "ui/form/headers/PrefabHeader";
import { CaretRightIcon } from "ui/icons/Icons";
import { FlexGrow } from "ui/spacing/Spacing";
import { TriggerPrefabSelectButton } from "components/forms/TriggerPrefabSelectButton";

interface TriggerEditorProps {
  id: string;
  sceneId: string;
}

export const TriggerEditor = ({ id, sceneId }: TriggerEditorProps) => {
  const trigger = useAppSelector((state) =>
    triggerSelectors.selectById(state, id)
  );
  const prefab = useAppSelector((state) =>
    triggerPrefabSelectors.selectById(state, trigger?.prefabId ?? "")
  );
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, sceneId)
  );
  const clipboardFormat = useAppSelector(
    (state) => state.clipboard.data?.format
  );
  const [notesOpen, setNotesOpen] = useState<boolean>(!!trigger?.notes);

  const lastScriptTab = useAppSelector(
    (state) => state.editor.lastScriptTabTrigger
  );

  const triggerIndex = scene?.triggers.indexOf(id) || 0;
  const lockScriptEditor = useAppSelector(
    (state) => state.editor.lockScriptEditor
  );

  const [showSymbols, setShowSymbols] = useState(false);

  const [showPrefab, setShowPrefab] = useState(false);

  const dispatch = useAppDispatch();

  const onChangeTriggerProp = useCallback(
    <K extends keyof TriggerNormalized>(
      key: K,
      value: TriggerNormalized[K]
    ) => {
      dispatch(
        entitiesActions.editTrigger({
          triggerId: id,
          changes: {
            [key]: value,
          },
        })
      );
    },
    [dispatch, id]
  );

  const onChangeName = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeTriggerProp("name", e.currentTarget.value),
    [onChangeTriggerProp]
  );

  const onChangeNotes = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onChangeTriggerProp("notes", e.currentTarget.value),
    [onChangeTriggerProp]
  );

  const onChangeX = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeTriggerProp("x", castEventToInt(e, 0)),
    [onChangeTriggerProp]
  );

  const onChangeY = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeTriggerProp("y", castEventToInt(e, 0)),
    [onChangeTriggerProp]
  );

  const onChangeWidth = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeTriggerProp("width", castEventToInt(e, 1)),
    [onChangeTriggerProp]
  );

  const onChangeHeight = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeTriggerProp("height", castEventToInt(e, 1)),
    [onChangeTriggerProp]
  );

  const onChangePrefabId = useCallback(
    (e: string) => onChangeTriggerProp("prefabId", e),
    [onChangeTriggerProp]
  );

  const selectSidebar = () => {
    dispatch(editorActions.selectSidebar());
  };

  const onCopy = () => {
    if (trigger) {
      dispatch(
        clipboardActions.copyTriggers({
          triggerIds: [id],
        })
      );
    }
  };

  const onPaste = () => {
    dispatch(clipboardActions.pasteClipboardEntity());
  };

  const convertToPrefab = () => {
    if (trigger) {
      dispatch(
        entitiesActions.convertTriggerToPrefab({ triggerId: trigger.id })
      );
    }
  };

  const onRemove = () => {
    if (trigger) {
      dispatch(
        entitiesActions.removeTrigger({ triggerId: trigger.id, sceneId })
      );
    }
  };

  const onFetchClipboard = useCallback(() => {
    dispatch(clipboardActions.fetchClipboard());
  }, [dispatch]);

  const onAddNotes = () => {
    setNotesOpen(true);
  };

  const showNotes = trigger?.notes || notesOpen;

  if (!scene || !trigger) {
    return <WorldEditor />;
  }

  const scrollKey = `${trigger.id}_${lastScriptTab}`;

  const numOverrides = Object.keys(trigger.prefabScriptOverrides)?.length;

  return (
    <Sidebar onClick={selectSidebar}>
      <CachedScroll key={scrollKey} cacheKey={scrollKey}>
        {!lockScriptEditor && (
          <FormContainer>
            <FormHeader>
              <EditableText
                name="name"
                placeholder={triggerName(trigger, triggerIndex)}
                value={trigger.name || ""}
                onChange={onChangeName}
              />
              <DropdownButton
                size="small"
                variant="transparent"
                menuDirection="right"
                onMouseDown={onFetchClipboard}
              >
                {!showNotes && (
                  <MenuItem onClick={onAddNotes}>
                    {l10n("FIELD_ADD_NOTES")}
                  </MenuItem>
                )}
                {!showSymbols && (
                  <MenuItem onClick={() => setShowSymbols(true)}>
                    {l10n("FIELD_VIEW_GBVM_SYMBOLS")}
                  </MenuItem>
                )}
                {!showPrefab && (
                  <MenuItem onClick={() => setShowPrefab(true)}>
                    {l10n("FIELD_LINK_TO_PREFAB")}
                  </MenuItem>
                )}
                {!trigger.prefabId && (
                  <MenuItem onClick={convertToPrefab}>
                    {l10n("FIELD_CONVERT_TO_PREFAB")}
                  </MenuItem>
                )}
                <MenuItem onClick={onCopy}>
                  {l10n("MENU_COPY_TRIGGER")}
                </MenuItem>
                {clipboardFormat === ClipboardTypeTriggers && (
                  <MenuItem onClick={onPaste}>
                    {l10n("MENU_PASTE_TRIGGER")}
                  </MenuItem>
                )}
                <MenuDivider />
                <MenuItem onClick={onRemove}>
                  {l10n("MENU_DELETE_TRIGGER")}
                </MenuItem>
              </DropdownButton>
            </FormHeader>
          </FormContainer>
        )}

        {!lockScriptEditor && (
          <SidebarColumns>
            {(showSymbols || showNotes) && (
              <SidebarColumn>
                {showSymbols && (
                  <>
                    <SymbolEditorWrapper>
                      <TriggerSymbolsEditor id={trigger.id} />
                    </SymbolEditorWrapper>
                    <FormDivider />
                  </>
                )}
                {showNotes && (
                  <FormRow>
                    <NoteField
                      value={trigger.notes || ""}
                      onChange={onChangeNotes}
                    />
                  </FormRow>
                )}
              </SidebarColumn>
            )}

            <SidebarColumn>
              <FormRow>
                <CoordinateInput
                  name="x"
                  coordinate="x"
                  value={trigger.x}
                  placeholder="0"
                  min={0}
                  max={scene.width - trigger.width}
                  onChange={onChangeX}
                />
                <CoordinateInput
                  name="y"
                  coordinate="y"
                  value={trigger.y}
                  placeholder="0"
                  min={0}
                  max={scene.height - trigger.height}
                  onChange={onChangeY}
                />
              </FormRow>

              <FormRow>
                <CoordinateInput
                  name="width"
                  coordinate="w"
                  value={trigger.width}
                  placeholder="1"
                  min={1}
                  max={scene.width - trigger.x}
                  onChange={onChangeWidth}
                />
                <CoordinateInput
                  name="height"
                  coordinate="h"
                  value={trigger.height}
                  placeholder="1"
                  min={1}
                  max={scene.height - trigger.y}
                  onChange={onChangeHeight}
                />
              </FormRow>
            </SidebarColumn>
          </SidebarColumns>
        )}

        {(prefab || showPrefab) && (
          <PrefabHeader prefabSet={prefab !== undefined}>
            {l10n("SIDEBAR_PREFABS")}
            <CaretRightIcon />
            <TriggerPrefabSelectButton
              name={"prefabId"}
              value={trigger.prefabId}
              onChange={onChangePrefabId}
            />
            {numOverrides > 0 ? (
              <span style={{ whiteSpace: "nowrap" }}>
                (+
                {l10n(
                  numOverrides === 1 ? "FIELD_N_CHANGE" : "FIELD_N_CHANGES",
                  { n: numOverrides }
                )}
                )
              </span>
            ) : (
              ""
            )}
            <FlexGrow />
            {prefab && (
              <DropdownButton
                size="small"
                variant="transparent"
                menuDirection="right"
                onMouseDown={onFetchClipboard}
              >
                <MenuItem
                  onClick={() => {
                    dispatch(
                      editorActions.selectTriggerPrefab({
                        triggerPrefabId: prefab.id,
                      })
                    );
                    dispatch(editorActions.setShowScriptUses(false));
                  }}
                >
                  {l10n("FIELD_EDIT_PREFAB")}
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    dispatch(
                      editorActions.selectTriggerPrefab({
                        triggerPrefabId: prefab.id,
                      })
                    );
                    dispatch(editorActions.setShowScriptUses(true));
                  }}
                >
                  {l10n("FIELD_VIEW_PREFAB_USES")}
                </MenuItem>
                {numOverrides > 0 && <MenuDivider />}
                {numOverrides > 0 && (
                  <MenuItem
                    onClick={() => {
                      dispatch(
                        entitiesActions.applyTriggerPrefabScriptEventOverrides({
                          triggerId: trigger.id,
                        })
                      );
                    }}
                  >
                    {l10n("FIELD_APPLY_CHANGES")}
                  </MenuItem>
                )}
                {numOverrides > 0 && (
                  <MenuItem
                    onClick={() => {
                      dispatch(
                        entitiesActions.revertTriggerPrefabScriptEventOverrides(
                          {
                            triggerId: trigger.id,
                          }
                        )
                      );
                    }}
                  >
                    {l10n("FIELD_REVERT_CHANGES")}
                  </MenuItem>
                )}
                <MenuDivider />
                <MenuItem
                  onClick={() => {
                    dispatch(
                      entitiesActions.unpackTriggerPrefab({
                        triggerId: trigger.id,
                      })
                    );
                  }}
                >
                  {l10n("FIELD_UNPACK_PREFAB")}
                </MenuItem>
              </DropdownButton>
            )}
          </PrefabHeader>
        )}

        {prefab ? (
          <TriggerPrefabEditorScripts
            prefab={prefab}
            trigger={trigger}
            sceneId={sceneId}
            isInstance
          />
        ) : (
          <TriggerEditorScripts trigger={trigger} sceneId={sceneId} />
        )}
      </CachedScroll>
    </Sidebar>
  );
};
