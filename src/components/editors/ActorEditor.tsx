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
} from "ui/form/FormLayout";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import entitiesActions from "store/features/entities/entitiesActions";
import editorActions from "store/features/editor/editorActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import {
  ActorDirection,
  ActorNormalized,
  CollisionGroup,
} from "shared/lib/entities/entitiesTypes";
import { Sidebar, SidebarColumn, SidebarColumns } from "ui/sidebars/Sidebar";
import { CoordinateInput } from "ui/form/CoordinateInput";
import { Checkbox } from "ui/form/Checkbox";
import { CaretRightIcon, PinIcon } from "ui/icons/Icons";
import DirectionPicker from "components/forms/DirectionPicker";
import { SpriteSheetSelectButton } from "components/forms/SpriteSheetSelectButton";
import { WorldEditor } from "./WorldEditor";
import { AnimationSpeedSelect } from "components/forms/AnimationSpeedSelect";
import { MovementSpeedSelect } from "components/forms/MovementSpeedSelect";
import CollisionMaskPicker from "components/forms/CollisionMaskPicker";
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
import { ActorPrefabSelect } from "components/forms/ActorPrefabSelect";
import { ActorPrefabEditorScripts } from "components/editors/prefab/ActorPrefabEditorScripts";
import { ActorPrefabEditorProperties } from "components/editors/prefab/ActorPrefabEditorProperties";
import { ActorEditorScripts } from "./actor/ActorEditorScripts";
import { ActorEditorProperties } from "./actor/ActorEditorProperties";
import { PillButton } from "ui/buttons/PillButton";
import { Button } from "ui/buttons/Button";
import { FlexGrow } from "ui/spacing/Spacing";
import styled from "styled-components";

interface ActorEditorProps {
  id: string;
  sceneId: string;
}

const PrefabHeader = styled.div`
  width: 100%;
  background: #03a9f4;
  color: #fff;
  position: sticky;
  z-index: 1;
  top: 0;
  padding: 8px 10px;
  box-sizing: border-box;

  display: flex;
  align-items: center;

  ${PillButton} {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 5px;
  }

  ${Button} {
    color: #fff;
  }

  svg {
    fill: #fff;
    max-height: 10px;
  }
`;

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
    (e: React.ChangeEvent<HTMLInputElement>) =>
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

  const onChangeSpriteSheetId = useCallback(
    (e: string) => onChangeActorProp("spriteSheetId", e),
    [onChangeActorProp]
  );

  const onChangeDirection = useCallback(
    (e: ActorDirection) => onChangeActorProp("direction", e),
    [onChangeActorProp]
  );

  const onChangeActorPrefab = useCallback(
    (e: string) => onChangeActorProp("prefabId", e),
    [onChangeActorProp]
  );

  const onChangeMoveSpeed = useCallback(
    (e: number) => onChangeActorProp("moveSpeed", e),
    [onChangeActorProp]
  );

  const onChangeAnimSpeed = useCallback(
    (e: number) => onChangeActorProp("animSpeed", e),
    [onChangeActorProp]
  );

  const onChangeCollisionGroup = useCallback(
    (e: CollisionGroup) => onChangeActorProp("collisionGroup", e),
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

  const showAnimSpeed = true;

  const showCollisionGroup = !actor.isPinned;

  const showNotes = actor.notes || notesOpen;

  const scrollKey = `${actor.id}_${lastScriptTab}`;

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

        {prefab && (
          <PrefabHeader>
            {/* <PrefabHeader
              style={{
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
              }}
            > */}
            {l10n("SIDEBAR_PREFABS")}
            <CaretRightIcon />
            <PillButton
              variant="blue"
              onClick={() => {
                dispatch(
                  editorActions.selectActorPrefab({
                    actorPrefabId: prefab.id,
                  })
                );
              }}
            >
              {prefab.name}
            </PillButton>
            <FlexGrow />
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
                Edit Prefab
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
                View Prefab Uses
              </MenuItem>
              <MenuDivider />
              <MenuItem>Unpack Prefab</MenuItem>
            </DropdownButton>
            {/* <Button size="small" variant="transparent">
              Unpack
            </Button> */}
            {/* <ActorPrefabSelect
                      value={actor.prefabId}
                      onChange={onChangeActorPrefab}
                      name={"actorPrefab"}
                    /> */}
          </PrefabHeader>
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
                    <MenuItem onClick={onToggleField("isPinned")}>
                      <Checkbox id="pin" name="pin" checked={actor.isPinned} />{" "}
                      Pin to Screen
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

            {prefab ? (
              <ActorPrefabEditorProperties prefab={prefab} />
            ) : (
              <ActorEditorProperties actor={actor} />
            )}
          </SidebarColumns>
        )}

        {prefab ? (
          <ActorPrefabEditorScripts prefab={prefab} />
        ) : (
          <ActorEditorScripts actor={actor} sceneId={sceneId} />
        )}
      </CachedScroll>
    </Sidebar>
  );
};
