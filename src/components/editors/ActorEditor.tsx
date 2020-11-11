import React, {
  FC,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  globalVariableCode,
  globalVariableDefaultName,
} from "../../lib/helpers/variables";
import { RootState } from "../../store/configureStore";
import {
  actorSelectors,
  sceneSelectors,
  triggerSelectors,
  variableSelectors,
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
import { MenuDivider, MenuItem } from "../ui/menu/Menu";
import entitiesActions from "../../store/features/entities/entitiesActions";
import editorActions from "../../store/features/editor/editorActions";
import clipboardActions from "../../store/features/clipboard/clipboardActions";
import {
  isVariableField,
  walkActorEvents,
  walkSceneEvents,
  walkTriggerEvents,
} from "../../lib/helpers/eventSystem";
import {
  Actor,
  Scene,
  ScriptEvent,
  Trigger,
} from "../../store/features/entities/entitiesTypes";
import l10n from "../../lib/helpers/l10n";
import events from "../../lib/events";
import { Sidebar, SidebarColumn } from "../ui/sidebars/Sidebar";
import { FlatList } from "../ui/lists/FlatList";
import { EntityListItem } from "../ui/lists/EntityListItem";
import { Dictionary } from "@reduxjs/toolkit";
import useDimensions from "react-cool-dimensions";
import styled from "styled-components";
import { SplitPaneHeader } from "../ui/splitpane/SplitPaneHeader";
import { CoordinateInput } from "../ui/form/CoordinateInput";
import { Checkbox } from "../ui/form/Checkbox";
import { PinIcon } from "../ui/icons/Icons";
import castEventValue from "../../lib/helpers/castEventValue";
import { TextField } from "../ui/form/TextField";
import { NumberField } from "../ui/form/NumberField";
import { Select } from "../ui/form/Select";
import { SelectField } from "../ui/form/SelectField";
import { CheckboxField } from "../ui/form/CheckboxField";
import SpriteSheetSelect from "../forms/SpriteSheetSelect";
import MovementSpeedSelect from "../forms/MovementSpeedSelect";
import DirectionPicker from "../forms/DirectionPicker";
import { PaletteSelect } from "../forms/PaletteSelect";
import { PaletteSelectButton } from "../forms/PaletteSelectButton";
import { DMG_PALETTE } from "../../consts";

interface ActorEditorProps {
  id: string;
  sceneId: string;
}

type VariableUse = {
  id: string;
  name: string;
  sceneId: string;
  scene: Scene;
  sceneIndex: number;
  event: ScriptEvent;
} & (
  | {
      type: "scene";
    }
  | {
      type: "actor";
      actor: Actor;
      actorIndex: number;
      scene: Scene;
      sceneIndex: number;
    }
  | {
      type: "trigger";
      trigger: Trigger;
      triggerIndex: number;
      scene: Scene;
      sceneIndex: number;
    }
);

const eventName = (event: ScriptEvent) => {
  const localisedCommand = l10n(event.command);
  return localisedCommand !== event.command
    ? localisedCommand
    : events[event.command]?.name || event.command;
};

const sceneName = (scene: Scene, sceneIndex: number) =>
  scene.name ? scene.name : `Scene ${sceneIndex + 1}`;

const actorName = (actor: Actor, actorIndex: number) =>
  actor.name ? actor.name : `Actor ${actorIndex + 1}`;

const triggerName = (trigger: Trigger, triggerIndex: number) =>
  trigger.name ? trigger.name : `Trigger ${triggerIndex + 1}`;

const onVariableEventContainingId = (
  id: string,
  callback: (event: ScriptEvent) => void
) => (event: ScriptEvent) => {
  if (event.args) {
    for (let arg in event.args) {
      if (isVariableField(event.command, arg, event.args)) {
        const argValue = event.args[arg];
        if (
          argValue === id ||
          (argValue?.type === "variable" && argValue?.value === id)
        ) {
          callback(event);
        }
      }
    }
  }
};

const UsesWrapper = styled.div`
  position: absolute;
  top: 38px;
  left: 0;
  bottom: 0;
  right: 0;
`;

const UseMessage = styled.div`
  padding: 5px 10px;
  font-size: 11px;
`;

export const ActorEditor: FC<ActorEditorProps> = ({ id, sceneId }) => {
  const actor = useSelector((state: RootState) =>
    actorSelectors.selectById(state, id)
  );
  const scene = useSelector((state: RootState) =>
    sceneSelectors.selectById(state, sceneId)
  );
  const defaultSpritePaletteId = useSelector(
    (state: RootState) =>
      state.project.present.settings.defaultSpritePaletteId || DMG_PALETTE.id
  );
  const actorIndex = scene?.actors.indexOf(id) || 0;

  const dispatch = useDispatch();

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
    return <Sidebar onClick={selectSidebar}>None</Sidebar>;
  }

  return (
    <Sidebar onClick={selectSidebar}>
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
            <FormField name="actorSprite" label={l10n("FIELD_SPRITE_SHEET")}>
              <SpriteSheetSelect
                id="actorSprite"
                value={actor.spriteSheetId}
                direction={actor.direction}
                frame={
                  0
                  // spriteSheet &&
                  // spriteSheet.numFrames > 1 &&
                  // actor.spriteType === SPRITE_TYPE_STATIC
                  //   ? actor.frame
                  //   : 0
                }
                onChange={onChangeField("spriteSheetId")}
              />
            </FormField>
            <FormField name="actorSprite" label={l10n("FIELD_PALETTE")}>
              <PaletteSelect
                name="actorPalette"
                value={actor.paletteId}
                onChange={onChangeString("paletteId")}
                optional
                optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
                optionalDefaultPaletteId={defaultSpritePaletteId}
              />
            </FormField>
            {/* <FormField name="actorSprite" label={l10n("FIELD_DIRECTION")}>
              <DirectionPicker
                id="actorDirection"
                value={actor.direction}
                onChange={onChangeField("direction")}
              />
            </FormField> */}
          </FormRow>

          <FormRow>
            <PaletteSelectButton
              name="actorPalette"
              type="sprite"
              value={actor.paletteId}
              onChange={onChangeString("paletteId")}
              optional
              optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
              optionalDefaultPaletteId={defaultSpritePaletteId}
            />
          </FormRow>
          <FormRow>
            <NumberField
              name="frame"
              label={l10n("FIELD_INITIAL_FRAME")}
              placeholder="0"
            />
            <SelectField
              name="spriteType"
              label={l10n("FIELD_ACTOR_TYPE")}
              options={[
                { value: "static", label: l10n("FIELD_MOVEMENT_STATIC") },
                { value: "actor", label: l10n("ACTOR") },
              ]}
              value={{ value: "actor", label: l10n("ACTOR") }}
            />
          </FormRow>
          <FormRow>
            <CheckboxField
              name="animated"
              label={l10n("FIELD_ANIMATE_WHEN_STATIONARY")}
              checked={actor.animate}
              onChange={onChangeField("animate")}
            />
          </FormRow>

          <FormDivider />
          <FormRow>
            <SelectField
              name="spriteType"
              label={l10n("FIELD_ACTOR_TYPE")}
              options={[
                { value: "static", label: l10n("FIELD_MOVEMENT_STATIC") },
                { value: "actor", label: l10n("ACTOR") },
              ]}
              value={{ value: "actor", label: l10n("ACTOR") }}
            />
            <SelectField
              name="spriteType"
              label={l10n("FIELD_ACTOR_TYPE")}
              options={[
                { value: "static", label: l10n("FIELD_MOVEMENT_STATIC") },
                { value: "actor", label: l10n("ACTOR") },
              ]}
              value={{ value: "actor", label: l10n("ACTOR") }}
            />
          </FormRow>
          <FormDivider />
          <FormRow>
            <SelectField
              name="spriteType"
              label={l10n("FIELD_ACTOR_TYPE")}
              options={[
                { value: "static", label: l10n("FIELD_MOVEMENT_STATIC") },
                { value: "actor", label: l10n("ACTOR") },
              ]}
              value={{ value: "actor", label: l10n("ACTOR") }}
            />
          </FormRow>
        </FormContainer>
      </SidebarColumn>
    </Sidebar>
  );
};
