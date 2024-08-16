import React, { FC, useCallback, useState } from "react";
import { actorPrefabSelectors } from "store/features/entities/entitiesState";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { EditableText } from "ui/form/EditableText";
import { FormContainer, FormHeader, FormRow } from "ui/form/FormLayout";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import entitiesActions from "store/features/entities/entitiesActions";
import editorActions from "store/features/editor/editorActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import { ActorPrefabNormalized } from "shared/lib/entities/entitiesTypes";
import { Sidebar, SidebarColumn, SidebarColumns } from "ui/sidebars/Sidebar";
import { WorldEditor } from "./WorldEditor";
import { NoteField } from "ui/form/NoteField";
import { ClipboardTypeActors } from "store/features/clipboard/clipboardTypes";
import { ActorSymbolsEditor } from "components/forms/symbols/ActorSymbolsEditor";
import { SpriteSymbolsEditor } from "components/forms/symbols/SpriteSymbolsEditor";
import { SymbolEditorWrapper } from "components/forms/symbols/SymbolEditorWrapper";
import { actorName } from "shared/lib/entities/entitiesHelpers";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import CachedScroll from "ui/util/CachedScroll";
import { ActorPrefabEditorProperties } from "./prefab/ActorPrefabEditorProperties";
import { ActorPrefabEditorScripts } from "./prefab/ActorPrefabEditorScripts";

interface ActorPrefabEditorProps {
  id: string;
}

export const ActorPrefabEditor: FC<ActorPrefabEditorProps> = ({ id }) => {
  const actorPrefabIds = useAppSelector(actorPrefabSelectors.selectIds);
  const prefab = useAppSelector((state) =>
    actorPrefabSelectors.selectById(state, id)
  );

  const index = React.useMemo(
    () => actorPrefabIds.indexOf(id),
    [actorPrefabIds, id]
  );

  const [notesOpen, setNotesOpen] = useState<boolean>(!!prefab?.notes);
  const clipboardFormat = useAppSelector(
    (state) => state.clipboard.data?.format
  );
  const lockScriptEditor = useAppSelector(
    (state) => state.editor.lockScriptEditor
  );

  const lastScriptTab = useAppSelector((state) => state.editor.lastScriptTab);

  const [showSymbols, setShowSymbols] = useState(false);

  const dispatch = useAppDispatch();

  const onChangeActorPrefabProp = useCallback(
    <K extends keyof ActorPrefabNormalized>(
      key: K,
      value: ActorPrefabNormalized[K]
    ) => {
      dispatch(
        entitiesActions.editActorPrefab({
          actorPrefabId: id,
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
      onChangeActorPrefabProp("name", e.currentTarget.value),
    [onChangeActorPrefabProp]
  );

  const onChangeNotes = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeActorPrefabProp("notes", e.currentTarget.value),
    [onChangeActorPrefabProp]
  );

  const selectSidebar = () => {
    dispatch(editorActions.selectSidebar());
  };

  const onCopy = () => {
    if (prefab) {
      dispatch(clipboardActions.copyActors({ actorIds: [prefab.id] }));
    }
  };

  const onPaste = () => {
    dispatch(clipboardActions.pasteClipboardEntity());
  };

  const onRemove = () => {
    // if (actor) {
    //   dispatch(entitiesActions.removeActor({ actorId: actor.id, sceneId }));
    // }
  };

  const onFetchClipboard = useCallback(() => {
    dispatch(clipboardActions.fetchClipboard());
  }, [dispatch]);

  const onAddNotes = () => {
    setNotesOpen(true);
  };

  if (!prefab) {
    return <WorldEditor />;
  }

  const showNotes = prefab.notes || notesOpen;

  const scrollKey = `${prefab.id}_${lastScriptTab}`;

  return (
    <Sidebar onClick={selectSidebar}>
      <CachedScroll key={scrollKey} cacheKey={scrollKey}>
        {!lockScriptEditor && (
          <FormContainer>
            <FormHeader>
              <EditableText
                name="name"
                placeholder={actorName(prefab, index)}
                value={prefab.name || ""}
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
                <MenuItem onClick={onCopy}>{l10n("MENU_COPY_ACTOR")}</MenuItem>
                {clipboardFormat === ClipboardTypeActors && (
                  <MenuItem onClick={onPaste}>
                    {l10n("MENU_PASTE_ACTOR")}
                  </MenuItem>
                )}
                <MenuDivider />
                <MenuItem onClick={onRemove}>
                  {l10n("MENU_DELETE_ACTOR")}
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
                  <SymbolEditorWrapper>
                    <ActorSymbolsEditor id={prefab.id} />
                    <SpriteSymbolsEditor id={prefab.spriteSheetId} />
                  </SymbolEditorWrapper>
                )}
                {showNotes && (
                  <FormContainer>
                    <FormRow>
                      <NoteField
                        value={prefab.notes || ""}
                        onChange={onChangeNotes}
                      />
                    </FormRow>
                  </FormContainer>
                )}
              </SidebarColumn>
            )}
            <ActorPrefabEditorProperties prefab={prefab} />
          </SidebarColumns>
        )}
        <ActorPrefabEditorScripts prefab={prefab} />
      </CachedScroll>
    </Sidebar>
  );
};
