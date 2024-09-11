import React, { FC, useCallback, useState } from "react";
import {
  actorPrefabSelectors,
  actorSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesState";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { EditableText } from "ui/form/EditableText";
import {
  FormContainer,
  FormField,
  FormHeader,
  FormRow,
} from "ui/form/layout/FormLayout";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import entitiesActions from "store/features/entities/entitiesActions";
import editorActions from "store/features/editor/editorActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import {
  ActorDirection,
  ActorNormalized,
} from "shared/lib/entities/entitiesTypes";
import { Sidebar, SidebarColumn, SidebarColumns } from "ui/sidebars/Sidebar";
import { CoordinateInput } from "ui/form/CoordinateInput";
import { CaretRightIcon, CheckIcon, PinIcon } from "ui/icons/Icons";
import DirectionPicker from "components/forms/DirectionPicker";
import { WorldEditor } from "./WorldEditor";
import { NoteField } from "ui/form/NoteField";
import { ClipboardTypeActors } from "store/features/clipboard/clipboardTypes";
import { ActorSymbolsEditor } from "components/forms/symbols/ActorSymbolsEditor";
import { SpriteSymbolsEditor } from "components/forms/symbols/SpriteSymbolsEditor";
import { SymbolEditorWrapper } from "components/forms/symbols/SymbolEditorWrapper";
import { actorName } from "shared/lib/entities/entitiesHelpers";
import l10n from "shared/lib/lang/l10n";
import { KeysMatching } from "shared/types";
import { castEventToInt } from "renderer/lib/helpers/castEventValue";
import { useAppDispatch, useAppSelector } from "store/hooks";
import CachedScroll from "ui/util/CachedScroll";
import { ActorPrefabEditorScripts } from "components/editors/prefab/ActorPrefabEditorScripts";
import { ActorPrefabEditorProperties } from "components/editors/prefab/ActorPrefabEditorProperties";
import { ActorEditorScripts } from "./actor/ActorEditorScripts";
import { ActorEditorProperties } from "./actor/ActorEditorProperties";
import { FlexGrow } from "ui/spacing/Spacing";
import { ActorPrefabSelectButton } from "components/forms/ActorPrefabSelectButton";
import { PrefabHeader } from "ui/form/headers/PrefabHeader";

interface ActorEditorProps {
  id: string;
  sceneId: string;
}

