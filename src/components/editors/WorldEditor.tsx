/* eslint-disable jsx-a11y/label-has-for */
import React, { FC, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SceneSelect } from "../forms/SceneSelect";
import DirectionPicker from "../forms/DirectionPicker";
import castEventValue from "lib/helpers/castEventValue";
import l10n from "lib/helpers/l10n";
import { MovementSpeedSelect } from "../forms/MovementSpeedSelect";
import { AnimationSpeedSelect } from "../forms/AnimationSpeedSelect";
import settingsActions from "store/features/settings/settingsActions";
import metadataActions from "store/features/metadata/metadataActions";
import { sceneSelectors } from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import navigationActions from "store/features/navigation/navigationActions";
import { SidebarColumn, Sidebar } from "ui/sidebars/Sidebar";
import {
  FormContainer,
  FormDivider,
  FormField,
  FormHeader,
  FormRow,
} from "ui/form/FormLayout";
import { RootState } from "store/configureStore";
import { EditableText } from "ui/form/EditableText";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuItem } from "ui/menu/Menu";
import { MetadataState } from "store/features/metadata/metadataState";
import { CoordinateInput } from "ui/form/CoordinateInput";
import { SettingsState } from "store/features/settings/settingsState";
import { Label } from "ui/form/Label";
import { NoteField } from "ui/form/NoteField";
import { TextField } from "ui/form/TextField";
import { CheckboxField } from "ui/form/CheckboxField";
import { Button } from "ui/buttons/Button";

export const WorldEditor: FC = () => {
  const metadata = useSelector(
    (state: RootState) => state.project.present.metadata
  );
  const settings = useSelector(
    (state: RootState) => state.project.present.settings
  );
  const scene = useSelector((state: RootState) =>
    sceneSelectors.selectById(state, settings.startSceneId)
  );
  const [notesOpen, setNotesOpen] = useState<boolean>(!!metadata.notes);

  const dispatch = useDispatch();

  const selectSidebar = () => {
    dispatch(editorActions.selectSidebar());
  };

  const onAddNotes = () => {
    setNotesOpen(true);
  };

  const onChangeMetadataInput =
    (key: keyof MetadataState) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      const editValue = castEventValue(e);
      dispatch(
        metadataActions.editMetadata({
          [key]: editValue,
        })
      );
    };

  const onChangeSettingsInput =
    (key: keyof SettingsState) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
        | string
        | number
    ) => {
      const editValue = castEventValue(e);
      dispatch(
        settingsActions.editSettings({
          [key]: editValue,
        })
      );
    };

  const onChangeSettingsField =
    <T extends keyof SettingsState>(key: T) =>
    (editValue: SettingsState[T]) => {
      dispatch(
        settingsActions.editSettings({
          [key]: editValue,
        })
      );
    };

  const onOpenSettings = () => {
    dispatch(navigationActions.setSection("settings"));
  };

  const showNotes = metadata.notes || notesOpen;

  return (
    <Sidebar onClick={selectSidebar}>
      <SidebarColumn>
        <FormContainer>
          <FormHeader>
            <EditableText
              name="name"
              placeholder={l10n("FIELD_PROJECT_NAME")}
              value={metadata.name || ""}
              onChange={onChangeMetadataInput("name")}
            />
            {!showNotes && (
              <DropdownButton
                size="small"
                variant="transparent"
                menuDirection="right"
              >
                <MenuItem onClick={onAddNotes}>
                  {l10n("FIELD_ADD_NOTES")}
                </MenuItem>
              </DropdownButton>
            )}
          </FormHeader>

          {showNotes && (
            <FormRow>
              <NoteField
                autofocus
                value={metadata.notes || ""}
                onChange={onChangeMetadataInput("notes")}
              />
            </FormRow>
          )}

          <FormRow>
            <TextField
              name="author"
              label={l10n("FIELD_AUTHOR")}
              value={metadata.author || ""}
              onChange={onChangeMetadataInput("author")}
            />
          </FormRow>

          <FormDivider />

          <FormRow>
            <CheckboxField
              name="customColorsEnabled"
              label={l10n("FIELD_EXPORT_IN_COLOR")}
              checked={settings.customColorsEnabled}
              onChange={onChangeSettingsInput("customColorsEnabled")}
            />
            <Button onClick={onOpenSettings}>
              {l10n("FIELD_MORE_SETTINGS")}
            </Button>
          </FormRow>

          <FormDivider />

          <FormRow>
            <FormField name="startScene" label={l10n("SIDEBAR_STARTING_SCENE")}>
              <SceneSelect
                name="startScene"
                value={settings.startSceneId || ""}
                onChange={onChangeSettingsInput("startSceneId")}
              />
            </FormField>
          </FormRow>

          <FormRow>
            <Label htmlFor="startX">{l10n("FIELD_START_POSITION")}</Label>
          </FormRow>

          <FormRow>
            <CoordinateInput
              name="startX"
              coordinate="x"
              value={settings.startX}
              placeholder="0"
              min={0}
              max={scene ? scene.width - 2 : 0}
              onChange={onChangeSettingsInput("startX")}
            />
            <CoordinateInput
              name="startY"
              coordinate="y"
              value={settings.startY}
              placeholder="0"
              min={0}
              max={scene ? scene.height - 1 : 0}
              onChange={onChangeSettingsInput("startY")}
            />
          </FormRow>

          <FormRow>
            <FormField name="startDirection" label={l10n("FIELD_DIRECTION")}>
              <DirectionPicker
                id="startDirection"
                value={settings.startDirection}
                onChange={onChangeSettingsInput("startDirection")}
              />
            </FormField>
          </FormRow>

          <FormRow>
            <FormField
              name="startMoveSpeed"
              label={l10n("FIELD_MOVEMENT_SPEED")}
            >
              <MovementSpeedSelect
                name="startMoveSpeed"
                value={settings.startMoveSpeed}
                onChange={onChangeSettingsField("startMoveSpeed")}
              />
            </FormField>

            <FormField
              name="startAnimSpeed"
              label={l10n("FIELD_ANIMATION_SPEED")}
            >
              <AnimationSpeedSelect
                name="startAnimSpeed"
                value={settings.startAnimSpeed}
                onChange={onChangeSettingsField("startAnimSpeed")}
              />
            </FormField>
          </FormRow>
        </FormContainer>
      </SidebarColumn>
    </Sidebar>
  );
};
