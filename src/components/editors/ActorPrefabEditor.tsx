import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { actorPrefabSelectors } from "store/features/entities/entitiesState";
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
  ActorPrefabNormalized,
  CollisionGroup,
  ScriptEventNormalized,
} from "shared/lib/entities/entitiesTypes";
import { Sidebar, SidebarColumn, SidebarColumns } from "ui/sidebars/Sidebar";
import { LockIcon, LockOpenIcon } from "ui/icons/Icons";
import { CheckboxField } from "ui/form/CheckboxField";
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
import { castEventToBool } from "renderer/lib/helpers/castEventValue";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { ScriptEditorCtx } from "shared/lib/scripts/context";
import CachedScroll from "ui/util/CachedScroll";

interface ActorPrefabEditorProps {
  id: string;
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

export const ActorPrefabEditor: FC<ActorPrefabEditorProps> = ({ id }) => {
  const actorPrefabIds = useAppSelector(actorPrefabSelectors.selectIds);
  const actor = useAppSelector((state) =>
    actorPrefabSelectors.selectById(state, id)
  );

  const index = React.useMemo(
    () => actorPrefabIds.indexOf(id),
    [actorPrefabIds, id]
  );

  const [notesOpen, setNotesOpen] = useState<boolean>(!!actor?.notes);
  const clipboardFormat = useAppSelector(
    (state) => state.clipboard.data?.format
  );
  const lockScriptEditor = useAppSelector(
    (state) => state.editor.lockScriptEditor
  );

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

  const onChangeSpriteSheetId = useCallback(
    (e: string) => onChangeActorPrefabProp("spriteSheetId", e),
    [onChangeActorPrefabProp]
  );

  const onChangeMoveSpeed = useCallback(
    (e: number) => onChangeActorPrefabProp("moveSpeed", e),
    [onChangeActorPrefabProp]
  );

  const onChangeAnimSpeed = useCallback(
    (e: number) => onChangeActorPrefabProp("animSpeed", e),
    [onChangeActorPrefabProp]
  );

  const onChangeCollisionGroup = useCallback(
    (e: CollisionGroup) => onChangeActorPrefabProp("collisionGroup", e),
    [onChangeActorPrefabProp]
  );

  const onChangePersistent = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeActorPrefabProp("persistent", castEventToBool(e)),
    [onChangeActorPrefabProp]
  );

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

  const onToggleLockScriptEditor = () => {
    dispatch(editorActions.setLockScriptEditor(!lockScriptEditor));
  };

  const scriptKey = getScriptKey(scriptMode, scriptModeSecondary);

  const scriptCtx: ScriptEditorCtx = useMemo(
    () => ({
      type: "prefab",
      entityType: "actorPrefab",
      entityId: id,
      sceneId: "",
      scriptKey,
    }),
    [id, scriptKey]
  );

  if (!actor) {
    return <WorldEditor />;
  }

  const showAnimSpeed = true;

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

  const scrollKey = `${actor.id}_${scriptKey}`;

  return (
    <Sidebar onClick={selectSidebar}>
      <CachedScroll key={scrollKey} cacheKey={scrollKey}>
        {!lockScriptEditor && (
          <FormContainer>
            <FormHeader>
              <EditableText
                name="name"
                placeholder={actorName(actor, index)}
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
                  <FormField
                    name="actorSprite"
                    label={l10n("FIELD_SPRITE_SHEET")}
                  >
                    <SpriteSheetSelectButton
                      name="actorSprite"
                      value={actor.spriteSheetId}
                      direction={"down"}
                      frame={0}
                      onChange={onChangeSpriteSheetId}
                      includeInfo
                    />
                  </FormField>
                </FormRow>
              </FormContainer>
            </SidebarColumn>
            <SidebarColumn>
              <FormContainer>
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
              </FormContainer>
            </SidebarColumn>

            <SidebarColumn>
              <FormContainer>
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
              </FormContainer>
            </SidebarColumn>
          </SidebarColumns>
        )}
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
      </CachedScroll>
    </Sidebar>
  );
};
