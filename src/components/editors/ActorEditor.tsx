import React, { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clipboard } from "electron";
import { RootState } from "store/configureStore";
import {
  actorSelectors,
  sceneSelectors,
  spriteSheetSelectors,
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
import { Actor, ScriptEvent } from "store/features/entities/entitiesTypes";
import l10n from "lib/helpers/l10n";
import { SidebarColumn, SidebarMultiColumnAuto } from "ui/sidebars/Sidebar";
import { CoordinateInput } from "ui/form/CoordinateInput";
import { Checkbox } from "ui/form/Checkbox";
import { LockIcon, LockOpenIcon, PinIcon } from "ui/icons/Icons";
import castEventValue from "lib/helpers/castEventValue";
import { CheckboxField } from "ui/form/CheckboxField";
import DirectionPicker from "../forms/DirectionPicker";
import { DMG_PALETTE, SPRITE_TYPE_STATIC } from "../../consts";
import { SpriteSheetSelectButton } from "../forms/SpriteSheetSelectButton";
import { WorldEditor } from "./WorldEditor";
import ScriptEditorDropdownButton from "../script/ScriptEditorDropdownButton";
import ScriptEditor from "../script/ScriptEditor";
import { NumberField } from "ui/form/NumberField";
import { SpriteTypeSelect } from "../forms/SpriteTypeSelect";
import { AnimationSpeedSelect } from "../forms/AnimationSpeedSelect";
import { MovementSpeedSelect } from "../forms/MovementSpeedSelect";
import CollisionMaskPicker from "../forms/CollisionMaskPicker";
import { KeysMatching } from "lib/helpers/types";
import { NoteField } from "ui/form/NoteField";
import { TabBar } from "ui/tabs/Tabs";
import { Button } from "ui/buttons/Button";

interface ActorEditorProps {
  id: string;
  sceneId: string;
}

interface ScriptHandler {
  value: ScriptEvent[];
  onChange: (newValue: ScriptEvent[]) => void;
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

const actorName = (actor: Actor, actorIndex: number) =>
  actor.name ? actor.name : `Actor ${actorIndex + 1}`;

const defaultTabs = {
  interact: l10n("SIDEBAR_ON_INTERACT"),
  start: l10n("SIDEBAR_ON_INIT"),
  update: l10n("SIDEBAR_ON_UPDATE"),
} as const;

const collisionTabs = {
  hit: l10n("SIDEBAR_ON_HIT"),
  start: l10n("SIDEBAR_ON_INIT"),
  update: l10n("SIDEBAR_ON_UPDATE"),
} as const;

const hitTabs = {
  hitPlayer: l10n("FIELD_PLAYER"),
  hit1: l10n("FIELD_COLLISION_GROUP_N", { n: 1 }),
  hit2: l10n("FIELD_COLLISION_GROUP_N", { n: 2 }),
  hit3: l10n("FIELD_COLLISION_GROUP_N", { n: 3 }),
};

type DefaultTab = keyof typeof defaultTabs;
type CollisionTab = keyof typeof collisionTabs;

export const ActorEditor: FC<ActorEditorProps> = ({ id, sceneId }) => {
  const actor = useSelector((state: RootState) =>
    actorSelectors.selectById(state, id)
  );
  const spriteSheet = useSelector((state: RootState) =>
    spriteSheetSelectors.selectById(state, actor?.spriteSheetId || "")
  );
  const [clipboardData, setClipboardData] = useState<unknown>(null);
  const [notesOpen, setNotesOpen] = useState<boolean>(!!actor?.notes);
  const tabs = Object.keys(actor?.collisionGroup ? collisionTabs : defaultTabs);
  const secondaryTabs = Object.keys(hitTabs);

  const lastScriptTab = useSelector(
    (state: RootState) => state.editor.lastScriptTab
  );
  const lastScriptTabSecondary = useSelector(
    (state: RootState) => state.editor.lastScriptTabSecondary
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

  const scene = useSelector((state: RootState) =>
    sceneSelectors.selectById(state, sceneId)
  );
  const defaultSpritePaletteId = useSelector(
    (state: RootState) =>
      state.project.present.settings.defaultSpritePaletteId || DMG_PALETTE.id
  );
  const colorsEnabled = useSelector(
    (state: RootState) => state.project.present.settings.customColorsEnabled
  );
  const lockScriptEditor = useSelector(
    (state: RootState) => state.editor.lockScriptEditor
  );

  const actorIndex = scene?.actors.indexOf(id) || 0;

  // Make sure currently selected script tab is availble
  // when collision group is modified otherwise use first available tab
  useEffect(() => {
    const tabs = Object.keys(
      actor?.collisionGroup ? collisionTabs : defaultTabs
    );
    if (!tabs.includes(scriptMode)) {
      setScriptMode(tabs[0] as keyof ScriptHandlers);
    }
  }, [scriptMode, actor?.collisionGroup]);

  const dispatch = useDispatch();

  const onChangeScriptMode = (mode: keyof ScriptHandlers) => {
    setScriptMode(mode);
    dispatch(editorActions.setScriptTab(mode));
  };

  const onChangeScriptModeSecondary = (mode: keyof ScriptHandlers["hit"]) => {
    setScriptModeSecondary(mode);
    dispatch(editorActions.setScriptTabSecondary(mode));
  };

  const onChangeField =
    <T extends keyof Actor>(key: T) =>
    (editValue: Actor[T]) => {
      dispatch(
        entitiesActions.editActor({
          actorId: id,
          changes: {
            [key]: editValue,
          },
        })
      );
    };

  const onChangeFieldInput =
    (key: keyof Actor) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      const editValue = castEventValue(e);
      dispatch(
        entitiesActions.editActor({
          actorId: id,
          changes: {
            [key]: editValue,
          },
        })
      );
    };

  const onToggleField = (key: KeysMatching<Actor, boolean>) => () => {
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
      dispatch(clipboardActions.copyActor(actor));
    }
  };

  const onPaste = () => {
    if (clipboardData) {
      dispatch(clipboardActions.pasteClipboardEntity(clipboardData));
    }
  };

  const onRemove = () => {
    if (actor) {
      dispatch(entitiesActions.removeActor({ actorId: actor.id, sceneId }));
    }
  };

  const readClipboard = () => {
    try {
      setClipboardData(JSON.parse(clipboard.readText()));
    } catch (err) {
      setClipboardData(null);
    }
  };

  const onAddNotes = () => {
    setNotesOpen(true);
  };

  const onToggleLockScriptEditor = () => {
    dispatch(editorActions.setLockScriptEditor(!lockScriptEditor));
  };

  if (!scene || !actor) {
    return <WorldEditor />;
  }

  const showDirectionInput = true;
  // spriteSheet &&
  // spriteSheet.type !== SPRITE_TYPE_STATIC &&
  // spriteSheet.type !== SPRITE_TYPE_ANIMATED &&
  // actor.spriteType !== SPRITE_TYPE_STATIC;

  const showFrameInput =
    spriteSheet &&
    spriteSheet.numFrames > 1 &&
    actor.spriteType === SPRITE_TYPE_STATIC;

  const showSpriteTypeSelect = false;
  // spriteSheet &&
  // spriteSheet.type !== "static" &&
  // spriteSheet.type !== "animated";

  const showAnimatedCheckbox = false;
  // actor.animSpeed !== null &&
  // spriteSheet &&
  // spriteSheet.numFrames > 1 &&
  // (actor.spriteType === SPRITE_TYPE_STATIC ||
  //   spriteSheet.type !== SPRITE_TYPE_ACTOR);

  const showAnimSpeed = true;
  // spriteSheet &&
  // (spriteSheet.type === SPRITE_TYPE_ACTOR_ANIMATED ||
  //   (actor.spriteType === SPRITE_TYPE_STATIC && spriteSheet.numFrames > 1));

  const showCollisionGroup = !actor.isPinned;

  const showNotes = actor.notes || notesOpen;

  const onEditScript = onChangeField("script");

  const onEditStartScript = onChangeField("startScript");

  const onEditUpdateScript = onChangeField("updateScript");

  const onEditHit1Script = onChangeField("hit1Script");

  const onEditHit2Script = onChangeField("hit2Script");

  const onEditHit3Script = onChangeField("hit3Script");

  const scripts = {
    start: {
      value: actor.startScript,
      onChange: onEditStartScript,
    },
    interact: {
      value: actor.script,
      onChange: onEditScript,
    },
    update: {
      value: actor.updateScript,
      onChange: onEditUpdateScript,
    },
    hit: {
      hitPlayer: {
        value: actor.script,
        onChange: onEditScript,
      },
      hit1: {
        value: actor.hit1Script,
        onChange: onEditHit1Script,
      },
      hit2: {
        value: actor.hit2Script,
        onChange: onEditHit2Script,
      },
      hit3: {
        value: actor.hit3Script,
        onChange: onEditHit3Script,
      },
    },
  } as const;

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

  return (
    <SidebarMultiColumnAuto onClick={selectSidebar}>
      {!lockScriptEditor && (
        <SidebarColumn>
          <FormContainer>
            <FormHeader>
              <EditableText
                name="name"
                placeholder={actorName(actor, actorIndex)}
                value={actor.name || ""}
                onChange={onChangeFieldInput("name")}
              />
              <DropdownButton
                size="small"
                variant="transparent"
                menuDirection="right"
                onMouseDown={readClipboard}
              >
                {!showNotes && (
                  <MenuItem onClick={onAddNotes}>
                    {l10n("FIELD_ADD_NOTES")}
                  </MenuItem>
                )}
                <MenuItem onClick={onCopy}>{l10n("MENU_COPY_ACTOR")}</MenuItem>
                {clipboardData &&
                  (clipboardData as { __type?: unknown }).__type ===
                    "actor" && (
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

            {showNotes && (
              <FormRow>
                <NoteField
                  autofocus
                  value={actor.notes || ""}
                  onChange={onChangeFieldInput("notes")}
                />
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
                onChange={onChangeFieldInput("x")}
              />
              <CoordinateInput
                name="y"
                coordinate="y"
                value={actor.y}
                placeholder="0"
                min={0}
                max={scene.height - 1}
                onChange={onChangeFieldInput("y")}
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
                  frame={
                    actor.spriteType === SPRITE_TYPE_STATIC ? actor.frame : 0
                  }
                  paletteId={
                    colorsEnabled
                      ? actor.paletteId || defaultSpritePaletteId
                      : undefined
                  }
                  onChange={onChangeField("spriteSheetId")}
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
                    onChange={onChangeFieldInput("direction")}
                  />
                </FormField>
              )}
              {showFrameInput && (
                <NumberField
                  name="frame"
                  label={l10n("FIELD_INITIAL_FRAME")}
                  placeholder="0"
                  min={0}
                  max={(spriteSheet?.numFrames || 1) - 1}
                  value={actor.frame}
                  onChange={onChangeFieldInput("frame")}
                />
              )}
              {showSpriteTypeSelect && (
                <FormField name="spriteType" label={l10n("FIELD_ACTOR_TYPE")}>
                  <SpriteTypeSelect
                    name="spriteType"
                    value={actor.spriteType}
                    onChange={onChangeField("spriteType")}
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
                  onChange={onChangeFieldInput("animate")}
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
                  onChange={onChangeField("moveSpeed")}
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
                    onChange={onChangeField("animSpeed")}
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
                      onChange={onChangeFieldInput("collisionGroup")}
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
        {!actor.collisionGroup && (
          <TabBar
            value={scriptMode as DefaultTab}
            values={defaultTabs}
            overflowActiveTab={scriptMode === "hit"}
            onChange={onChangeScriptMode}
            buttons={
              scriptMode !== "hit" && scripts[scriptMode] ? (
                <>
                  {lockButton}
                  <ScriptEditorDropdownButton
                    value={scripts[scriptMode].value}
                    onChange={scripts[scriptMode].onChange}
                  />
                </>
              ) : (
                lockButton
              )
            }
          />
        )}
        {actor.collisionGroup && (
          <TabBar
            value={scriptMode as CollisionTab}
            values={collisionTabs}
            overflowActiveTab={scriptMode === "hit"}
            onChange={onChangeScriptMode}
            buttons={
              scriptMode !== "hit" && scripts[scriptMode] ? (
                <>
                  {lockButton}
                  <ScriptEditorDropdownButton
                    value={scripts[scriptMode].value}
                    onChange={scripts[scriptMode].onChange}
                  />
                </>
              ) : (
                lockButton
              )
            }
          />
        )}
        {scriptMode === "hit" && (
          <TabBar
            variant="secondary"
            value={scriptModeSecondary}
            values={hitTabs}
            onChange={onChangeScriptModeSecondary}
            buttons={
              <ScriptEditorDropdownButton
                value={scripts[scriptMode][scriptModeSecondary].value}
                onChange={scripts[scriptMode][scriptModeSecondary].onChange}
              />
            }
          />
        )}
        {scriptMode !== "hit" && scripts[scriptMode] && (
          <ScriptEditor
            value={scripts[scriptMode].value}
            type="actor"
            onChange={scripts[scriptMode].onChange}
            entityId={actor.id}
          />
        )}
        {scriptMode === "hit" &&
          scripts[scriptMode] &&
          scripts[scriptMode][scriptModeSecondary] && (
            <ScriptEditor
              value={scripts[scriptMode][scriptModeSecondary].value}
              type="actor"
              onChange={scripts[scriptMode][scriptModeSecondary].onChange}
              entityId={actor.id}
            />
          )}
      </SidebarColumn>
    </SidebarMultiColumnAuto>
  );
};
