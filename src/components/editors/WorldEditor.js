/* eslint-disable jsx-a11y/label-has-for */
import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import SceneSelect from "../forms/SceneSelect";
import DirectionPicker from "../forms/DirectionPicker";
import SpriteSheetSelect from "../forms/SpriteSheetSelectOld";
import { FormField, ToggleableFormField } from "../library/Forms";
import castEventValue from "../../lib/helpers/castEventValue";
import l10n from "../../lib/helpers/l10n";
import { MovementSpeedSelect } from "../forms/MovementSpeedSelect";
import { AnimationSpeedSelect } from "../forms/AnimationSpeedSelect";
import { SidebarHeading } from "./Sidebar";
import {
  SettingsShape,
  ProjectMetadataShape,
} from "../../store/stateShape";
import { DMG_PALETTE } from "../../consts";
import PaletteSelect from "../forms/PaletteSelectOld";
import settingsActions from "../../store/features/settings/settingsActions";
import metadataActions from "../../store/features/metadata/metadataActions";
import { sceneSelectors } from "../../store/features/entities/entitiesState";
import editorActions from "../../store/features/editor/editorActions";
import entitiesActions from "../../store/features/entities/entitiesActions";
import { SidebarColumn, SidebarMultiColumnAuto } from "../ui/sidebars/Sidebar";

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
