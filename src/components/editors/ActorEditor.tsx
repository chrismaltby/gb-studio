import React, { FC, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/configureStore";
import {
  actorSelectors,
  sceneSelectors,
  spriteSheetSelectors,
} from "../../store/features/entities/entitiesState";
import { DropdownButton } from "../ui/buttons/DropdownButton";
import { EditableText } from "../ui/form/EditableText";
import {
  FormContainer,
  FormDivider,
  FormField,
  FormHeader,
  FormRow,
} from "../ui/form/FormLayout";
import { MenuItem } from "../ui/menu/Menu";
import entitiesActions from "../../store/features/entities/entitiesActions";
import editorActions from "../../store/features/editor/editorActions";
import clipboardActions from "../../store/features/clipboard/clipboardActions";
import {
  Actor,
  ScriptEvent,
} from "../../store/features/entities/entitiesTypes";
import l10n from "../../lib/helpers/l10n";
import { SidebarColumn, SidebarMultiColumnAuto } from "../ui/sidebars/Sidebar";
import { CoordinateInput } from "../ui/form/CoordinateInput";
import { Checkbox } from "../ui/form/Checkbox";
import { PinIcon } from "../ui/icons/Icons";
import castEventValue from "../../lib/helpers/castEventValue";
import { CheckboxField } from "../ui/form/CheckboxField";
import DirectionPicker from "../forms/DirectionPicker";
import { PaletteSelectButton } from "../forms/PaletteSelectButton";
import {
  DMG_PALETTE,
  SPRITE_TYPE_ACTOR,
  SPRITE_TYPE_ACTOR_ANIMATED,
  SPRITE_TYPE_ANIMATED,
  SPRITE_TYPE_STATIC,
} from "../../consts";
import { SpriteSheetSelectButton } from "../forms/SpriteSheetSelectButton";
import WorldEditor from "./WorldEditor";
import ScriptEditorDropdownButton from "../script/ScriptEditorDropdownButton";
import { SidebarTabs } from "./Sidebar";
import ScriptEditor from "../script/ScriptEditor";
import { NumberField } from "../ui/form/NumberField";
import { SpriteTypeSelect } from "../forms/SpriteTypeSelect";
import { AnimationSpeedSelect } from "../forms/AnimationSpeedSelect";
import { MovementSpeedSelect } from "../forms/MovementSpeedSelect";
import CollisionMaskPicker from "../forms/CollisionMaskPicker";

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
};

const collisionTabs = {
  hit: l10n("SIDEBAR_ON_HIT"),
  start: l10n("SIDEBAR_ON_INIT"),
  update: l10n("SIDEBAR_ON_UPDATE"),
};

const hitTabs = {
  hitPlayer: l10n("FIELD_PLAYER"),
  hit1: l10n("FIELD_COLLISION_GROUP_N", { n: 1 }),
  hit2: l10n("FIELD_COLLISION_GROUP_N", { n: 2 }),
  hit3: l10n("FIELD_COLLISION_GROUP_N", { n: 3 }),
};

