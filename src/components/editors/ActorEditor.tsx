import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import {
  actorSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesState";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { EditableText } from "ui/form/EditableText";
import {
  FormContainer,
  FormDivider,
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
  ScriptEventNormalized,
} from "shared/lib/entities/entitiesTypes";
import { Sidebar, SidebarColumn } from "ui/sidebars/Sidebar";
import { CoordinateInput } from "ui/form/CoordinateInput";
import { Checkbox } from "ui/form/Checkbox";
import { LockIcon, LockOpenIcon, PinIcon } from "ui/icons/Icons";
import { CheckboxField } from "ui/form/CheckboxField";
import DirectionPicker from "components/forms/DirectionPicker";
import { DMG_PALETTE } from "consts";
import { SpriteSheetSelectButton } from "components/forms/SpriteSheetSelectButton";
import { WorldEditor } from "./WorldEditor";
import ScriptEditorDropdownButton from "components/script/ScriptEditorDropdownButton";
import ScriptEditor from "components/script/ScriptEditor";
import { AnimationSpeedSelect } from "components/forms/AnimationSpeedSelect";
import { MovementSpeedSelect } from "components/forms/MovementSpeedSelect";
import CollisionMaskPicker from "components/forms/CollisionMaskPicker";
import { NoteField } from "ui/form/NoteField";
import { StickyTabs, TabBar, TabSettings } from "ui/tabs/Tabs";
import { Button } from "ui/buttons/Button";
import { ClipboardTypeActors } from "store/features/clipboard/clipboardTypes";
import { ActorSymbolsEditor } from "components/forms/symbols/ActorSymbolsEditor";
import { SpriteSymbolsEditor } from "components/forms/symbols/SpriteSymbolsEditor";
import { SymbolEditorWrapper } from "components/forms/symbols/SymbolEditorWrapper";
import { ScriptEditorContext } from "components/script/ScriptEditorContext";
import { actorName } from "shared/lib/entities/entitiesHelpers";
import l10n from "shared/lib/lang/l10n";
import { KeysMatching } from "shared/types";
import {
  castEventToBool,
  castEventToInt,
} from "renderer/lib/helpers/castEventValue";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { ScriptEditorCtx } from "shared/lib/scripts/context";

interface ActorEditorProps {
  id: string;
  sceneId: string;
  multiColumn: boolean;
}

interface ScriptHandler {
  value: ScriptEventNormalized[];
  onChange: (newValue: ScriptEventNormalized[]) => void;
}

interface ScriptHandlers {
  start: ScriptHandler;
  interact: ScriptHandler;
  update: ScriptHandler;
  hit: {
    hitPlayer: ScriptHandler;
    hit1: ScriptHandler;
    hit2: ScriptHandler;
    hit3: ScriptHandler;
  };
}

type ActorScriptKey =
  | "script"
  | "startScript"
  | "updateScript"
  | "hit1Script"
  | "hit2Script"
  | "hit3Script";

type DefaultTab = "interact" | "start" | "update";
type CollisionTab = "hit" | "start" | "update";
type HitTab = "hitPlayer" | "hit1" | "hit2" | "hit3";

const getScriptKey = (
  primaryTab: DefaultTab | CollisionTab,
  secondaryTab: HitTab
): ActorScriptKey => {
  if (primaryTab === "interact") {
    return "script";
  }
  if (primaryTab === "start") {
    return "startScript";
  }
  if (primaryTab === "update") {
    return "updateScript";
  }
  if (primaryTab === "hit") {
    if (secondaryTab === "hitPlayer") {
      return "script";
    }
    if (secondaryTab === "hit1") {
      return "hit1Script";
    }
    if (secondaryTab === "hit2") {
      return "hit2Script";
    }
    if (secondaryTab === "hit3") {
      return "hit3Script";
    }
  }
  return "script";
};

export const ActorEditor: FC<ActorEditorProps> = ({
  id,
  sceneId,
  multiColumn,
}) => {
  const actor = useAppSelector((state) => actorSelectors.selectById(state, id));
  const [notesOpen, setNotesOpen] = useState<boolean>(!!actor?.notes);
  const clipboardFormat = useAppSelector(
    (state) => state.clipboard.data?.format
  );
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, sceneId)
  );
  const defaultSpritePaletteId = useAppSelector(
    (state) =>
      state.project.present.settings.defaultSpritePaletteId || DMG_PALETTE.id
  );
  const colorsEnabled = useAppSelector(
    (state) => state.project.present.settings.colorMode !== "mono"
  );
  const lockScriptEditor = useAppSelector(
    (state) => state.editor.lockScriptEditor
  );

  const actorIndex = scene?.actors.indexOf(id) || 0;

  const defaultTabs: Record<DefaultTab, string> = useMemo(
    () => ({
      interact: l10n("SIDEBAR_ON_INTERACT"),
      start: l10n("SIDEBAR_ON_INIT"),
      update: l10n("SIDEBAR_ON_UPDATE"),
    }),
    []
  );

  const collisionTabs: Record<CollisionTab, string> = useMemo(
    () => ({
      hit: l10n("SIDEBAR_ON_HIT"),
      start: l10n("SIDEBAR_ON_INIT"),
      update: l10n("SIDEBAR_ON_UPDATE"),
    }),
    []
  );

  const hitTabs: Record<HitTab, string> = useMemo(
    () => ({
      hitPlayer: l10n("FIELD_PLAYER"),
      hit1: l10n("FIELD_COLLISION_GROUP_N", { n: 1 }),
      hit2: l10n("FIELD_COLLISION_GROUP_N", { n: 2 }),
      hit3: l10n("FIELD_COLLISION_GROUP_N", { n: 3 }),
    }),
    []
  );

  const tabs = Object.keys(actor?.collisionGroup ? collisionTabs : defaultTabs);
  const secondaryTabs = Object.keys(hitTabs);
  const lastScriptTab = useAppSelector((state) => state.editor.lastScriptTab);
  const lastScriptTabSecondary = useAppSelector(
    (state) => state.editor.lastScriptTabSecondary
  );
  const initialTab = tabs.includes(lastScriptTab) ? lastScriptTab : tabs[0];
  const initialSecondaryTab = secondaryTabs.includes(lastScriptTabSecondary)
    ? lastScriptTabSecondary
    : secondaryTabs[0];

  const [scriptMode, setScriptMode] = useState<keyof ScriptHandlers>(
    initialTab as keyof ScriptHandlers
  );
  const [scriptModeSecondary, setScriptModeSecondary] = useState<
    keyof ScriptHandlers["hit"]
  >(initialSecondaryTab as keyof ScriptHandlers["hit"]);

  // Make sure currently selected script tab is availble
  // when collision group is modified otherwise use first available tab
  useEffect(() => {
    const tabs = Object.keys(
      actor?.collisionGroup ? collisionTabs : defaultTabs
    );
    if (!tabs.includes(scriptMode)) {
      setScriptMode(tabs[0] as keyof ScriptHandlers);
    }
  }, [scriptMode, actor?.collisionGroup, collisionTabs, defaultTabs]);

  const [showSymbols, setShowSymbols] = useState(false);

  const dispatch = useAppDispatch();

  const onChangeScriptMode = (mode: keyof ScriptHandlers) => {
    setScriptMode(mode);
    dispatch(editorActions.setScriptTab(mode));
  };

  const onChangeScriptModeSecondary = (mode: keyof ScriptHandlers["hit"]) => {
    setScriptModeSecondary(mode);
    dispatch(editorActions.setScriptTabSecondary(mode));
  };

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

  const onChangeMoveSpeed = useCallback(
    (e: number) => onChangeActorProp("moveSpeed", e),
    [onChangeActorProp]
  );

  const onChangeAnimSpeed = useCallback(
    (e: number | null) => onChangeActorProp("animSpeed", e),
    [onChangeActorProp]
  );

  const onChangeCollisionGroup = useCallback(
    (e: string) => onChangeActorProp("collisionGroup", e),
    [onChangeActorProp]
  );

  const onChangeAnimate = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeActorProp("animate", castEventToBool(e)),
    [onChangeActorProp]
  );
  const onChangePersistent = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeActorProp("persistent", castEventToBool(e)),
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

  const onToggleLockScriptEditor = () => {
    dispatch(editorActions.setLockScriptEditor(!lockScriptEditor));
  };

  const scriptKey = getScriptKey(scriptMode, scriptModeSecondary);

  const scriptCtx: ScriptEditorCtx = useMemo(
    () => ({
      type: "entity",
      entityType: "actor",
      entityId: id,
      sceneId,
      scriptKey,
    }),
    [id, sceneId, scriptKey]
  );

  if (!scene || !actor) {
    return <WorldEditor />;
  }

  const showDirectionInput = true;
  const showAnimatedCheckbox = false;
  const showAnimSpeed = true;

  const showCollisionGroup = !actor.isPinned;

  const showNotes = actor.notes || notesOpen;

  const lockButton = (
    <Button
      size="small"
      variant={lockScriptEditor ? "primary" : "transparent"}
      onClick={onToggleLockScriptEditor}
      title={
        lockScriptEditor
          ? l10n("FIELD_UNLOCK_SCRIPT_EDITOR")
          : l10n("FIELD_LOCK_SCRIPT_EDITOR")
      }
    >
      {lockScriptEditor ? <LockIcon /> : <LockOpenIcon />}
    </Button>
  );

  const scriptButton = (
    <ScriptEditorDropdownButton
      value={actor[scriptKey]}
      type="actor"
      entityId={actor.id}
      scriptKey={scriptKey}
    />
  );

  return (
    <Sidebar onClick={selectSidebar} multiColumn={multiColumn}>
      {!lockScriptEditor && (
        <SidebarColumn style={{ maxWidth: multiColumn ? 300 : undefined }}>
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

            {showSymbols && (
              <>
                <SymbolEditorWrapper>
                  <ActorSymbolsEditor id={actor.id} />
                  <SpriteSymbolsEditor id={actor.spriteSheetId} />
                </SymbolEditorWrapper>
                <FormDivider />
              </>
            )}

            {showNotes && (
              <FormRow>
                <NoteField value={actor.notes || ""} onChange={onChangeNotes} />
              </FormRow>
            )}

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
                  <Checkbox id="pin" name="pin" checked={actor.isPinned} /> Pin
                  to Screen
                </MenuItem>
              </DropdownButton>
            </FormRow>
            <FormDivider />
            <FormRow>
              <FormField name="actorSprite" label={l10n("FIELD_SPRITE_SHEET")}>
                <SpriteSheetSelectButton
                  name="actorSprite"
                  value={actor.spriteSheetId}
                  direction={actor.direction}
                  frame={0}
                  paletteId={
                    colorsEnabled
                      ? actor.paletteId || defaultSpritePaletteId
                      : undefined
                  }
                  onChange={onChangeSpriteSheetId}
                  includeInfo
                />
              </FormField>
            </FormRow>
            <FormRow>
              {showDirectionInput && (
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
              )}
            </FormRow>
            {showAnimatedCheckbox && (
              <FormRow>
                <CheckboxField
                  name="animated"
                  label={l10n("FIELD_ANIMATE_WHEN_STATIONARY")}
                  checked={actor.animate}
                  onChange={onChangeAnimate}
                />
              </FormRow>
            )}
            <FormDivider />
            <FormRow>
              <FormField
                name="actorMoveSpeed"
                label={l10n("FIELD_MOVEMENT_SPEED")}
              >
                <MovementSpeedSelect
                  name="actorMoveSpeed"
                  value={actor.moveSpeed}
                  onChange={onChangeMoveSpeed}
                />
              </FormField>
              {showAnimSpeed && (
                <FormField
                  name="actorAnimSpeed"
                  label={l10n("FIELD_ANIMATION_SPEED")}
                >
                  <AnimationSpeedSelect
                    name="actorAnimSpeed"
                    value={actor.animSpeed}
                    onChange={onChangeAnimSpeed}
                  />
                </FormField>
              )}
            </FormRow>
            {showCollisionGroup && (
              <>
                <FormDivider />
                <FormRow>
                  <FormField
                    name="actorCollisionGroup"
                    label={l10n("FIELD_COLLISION_GROUP")}
                  >
                    <CollisionMaskPicker
                      id="actorCollisionGroup"
                      value={actor.collisionGroup}
                      onChange={onChangeCollisionGroup}
                      includeNone
                    />
                  </FormField>
                </FormRow>
              </>
            )}
          </FormContainer>
        </SidebarColumn>
      )}
      <SidebarColumn>
        <StickyTabs>
          {actor.collisionGroup ? (
            <TabBar
              value={scriptMode as CollisionTab}
              values={collisionTabs}
              onChange={onChangeScriptMode}
              overflowActiveTab={
                scriptMode === "hit" || scriptMode === "update"
              }
              buttons={
                <>
                  {lockButton}
                  {scriptButton}
                </>
              }
            />
          ) : (
            <TabBar
              value={scriptMode as DefaultTab}
              values={defaultTabs}
              onChange={onChangeScriptMode}
              overflowActiveTab={scriptMode === "update"}
              buttons={
                <>
                  {lockButton}
                  {scriptButton}
                </>
              }
            />
          )}
          {scriptMode === "hit" && (
            <TabBar
              variant="secondary"
              value={scriptModeSecondary}
              values={hitTabs}
              onChange={onChangeScriptModeSecondary}
            />
          )}
          {scriptMode === "update" && (
            <TabSettings>
              <CheckboxField
                name="persistent"
                label={l10n("FIELD_KEEP_RUNNING_WHILE_OFFSCREEN")}
                checked={actor.persistent}
                onChange={onChangePersistent}
              />
            </TabSettings>
          )}
        </StickyTabs>

        <ScriptEditorContext.Provider value={scriptCtx}>
          <ScriptEditor value={actor[scriptKey]} />
        </ScriptEditorContext.Provider>
      </SidebarColumn>
    </Sidebar>
  );
};
