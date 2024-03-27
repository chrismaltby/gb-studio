/* eslint-disable jsx-a11y/label-has-for */
import React, { FC, useCallback, useState } from "react";
import { SceneSelect } from "components/forms/SceneSelect";
import DirectionPicker from "components/forms/DirectionPicker";
import {
  castEventToBool,
  castEventToInt,
} from "renderer/lib/helpers/castEventValue";
import { MovementSpeedSelect } from "components/forms/MovementSpeedSelect";
import { AnimationSpeedSelect } from "components/forms/AnimationSpeedSelect";
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
import l10n from "shared/lib/lang/l10n";
import { ActorDirection } from "shared/lib/entities/entitiesTypes";
import { useAppDispatch, useAppSelector } from "store/hooks";

export const WorldEditor: FC = () => {
  const metadata = useAppSelector((state) => state.project.present.metadata);
  const settings = useAppSelector((state) => state.project.present.settings);
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, settings.startSceneId)
  );
  const [notesOpen, setNotesOpen] = useState<boolean>(!!metadata.notes);

  const dispatch = useAppDispatch();

  const selectSidebar = useCallback(() => {
    dispatch(editorActions.selectSidebar());
  }, [dispatch]);

  const onAddNotes = useCallback(() => {
    setNotesOpen(true);
  }, []);

  const onChangeMetadataProp = useCallback(
    <T extends keyof MetadataState>(key: T, value: MetadataState[T]) => {
      dispatch(
        metadataActions.editMetadata({
          [key]: value,
        })
      );
    },
    [dispatch]
  );

  const onChangeSettingProp = useCallback(
    <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
      dispatch(
        settingsActions.editSettings({
          [key]: value,
        })
      );
    },
    [dispatch]
  );

  const onChangeName = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeMetadataProp("name", e.currentTarget.value),
    [onChangeMetadataProp]
  );

  const onChangeNotes = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeMetadataProp("notes", e.currentTarget.value),
    [onChangeMetadataProp]
  );

  const onChangeAuthor = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeMetadataProp("author", e.currentTarget.value),
    [onChangeMetadataProp]
  );

  const onChangeStartSceneId = useCallback(
    (sceneId: string) => onChangeSettingProp("startSceneId", sceneId),
    [onChangeSettingProp]
  );

  const onChangeStartX = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSettingProp("startX", castEventToInt(e, 0)),
    [onChangeSettingProp]
  );

  const onChangeStartY = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSettingProp("startY", castEventToInt(e, 0)),
    [onChangeSettingProp]
  );

  const onChangeStartDirection = useCallback(
    (e: ActorDirection) => onChangeSettingProp("startDirection", e),
    [onChangeSettingProp]
  );

  const onChangeStartMoveSpeed = useCallback(
    (e: number) => onChangeSettingProp("startMoveSpeed", e),
    [onChangeSettingProp]
  );

  const onChangeStartAnimSpeed = useCallback(
    (e: number | null) => onChangeSettingProp("startAnimSpeed", e),
    [onChangeSettingProp]
  );

  const onChangeColorsEnabled = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSettingProp("colorMode", castEventToBool(e) ? "mixed" : "mono"),
    [onChangeSettingProp]
  );

  const onOpenSettings = useCallback(() => {
    dispatch(navigationActions.setSection("settings"));
  }, [dispatch]);

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
              onChange={onChangeName}
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
                value={metadata.notes || ""}
                onChange={onChangeNotes}
              />
            </FormRow>
          )}

          <FormRow>
            <TextField
              name="author"
              label={l10n("FIELD_AUTHOR")}
              value={metadata.author || ""}
              onChange={onChangeAuthor}
            />
          </FormRow>

          <FormDivider />

          <FormRow>
            <CheckboxField
              name="colorsEnabled"
              label={l10n("FIELD_EXPORT_IN_COLOR")}
              checked={settings.colorMode !== "mono"}
              onChange={onChangeColorsEnabled}
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
                onChange={onChangeStartSceneId}
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
              onChange={onChangeStartX}
            />
            <CoordinateInput
              name="startY"
              coordinate="y"
              value={settings.startY}
              placeholder="0"
              min={0}
              max={scene ? scene.height - 1 : 0}
              onChange={onChangeStartY}
            />
          </FormRow>

          <FormRow>
            <FormField name="startDirection" label={l10n("FIELD_DIRECTION")}>
              <DirectionPicker
                id="startDirection"
                value={settings.startDirection}
                onChange={onChangeStartDirection}
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
                onChange={onChangeStartMoveSpeed}
              />
            </FormField>

            <FormField
              name="startAnimSpeed"
              label={l10n("FIELD_ANIMATION_SPEED")}
            >
              <AnimationSpeedSelect
                name="startAnimSpeed"
                value={settings.startAnimSpeed}
                onChange={onChangeStartAnimSpeed}
              />
            </FormField>
          </FormRow>
        </FormContainer>
      </SidebarColumn>
    </Sidebar>
  );
};
