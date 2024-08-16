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
import { actorName } from "shared/lib/entities/entitiesHelpers";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import CachedScroll from "ui/util/CachedScroll";
import { ActorPrefabEditorProperties } from "./prefab/ActorPrefabEditorProperties";
import { ActorPrefabEditorScripts } from "./prefab/ActorPrefabEditorScripts";
import { FlexGrow } from "ui/spacing/Spacing";
import {
  SplitPaneHeader,
  Wrapper as SplitPaneHeaderWrapper,
} from "ui/splitpane/SplitPaneHeader";
import styled from "styled-components";
import { ActorPrefabUsesList } from "./prefab/ActorPrefabUsesList";

interface ActorPrefabEditorProps {
  id: string;
}

const FlexWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const UsesCollapsedWrapper = styled.div`
  position: sticky;
  bottom: 0;
  left: 0;
  right: 17px;
  border-top: 1px solid ${(props) => props.theme.colors.input.border};

  ${SplitPaneHeaderWrapper} {
    border-bottom: 0;
  }
`;

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

  const showUses = useAppSelector((state) => state.editor.showScriptUses);

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

  const setShowUses = useCallback(
    (value: boolean) => {
      dispatch(editorActions.setShowScriptUses(value));
    },
    [dispatch]
  );

  if (!prefab) {
    return <WorldEditor />;
  }

  const showNotes = prefab.notes || notesOpen;

  const scrollKey = `${prefab.id}_${lastScriptTab}`;

  return (
    <Sidebar onClick={selectSidebar}>
      <CachedScroll key={scrollKey} cacheKey={scrollKey}>
        <FlexWrapper>
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
                  <MenuItem onClick={onCopy}>
                    {l10n("MENU_COPY_ACTOR")}
                  </MenuItem>
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

          {showUses ? (
            <ActorPrefabUsesList id={id} onClose={() => setShowUses(false)} />
          ) : (
            <>
              {!lockScriptEditor && (
                <SidebarColumns>
                  {showNotes && (
                    <SidebarColumn>
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
            </>
          )}

          {!showUses && (
            <>
              <FlexGrow />
              <UsesCollapsedWrapper>
                <SplitPaneHeader
                  collapsed={true}
                  onToggle={() => setShowUses(true)}
                >
                  {l10n("SIDEBAR_PREFAB_USES")}
                </SplitPaneHeader>
              </UsesCollapsedWrapper>
            </>
          )}
        </FlexWrapper>
      </CachedScroll>
    </Sidebar>
  );
};
