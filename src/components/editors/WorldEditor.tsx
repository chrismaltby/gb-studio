/* eslint-disable jsx-a11y/label-has-for */
import React, { FC, useState } from "react";
import PropTypes from "prop-types";
import { connect, useDispatch, useSelector } from "react-redux";
import { SceneSelect } from "../forms/SceneSelect";
import DirectionPicker from "../forms/DirectionPicker";
import SpriteSheetSelect from "../forms/SpriteSheetSelectOld";
import castEventValue from "../../lib/helpers/castEventValue";
import l10n from "../../lib/helpers/l10n";
import { MovementSpeedSelect } from "../forms/MovementSpeedSelect";
import { AnimationSpeedSelect } from "../forms/AnimationSpeedSelect";
import { SidebarHeading } from "./Sidebar";
import { SettingsShape, ProjectMetadataShape } from "../../store/stateShape";
import { DMG_PALETTE } from "../../consts";
import PaletteSelect from "../forms/PaletteSelectOld";
import settingsActions from "../../store/features/settings/settingsActions";
import metadataActions from "../../store/features/metadata/metadataActions";
import { sceneSelectors } from "../../store/features/entities/entitiesState";
import editorActions from "../../store/features/editor/editorActions";
import entitiesActions from "../../store/features/entities/entitiesActions";
import navigationActions from "../../store/features/navigation/navigationActions";
import { SidebarColumn, SidebarMultiColumnAuto } from "../ui/sidebars/Sidebar";
import {
  FormContainer,
  FormDivider,
  FormField,
  FormHeader,
  FormRow,
  FormSectionTitle,
} from "../ui/form/FormLayout";
import { RootState } from "../../store/configureStore";
import { EditableText } from "../ui/form/EditableText";
import { DropdownButton } from "../ui/buttons/DropdownButton";
import { MenuItem } from "../ui/menu/Menu";
import { MetadataState } from "../../store/features/metadata/metadataState";
import { CoordinateInput } from "../ui/form/CoordinateInput";
import { SettingsState } from "../../store/features/settings/settingsState";
import { Label } from "../ui/form/Label";
import { NoteField } from "../ui/form/NoteField";
import { TextField } from "../ui/form/TextField";
import { SpriteSheetSelectButton } from "../forms/SpriteSheetSelectButton";
import { PaletteSelectButton } from "../forms/PaletteSelectButton";
import { CheckboxField } from "../ui/form/CheckboxField";
import { Button } from "../ui/buttons/Button";

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
  const defaultSpritePaletteId = useSelector(
    (state: RootState) =>
      state.project.present.settings.defaultSpritePaletteId || DMG_PALETTE.id
  );
  const colorsEnabled = useSelector(
    (state: RootState) => state.project.present.settings.customColorsEnabled
  );
  const [notesOpen, setNotesOpen] = useState<boolean>(!!metadata.notes);

  const dispatch = useDispatch();

  const selectSidebar = () => {
    dispatch(editorActions.selectSidebar());
  };

  const onAddNotes = () => {
    setNotesOpen(true);
  };

  const onChangeMetadataInput = (key: keyof MetadataState) => (
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

  const onChangeSettingsInput = (key: keyof SettingsState) => (
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

  const onChangeSettingsField = <T extends keyof SettingsState>(key: T) => (
    editValue: SettingsState[T]
  ) => {
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
    <SidebarMultiColumnAuto onClick={selectSidebar}>
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
    </SidebarMultiColumnAuto>
  );
};

/*
const WorldEditor = ({
  metadata,
  settings,
  selectSidebar,
  addCustomEvent,
  colorsEnabled,
  scenesLength,
  editProjectSettings,
  editProject,
}) => {
  const { name, author, notes } = metadata;
  const {
    startSceneId,
    playerPaletteId,
    playerSpriteSheetId,
    startDirection,
    startAnimSpeed,
    startMoveSpeed,
    startX,
    startY,
    defaultSpritePaletteId,
  } = settings;

  const onEditSetting = (key) => (e) => {
    editProjectSettings({
      [key]: castEventValue(e),
    });
  };

  const onEditProject = (key) => (e) => {
    editProject({
      [key]: castEventValue(e),
    });
  };

  return (
    <SidebarMultiColumnAuto onClick={selectSidebar}>
      <SidebarColumn>
        <SidebarHeading title={l10n("PROJECT")} />

        <div>
          <FormField>
            <label htmlFor="projectName">
              {l10n("FIELD_NAME")}
              <input
                id="projectName"
                value={name || ""}
                placeholder="Project Name"
                onChange={onEditProject("name")}
              />
            </label>
          </FormField>

          <FormField>
            <label htmlFor="projectAuthor">
              {l10n("FIELD_AUTHOR")}
              <input
                id="projectAuthor"
                value={author || ""}
                placeholder="Author"
                onChange={onEditProject("author")}
              />
            </label>
          </FormField>

          <ToggleableFormField
            htmlFor="projectNotes"
            closedLabel={l10n("FIELD_ADD_NOTES")}
            label={l10n("FIELD_NOTES")}
            open={!!notes}
          >
            <textarea
              id="projectNotes"
              value={notes || ""}
              placeholder={l10n("FIELD_NOTES")}
              onChange={onEditProject("notes")}
              rows={3}
            />
          </ToggleableFormField>
        </div>
      </SidebarColumn>

      {scenesLength > 0 && (
        <SidebarColumn>
          <SidebarHeading title={l10n("SIDEBAR_STARTING_SCENE")} />

          <FormField>
            <SceneSelect
              id="startScene"
              value={startSceneId || ""}
              onChange={onEditSetting("startSceneId")}
            />
          </FormField>

          <FormField>
            <label htmlFor="playerSprite">
              {l10n("FIELD_PLAYER_SPRITE_SHEET")}
              <SpriteSheetSelect
                id="playerSprite"
                value={playerSpriteSheetId}
                direction={startDirection}
                onChange={onEditSetting("playerSpriteSheetId")}
              />
            </label>
          </FormField>

          {colorsEnabled && (
            <ToggleableFormField
              htmlFor="playerPalette"
              closedLabel={l10n("FIELD_PLAYER_PALETTE")}
              label={l10n("FIELD_PLAYER_PALETTE")}
              open={!!playerPaletteId}
            >
              <PaletteSelect
                id="playerPalette"
                value={playerPaletteId || ""}
                optional
                optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
                optionalDefaultPaletteId={defaultSpritePaletteId || ""}
                onChange={onEditSetting("playerPaletteId")}
              />
            </ToggleableFormField>
          )}

          <FormField halfWidth>
            <label htmlFor="startX">
              {l10n("FIELD_X")}
              <input
                id="startX"
                type="number"
                value={startX}
                min={0}
                max={30}
                placeholder={0}
                onChange={onEditSetting("startX")}
              />
            </label>
          </FormField>

          <FormField halfWidth>
            <label htmlFor="startY">
              {l10n("FIELD_Y")}
              <input
                id="startY"
                type="number"
                value={startY}
                min={0}
                max={31}
                placeholder={0}
                onChange={onEditSetting("startY")}
              />
            </label>
          </FormField>

          <FormField>
            <label htmlFor="startDirection">
              {l10n("FIELD_DIRECTION")}
              <DirectionPicker
                id="startDirection"
                value={startDirection || 0}
                onChange={onEditSetting("startDirection")}
              />
            </label>
          </FormField>

          <FormField halfWidth>
            <label htmlFor="startMoveSpeed">
              {l10n("FIELD_MOVEMENT_SPEED")}
              <MovementSpeedSelect
                id="startMoveSpeed"
                value={startMoveSpeed}
                onChange={onEditSetting("startMoveSpeed")}
              />
            </label>
          </FormField>

          <FormField halfWidth>
            <label htmlFor="startAnimSpeed">
              {l10n("FIELD_ANIMATION_SPEED")}
              <AnimationSpeedSelect
                id="startAnimSpeed"
                value={startAnimSpeed}
                onChange={onEditSetting("startAnimSpeed")}
              />
            </label>
          </FormField>
        </SidebarColumn>
      )}
    </SidebarMultiColumnAuto>
  );
};

// WorldEditor.propTypes = {
//   metadata: ProjectMetadataShape.isRequired,
//   scenesLength: PropTypes.number.isRequired,
//   settings: SettingsShape.isRequired,
//   defaultSpritePaletteId: PropTypes.string.isRequired,
//   colorsEnabled: PropTypes.bool.isRequired,
//   editProject: PropTypes.func.isRequired,
//   editProjectSettings: PropTypes.func.isRequired,
//   selectSidebar: PropTypes.func.isRequired,
//   addCustomEvent: PropTypes.func.isRequired,
// };

function mapStateToProps(state) {
  const metadata = state.project.present.metadata;
  const settings = state.project.present.settings;
  const colorsEnabled = settings.customColorsEnabled;
  const defaultSpritePaletteId =
    settings.defaultSpritePaletteId || DMG_PALETTE.id;
  const scenesLength = sceneSelectors.selectTotal(state);
  return {
    metadata,
    scenesLength,
    settings,
    colorsEnabled,
    defaultSpritePaletteId,
  };
}

const mapDispatchToProps = {
  selectSidebar: editorActions.selectSidebar,
  editProject: metadataActions.editMetadata,
  editProjectSettings: settingsActions.editSettings,
  addCustomEvent: entitiesActions.addCustomEvent,
};

export default connect(mapStateToProps, mapDispatchToProps)(WorldEditor);

*/