export const ActorEditor: FC<ActorEditorProps> = ({ id, sceneId }) => {
  const actor = useSelector((state: RootState) =>
    actorSelectors.selectById(state, id)
  );
  const spriteSheet = useSelector((state: RootState) =>
    spriteSheetSelectors.selectById(state, actor?.spriteSheetId || "")
  );
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

  const actorIndex = scene?.actors.indexOf(id) || 0;

  const dispatch = useDispatch();

  const onChangeScriptMode = (mode: keyof ScriptHandlers) => {
    setScriptMode(mode);
    dispatch(editorActions.setScriptTab(mode));
  };

  const onChangeScriptModeSecondary = (mode: keyof ScriptHandlers["hit"]) => {
    setScriptModeSecondary(mode);
    dispatch(editorActions.setScriptTabSecondary(mode));
  };

  const onChangeField = (key: keyof Actor) => (
    e: React.ChangeEvent<HTMLInputElement>
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

  const onChangeString = (key: keyof Actor) => (editValue: string) => {
    dispatch(
      entitiesActions.editActor({
        actorId: id,
        changes: {
          [key]: editValue,
        },
      })
    );
  };

  const onChangeNumber = (key: keyof Actor) => (editValue: number) => {
    dispatch(
      entitiesActions.editActor({
        actorId: id,
        changes: {
          [key]: editValue,
        },
      })
    );
  };

  const onChangeScript = (key: keyof Actor) => (editValue: ScriptEvent[]) => {
    dispatch(
      entitiesActions.editActor({
        actorId: id,
        changes: {
          [key]: editValue,
        },
      })
    );
  };

  const onToggleField = (key: keyof Actor) => () => {
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

  if (!scene || !actor) {
    return <WorldEditor />;
  }

  const showDirectionInput =
    spriteSheet &&
    spriteSheet.type !== SPRITE_TYPE_STATIC &&
    spriteSheet.type !== SPRITE_TYPE_ANIMATED &&
    actor.spriteType !== SPRITE_TYPE_STATIC;

  const showFrameInput =
    spriteSheet &&
    spriteSheet.numFrames > 1 &&
    actor.spriteType === SPRITE_TYPE_STATIC;

  const showSpriteTypeSelect =
    spriteSheet &&
    spriteSheet.type !== "static" &&
    spriteSheet.type !== "animated";

  const showAnimatedCheckbox =
    ((actor.animSpeed as unknown) as String) !== "" &&
    spriteSheet &&
    spriteSheet.numFrames > 1 &&
    (actor.spriteType === SPRITE_TYPE_STATIC ||
      spriteSheet.type !== SPRITE_TYPE_ACTOR);

  const showAnimSpeed =
    spriteSheet &&
    (spriteSheet.type === SPRITE_TYPE_ACTOR_ANIMATED ||
      (actor.spriteType === SPRITE_TYPE_STATIC && spriteSheet.numFrames > 1));

  const showCollisionGroup = !actor.isPinned;

  const onEditScript = onChangeScript("script");

  const onEditStartScript = onChangeScript("startScript");

  const onEditUpdateScript = onChangeScript("updateScript");

  const onEditHit1Script = onChangeScript("hit1Script");

  const onEditHit2Script = onChangeScript("hit2Script");

  const onEditHit3Script = onChangeScript("hit3Script");

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

  return (
    <SidebarMultiColumnAuto onClick={selectSidebar}>
      <SidebarColumn>
        <FormContainer>
          <FormHeader>
            <EditableText
              name="name1"
              placeholder={actorName(actor, actorIndex)}
              value={actor.name || ""}
              onChange={onChangeField("name")}
            />
            <DropdownButton
              size="small"
              variant="transparent"
              menuDirection="right"
            >
              <MenuItem>{l10n("MENU_COPY_ACTOR")}</MenuItem>
              <MenuItem>{l10n("MENU_PASTE_ACTOR")}</MenuItem>
            </DropdownButton>
          </FormHeader>

          <FormRow>
            <CoordinateInput
              name="x"
              coordinate="x"
              value={actor.x}
              min={0}
              max={255}
              onChange={onChangeField("x")}
            />
            <CoordinateInput
              name="y"
              coordinate="y"
              value={actor.y}
              min={0}
              max={255}
              onChange={onChangeField("y")}
            />
            <DropdownButton
              menuDirection="right"
              label={<PinIcon />}
              showArrow={false}
              variant={actor.isPinned ? "primary" : "normal"}
              style={{
                padding: 5,
                minWidth: 36,
              }}
            >
              <MenuItem onClick={onToggleField("isPinned")}>
                <Checkbox id="pin" name="pin" checked={actor.isPinned} /> Pin to
                Screen
              </MenuItem>
            </DropdownButton>
          </FormRow>
          <FormDivider />
          <FormRow>
            <SpriteSheetSelectButton
              name="actorSprite"
              value={actor.spriteSheetId}
              direction={actor.direction}
              frame={actor.spriteType === SPRITE_TYPE_STATIC ? actor.frame : 0}
              paletteId={
                colorsEnabled
                  ? actor.paletteId || defaultSpritePaletteId
                  : undefined
              }
              onChange={onChangeString("spriteSheetId")}
              includeInfo
            />
            {colorsEnabled && (
              <PaletteSelectButton
                name="actorPalette"
                type="sprite"
                value={actor.paletteId}
                onChange={onChangeString("paletteId")}
                optional
                optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
                optionalDefaultPaletteId={defaultSpritePaletteId}
              />
            )}
          </FormRow>
          <FormRow>
            {showDirectionInput && (
              <FormField name="actorSprite" label={l10n("FIELD_DIRECTION")}>
                <DirectionPicker
                  id="actorDirection"
                  value={actor.direction}
                  onChange={onChangeField("direction")}
                />
              </FormField>
            )}
            {showFrameInput && (
              <NumberField
                name="frame"
                label={l10n("FIELD_INITIAL_FRAME")}
                placeholder="0"
              />
            )}
            {showSpriteTypeSelect && (
              <FormField name="spriteType" label={l10n("FIELD_ACTOR_TYPE")}>
                <SpriteTypeSelect
                  name="actorMovement"
                  value={actor.spriteType}
                  onChange={onChangeString("spriteType")}
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
                onChange={onChangeField("animate")}
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
                onChange={onChangeNumber("moveSpeed")}
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
                  // onChange={onChangeNumber("animSpeed")}
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
                    onChange={onChangeField("collisionGroup")}
                  />
                </FormField>
              </FormRow>
            </>
          )}
        </FormContainer>
      </SidebarColumn>
      <SidebarColumn>
        <SidebarTabs
          value={scriptMode}
          values={actor.collisionGroup ? collisionTabs : defaultTabs}
          onChange={onChangeScriptMode}
          buttons={
            scriptMode !== "hit" &&
            scripts[scriptMode] && (
              <ScriptEditorDropdownButton
                value={scripts[scriptMode].value}
                onChange={scripts[scriptMode].onChange}
              />
            )
          }
        />
        {scriptMode === "hit" && (
          <SidebarTabs
            secondary
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