export const ActorEditor: FC<ActorEditorProps> = ({ id, sceneId }) => {
  const actor = useAppSelector((state) => actorSelectors.selectById(state, id));
  const prefab = useAppSelector((state) =>
    actorPrefabSelectors.selectById(state, actor?.prefabId ?? "")
  );

  const [notesOpen, setNotesOpen] = useState<boolean>(!!actor?.notes);
  const clipboardFormat = useAppSelector(
    (state) => state.clipboard.data?.format
  );
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, sceneId)
  );
  const lockScriptEditor = useAppSelector(
    (state) => state.editor.lockScriptEditor
  );

  const actorIndex = scene?.actors.indexOf(id) || 0;

  const lastScriptTab = useAppSelector((state) => state.editor.lastScriptTab);

  const [showSymbols, setShowSymbols] = useState(false);

  const [showPrefab, setShowPrefab] = useState(false);

  const dispatch = useAppDispatch();

  const onChangeActorProp = useCallback(
    <K extends keyof ActorNormalized>(key: K, value: ActorNormalized[K]) => {
      dispatch(
        entitiesActions.editActor({
          actorId: id,
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
      onChangeActorProp("name", e.currentTarget.value),
    [onChangeActorProp]
  );

  const onChangeNotes = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onChangeActorProp("notes", e.currentTarget.value),
    [onChangeActorProp]
  );

  const onChangeX = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeActorProp("x", castEventToInt(e, 0)),
    [onChangeActorProp]
  );

  const onChangeY = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeActorProp("y", castEventToInt(e, 0)),
    [onChangeActorProp]
  );

  const onChangeDirection = useCallback(
    (e: ActorDirection) => onChangeActorProp("direction", e),
    [onChangeActorProp]
  );

  const onChangePrefabId = useCallback(
    (e: string) => {
      onChangeActorProp("prefabId", e);
    },
    [onChangeActorProp]
  );

  const onToggleField = (key: KeysMatching<ActorNormalized, boolean>) => () => {
    const currentValue = !!actor?.[key];
    dispatch(
      entitiesActions.editActor({
        actorId: id,
        changes: {
          [key]: !currentValue,
        },
      })
    );
  };

  const selectSidebar = () => {
    dispatch(editorActions.selectSidebar());
  };

  const onCopy = () => {
    if (actor) {
      dispatch(clipboardActions.copyActors({ actorIds: [actor.id] }));
    }
  };

  const onPaste = () => {
    dispatch(clipboardActions.pasteClipboardEntity());
  };

  const convertToPrefab = () => {
    if (actor) {
      dispatch(entitiesActions.convertActorToPrefab({ actorId: actor.id }));
    }
  };

  const onRemove = () => {
    if (actor) {
      dispatch(entitiesActions.removeActor({ actorId: actor.id, sceneId }));
    }
  };

  const onFetchClipboard = useCallback(() => {
    dispatch(clipboardActions.fetchClipboard());
  }, [dispatch]);

  const onAddNotes = () => {
    setNotesOpen(true);
  };

  if (!scene || !actor) {
    return <WorldEditor />;
  }

  const showNotes = actor.notes || notesOpen;

  const scrollKey = `${actor.id}_${lastScriptTab}`;

  const numOverrides = Object.keys(actor.prefabScriptOverrides)?.length;

  return (
    <Sidebar onClick={selectSidebar}>
      <CachedScroll key={scrollKey} cacheKey={scrollKey}>
        {!lockScriptEditor && (
          <FormContainer>
            <FormHeader>
              <EditableText
                name="name"
                placeholder={actorName(actor, actorIndex)}
                value={actor.name || ""}
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
                {!actor.prefabId && (
                  <MenuItem onClick={convertToPrefab}>
                    {l10n("FIELD_CONVERT_TO_PREFAB")}
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
                    <ActorSymbolsEditor id={actor.id} />
                    <SpriteSymbolsEditor id={actor.spriteSheetId} />
                  </SymbolEditorWrapper>
                )}
                {showNotes && (
                  <FormContainer>
                    <FormRow>
                      <NoteField
                        value={actor.notes || ""}
                        onChange={onChangeNotes}
                      />
                    </FormRow>
                  </FormContainer>
                )}
              </SidebarColumn>
            )}

            <SidebarColumn>
              <FormContainer>
                <FormRow>
                  <CoordinateInput
                    name="x"
                    coordinate="x"
                    value={actor.x}
                    placeholder="0"
                    min={0}
                    max={scene.width - 2}
                    onChange={onChangeX}
                  />
                  <CoordinateInput
                    name="y"
                    coordinate="y"
                    value={actor.y}
                    placeholder="0"
                    min={0}
                    max={scene.height - 1}
                    onChange={onChangeY}
                  />
                  <DropdownButton
                    menuDirection="right"
                    label={<PinIcon />}
                    showArrow={false}
                    variant={actor.isPinned ? "primary" : "normal"}
                    style={{
                      padding: "5px 0",
                      minWidth: 28,
                    }}
                  >
                    <MenuItem
                      onClick={onToggleField("isPinned")}
                      icon={actor.isPinned ? <CheckIcon /> : undefined}
                    >
                      {l10n("FIELD_PIN_TO_SCREEN")}
                    </MenuItem>
                  </DropdownButton>
                </FormRow>
                <FormRow>
                  <FormField
                    name="actorDirection"
                    label={l10n("FIELD_DIRECTION")}
                  >
                    <DirectionPicker
                      id="actorDirection"
                      value={actor.direction}
                      onChange={onChangeDirection}
                    />
                  </FormField>
                </FormRow>
              </FormContainer>
            </SidebarColumn>
          </SidebarColumns>
        )}

        {(prefab || showPrefab) && (
          <PrefabHeader prefabSet={prefab !== undefined}>
            {l10n("SIDEBAR_PREFABS")}
            <CaretRightIcon />
            <ActorPrefabSelectButton
              name={"prefabId"}
              value={actor.prefabId}
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
                      editorActions.selectActorPrefab({
                        actorPrefabId: prefab.id,
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
                      editorActions.selectActorPrefab({
                        actorPrefabId: prefab.id,
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
                        entitiesActions.applyActorPrefabScriptEventOverrides({
                          actorId: actor.id,
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
                        entitiesActions.revertActorPrefabScriptEventOverrides({
                          actorId: actor.id,
                        })
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
                      entitiesActions.unpackActorPrefab({
                        actorId: actor.id,
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

        {!lockScriptEditor && (
          <SidebarColumns>
            {prefab ? (
              <ActorPrefabEditorProperties prefab={prefab} />
            ) : (
              <ActorEditorProperties actor={actor} />
            )}
          </SidebarColumns>
        )}

        {prefab ? (
          <ActorPrefabEditorScripts
            prefab={prefab}
            actor={actor}
            sceneId={sceneId}
            isInstance
          />
        ) : (
          <ActorEditorScripts actor={actor} sceneId={sceneId} />
        )}
      </CachedScroll>
    </Sidebar>
  );
};
