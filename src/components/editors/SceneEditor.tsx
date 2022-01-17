import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ScriptEditor from "../script/ScriptEditor";
import castEventValue from "lib/helpers/castEventValue";
import l10n from "lib/helpers/l10n";
import { WorldEditor } from "./WorldEditor";
import ScriptEditorDropdownButton from "../script/ScriptEditorDropdownButton";
import BackgroundWarnings from "../world/BackgroundWarnings";
import { sceneSelectors } from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import entitiesActions from "store/features/entities/entitiesActions";
import settingsActions from "store/features/settings/settingsActions";
import { Sidebar, SidebarColumn } from "ui/sidebars/Sidebar";
import {
  FormContainer,
  FormDivider,
  FormField,
  FormHeader,
  FormRow,
} from "ui/form/FormLayout";
import { EditableText } from "ui/form/EditableText";
import { RootState } from "store/configureStore";
import { Scene, ScriptEvent } from "store/features/entities/entitiesTypes";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { NoteField } from "ui/form/NoteField";
import { SceneTypeSelect } from "../forms/SceneTypeSelect";
import { BackgroundSelectButton } from "../forms/BackgroundSelectButton";
import { PaletteSelectButton } from "../forms/PaletteSelectButton";
import { LabelButton, LabelColor } from "ui/buttons/LabelButton";
import { CoordinateInput } from "ui/form/CoordinateInput";
import DirectionPicker from "../forms/DirectionPicker";
import { SettingsState } from "store/features/settings/settingsState";
import { StickyTabs, TabBar } from "ui/tabs/Tabs";
import { Label } from "ui/form/Label";
import { Button } from "ui/buttons/Button";
import { LockIcon, LockOpenIcon, ParallaxIcon } from "ui/icons/Icons";
import ParallaxSelect, {
  defaultValues as parallaxDefaultValues,
} from "../forms/ParallaxSelect";
import { SpriteSheetSelectButton } from "../forms/SpriteSheetSelectButton";
import styled from "styled-components";
import {
  ClipboardTypePaletteIds,
  ClipboardTypeScenes,
} from "store/features/clipboard/clipboardTypes";
import { SCREEN_WIDTH } from "../../consts";
import { ScriptEventAutoFadeDisabledWarning } from "components/script/ScriptEventAutoFade";

interface SceneEditorProps {
  id: string;
  multiColumn: boolean;
}

interface ScriptHandler {
  value: ScriptEvent[];
  onChange: (newValue: ScriptEvent[]) => void;
}

interface ScriptHandlers {
  start: ScriptHandler;
  hit: {
    hit1: ScriptHandler;
    hit2: ScriptHandler;
    hit3: ScriptHandler;
  };
}

type SceneScriptKey =
  | "script"
  | "playerHit1Script"
  | "playerHit2Script"
  | "playerHit3Script";

const PaletteButtons = styled.div`
  display: flex;
  width: 100%;
  box-sizing: border-box;

  & > * {
    margin-right: 3px;
  }

  & > *:last-child {
    margin-right: 0px;
  }
`;

const scriptTabs = {
  start: l10n("SIDEBAR_ON_INIT"),
  hit: l10n("SIDEBAR_ON_PLAYER_HIT"),
} as const;

const scriptSecondaryTabs = {
  hit1: l10n("FIELD_COLLISION_GROUP_N", { n: 1 }),
  hit2: l10n("FIELD_COLLISION_GROUP_N", { n: 2 }),
  hit3: l10n("FIELD_COLLISION_GROUP_N", { n: 3 }),
} as const;

const getScriptKey = (
  primaryTab: keyof typeof scriptTabs,
  secondaryTab: keyof typeof scriptSecondaryTabs
): SceneScriptKey => {
  if (primaryTab === "start") {
    return "script";
  }
  if (secondaryTab === "hit1") {
    return "playerHit1Script";
  }
  if (secondaryTab === "hit2") {
    return "playerHit2Script";
  }
  if (secondaryTab === "hit3") {
    return "playerHit3Script";
  }
  return "script";
};

const sceneName = (scene: Scene, sceneIndex: number) =>
  scene.name ? scene.name : `Scene ${sceneIndex + 1}`;

export const SceneEditor = ({ id, multiColumn }: SceneEditorProps) => {
  const scene = useSelector((state: RootState) =>
    sceneSelectors.selectById(state, id)
  );
  const sceneIndex = useSelector((state: RootState) =>
    sceneSelectors.selectIds(state).indexOf(id)
  );
  const clipboardFormat = useSelector(
    (state: RootState) => state.clipboard.data?.format
  );
  const [notesOpen, setNotesOpen] = useState<boolean>(!!scene?.notes);
  const colorsEnabled = useSelector(
    (state: RootState) => state.project.present.settings.customColorsEnabled
  );
  const startSceneId = useSelector(
    (state: RootState) => state.project.present.settings.startSceneId
  );
  const startX = useSelector(
    (state: RootState) => state.project.present.settings.startX
  );
  const startY = useSelector(
    (state: RootState) => state.project.present.settings.startY
  );
  const startDirection = useSelector(
    (state: RootState) => state.project.present.settings.startDirection
  );
  const defaultBackgroundPaletteIds = useSelector(
    (state: RootState) =>
      state.project.present.settings.defaultBackgroundPaletteIds || []
  );
  const defaultSpritePaletteIds = useSelector(
    (state: RootState) =>
      state.project.present.settings.defaultSpritePaletteIds || []
  );
  const defaultPlayerSprites = useSelector(
    (state: RootState) => state.project.present.settings.defaultPlayerSprites
  );
  const tabs = Object.keys(scriptTabs);
  const secondaryTabs = Object.keys(scriptSecondaryTabs);

  const lastScriptTab = useSelector(
    (state: RootState) => state.editor.lastScriptTabScene
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
  const lockScriptEditor = useSelector(
    (state: RootState) => state.editor.lockScriptEditor
  );

  const dispatch = useDispatch();

  const onChangeScriptMode = (mode: keyof ScriptHandlers) => {
    setScriptMode(mode);
    dispatch(editorActions.setScriptTabScene(mode));
  };

  const onChangeScriptModeSecondary = (mode: keyof ScriptHandlers["hit"]) => {
    setScriptModeSecondary(mode);
    dispatch(editorActions.setScriptTabSecondary(mode));
  };

  const onChangeField =
    <T extends keyof Scene>(key: T) =>
    (editValue: Scene[T]) => {
      dispatch(
        entitiesActions.editScene({
          sceneId: id,
          changes: {
            [key]: editValue,
          },
        })
      );
    };

  const onChangeFieldInput =
    (key: keyof Scene) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      const editValue = castEventValue(e);
      dispatch(
        entitiesActions.editScene({
          sceneId: id,
          changes: {
            [key]: editValue,
          },
        })
      );
    };

  const onChangeSettingFieldInput =
    (key: keyof SettingsState) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      const editValue = castEventValue(e);
      dispatch(
        settingsActions.editSettings({
          [key]: editValue,
        })
      );
    };

  const selectSidebar = () => {
    dispatch(editorActions.selectSidebar());
  };

  const onCopy = () => {
    if (scene) {
      dispatch(clipboardActions.copyScenes({ sceneIds: [scene.id] }));
    }
  };

  const onPaste = () => {
    dispatch(clipboardActions.pasteClipboardEntity());
  };

  const onRemove = () => {
    if (scene) {
      dispatch(entitiesActions.removeScene({ sceneId: scene.id }));
    }
  };

  const onAddNotes = () => {
    setNotesOpen(true);
  };

  const onToggleLockScriptEditor = () => {
    dispatch(editorActions.setLockScriptEditor(!lockScriptEditor));
  };

  const onToggleParallaxSettings = () => {
    dispatch(
      entitiesActions.editScene({
        sceneId: id,
        changes: {
          parallax: scene?.parallax
            ? undefined
            : parallaxDefaultValues.slice(-2),
        },
      })
    );
  };

  const onFetchClipboard = useCallback(() => {
    dispatch(clipboardActions.fetchClipboard());
  }, [dispatch]);

  const onCopyBackgroundPaletteIds = useCallback(() => {
    if (scene) {
      const paletteIds = Array.from(Array(8).keys()).map(
        (n) => scene.paletteIds[n] || defaultBackgroundPaletteIds[n] || ""
      );
      dispatch(
        clipboardActions.copyPaletteIds({
          paletteIds,
        })
      );
    }
  }, [dispatch, scene, defaultBackgroundPaletteIds]);

  const onCopySpritePaletteIds = useCallback(() => {
    if (scene) {
      const paletteIds = Array.from(Array(8).keys()).map(
        (n) => scene.spritePaletteIds[n] || defaultSpritePaletteIds[n] || ""
      );
      dispatch(
        clipboardActions.copyPaletteIds({
          paletteIds,
        })
      );
    }
  }, [dispatch, scene, defaultSpritePaletteIds]);

  const onPasteBackgroundPaletteIds = useCallback(() => {
    dispatch(
      clipboardActions.pastePaletteIds({
        sceneId: id,
        type: "background",
      })
    );
  }, [dispatch, id]);

  const onPasteSpritePaletteIds = useCallback(() => {
    dispatch(
      clipboardActions.pastePaletteIds({
        sceneId: id,
        type: "sprite",
      })
    );
  }, [dispatch, id]);

  if (!scene) {
    return <WorldEditor />;
  }

  const showNotes = scene.notes || notesOpen;

  const onEditPaletteId = (index: number) => (paletteId: string) => {
    const paletteIds = scene.paletteIds ? [...scene.paletteIds] : [];
    paletteIds[index] = paletteId;
    onChangeField("paletteIds")(paletteIds);
  };

  const onEditSpritePaletteId = (index: number) => (paletteId: string) => {
    const spritePaletteIds = scene.spritePaletteIds
      ? [...scene.spritePaletteIds]
      : [];
    spritePaletteIds[index] = paletteId;
    onChangeField("spritePaletteIds")(spritePaletteIds);
  };

  const isStartingScene = startSceneId === id;

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

  const showParallaxButton = scene.width && scene.width > SCREEN_WIDTH;
  const showParallaxOptions = showParallaxButton && scene.parallax;
  const scriptKey = getScriptKey(scriptMode, scriptModeSecondary);

  const scriptButton = (
    <ScriptEditorDropdownButton
      value={scene[scriptKey]}
      type="scene"
      entityId={scene.id}
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
                placeholder={sceneName(scene, sceneIndex)}
                value={scene.name || ""}
                onChange={onChangeFieldInput("name")}
              />
              {scene.labelColor && <LabelColor color={scene.labelColor} />}
              <DropdownButton
                size="small"
                variant="transparent"
                menuDirection="right"
                onMouseDown={onFetchClipboard}
              >
                <MenuItem style={{ paddingRight: 10, marginBottom: 5 }}>
                  <div style={{ display: "flex" }}>
                    <div style={{ marginRight: 5 }}>
                      <LabelButton
                        onClick={() => onChangeField("labelColor")("")}
                      />
                    </div>
                    {[
                      "red",
                      "orange",
                      "yellow",
                      "green",
                      "blue",
                      "purple",
                      "gray",
                    ].map((color) => (
                      <div
                        key={color}
                        style={{ marginRight: color === "gray" ? 0 : 5 }}
                      >
                        <LabelButton
                          color={color}
                          onClick={() => onChangeField("labelColor")(color)}
                        />
                      </div>
                    ))}
                  </div>
                </MenuItem>
                <MenuDivider />
                {!showNotes && (
                  <MenuItem onClick={onAddNotes}>
                    {l10n("FIELD_ADD_NOTES")}
                  </MenuItem>
                )}
                <MenuItem onClick={onCopy}>{l10n("MENU_COPY_SCENE")}</MenuItem>
                {clipboardFormat === ClipboardTypeScenes && (
                  <MenuItem onClick={onPaste}>
                    {l10n("MENU_PASTE_SCENE")}
                  </MenuItem>
                )}
                <MenuDivider />
                {colorsEnabled && (
                  <MenuItem onClick={onCopyBackgroundPaletteIds}>
                    {l10n("FIELD_COPY_BACKGROUND_PALETTES")}
                  </MenuItem>
                )}
                {colorsEnabled && (
                  <MenuItem onClick={onCopySpritePaletteIds}>
                    {l10n("FIELD_COPY_SPRITE_PALETTES")}
                  </MenuItem>
                )}
                {colorsEnabled &&
                  clipboardFormat === ClipboardTypePaletteIds && (
                    <MenuItem onClick={onPasteBackgroundPaletteIds}>
                      {l10n("FIELD_PASTE_BACKGROUND_PALETTES")}
                    </MenuItem>
                  )}
                {colorsEnabled &&
                  clipboardFormat === ClipboardTypePaletteIds && (
                    <MenuItem onClick={onPasteSpritePaletteIds}>
                      {l10n("FIELD_PASTE_SPRITE_PALETTES")}
                    </MenuItem>
                  )}
                {colorsEnabled && <MenuDivider />}
                <MenuItem onClick={onRemove}>
                  {l10n("MENU_DELETE_SCENE")}
                </MenuItem>
              </DropdownButton>
            </FormHeader>

            {showNotes && (
              <FormRow>
                <NoteField
                  autofocus
                  value={scene.notes || ""}
                  onChange={onChangeFieldInput("notes")}
                />
              </FormRow>
            )}

            <FormRow>
              <FormField name="type" label={l10n("FIELD_TYPE")}>
                <SceneTypeSelect
                  name="type"
                  value={scene.type}
                  onChange={onChangeField("type")}
                />
              </FormField>
            </FormRow>

            <FormRow>
              <FormField name="backgroundId" label={l10n("FIELD_BACKGROUND")}>
                <div style={{ display: "flex" }}>
                  <BackgroundSelectButton
                    name="backgroundId"
                    value={scene.backgroundId}
                    onChange={onChangeField("backgroundId")}
                    is360={scene.type === "LOGO"}
                    includeInfo
                  />
                  {showParallaxButton && (
                    <Button
                      style={{
                        padding: "5px 0",
                        minWidth: 28,
                        marginLeft: 10,
                      }}
                      variant={scene?.parallax ? "primary" : undefined}
                      onClick={onToggleParallaxSettings}
                      title={l10n("FIELD_PARALLAX")}
                    >
                      <ParallaxIcon />
                    </Button>
                  )}
                </div>
              </FormField>
            </FormRow>

            <FormRow>
              <BackgroundWarnings id={scene.backgroundId} />
            </FormRow>

            {showParallaxOptions && (
              <FormRow>
                <FormField name="parallax" label={l10n("FIELD_PARALLAX")}>
                  <ParallaxSelect
                    name="parallax"
                    value={scene.parallax}
                    sceneHeight={scene.height}
                    onChange={onChangeField("parallax")}
                  />
                </FormField>
              </FormRow>
            )}

            <FormDivider />

            {colorsEnabled && (
              <>
                <FormRow>
                  <FormField
                    name="playerSpriteSheetId"
                    label={l10n("FIELD_SCENE_BACKGROUND_PALETTES")}
                  >
                    <PaletteButtons>
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                        <PaletteSelectButton
                          key={index}
                          name={`scenePalette${index}`}
                          value={
                            (scene.paletteIds && scene.paletteIds[index]) || ""
                          }
                          onChange={onEditPaletteId(index)}
                          slotNumber={index + 1}
                          optional
                          optionalDefaultPaletteId={
                            defaultBackgroundPaletteIds[index] || ""
                          }
                          optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
                        />
                      ))}
                    </PaletteButtons>
                  </FormField>
                </FormRow>

                <FormRow>
                  <FormField
                    name="playerSpriteSheetId"
                    label={l10n("FIELD_SCENE_SPRITE_PALETTES")}
                  >
                    <PaletteButtons>
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                        <PaletteSelectButton
                          key={index}
                          name={`scenePalette${index}`}
                          type="sprite"
                          value={
                            (scene.spritePaletteIds &&
                              scene.spritePaletteIds[index]) ||
                            ""
                          }
                          slotNumber={index + 1}
                          onChange={onEditSpritePaletteId(index)}
                          optional
                          optionalDefaultPaletteId={
                            defaultSpritePaletteIds[index] || ""
                          }
                          optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
                        />
                      ))}
                    </PaletteButtons>
                  </FormField>
                </FormRow>

                <FormDivider />
              </>
            )}

            <FormRow>
              <FormField
                name="playerSpriteSheetId"
                label={l10n("FIELD_PLAYER_SPRITE_SHEET")}
              >
                <SpriteSheetSelectButton
                  name="playerSpriteSheetId"
                  value={scene.playerSpriteSheetId}
                  direction={isStartingScene ? startDirection : "down"}
                  paletteId={undefined}
                  onChange={onChangeField("playerSpriteSheetId")}
                  includeInfo
                  optional
                  optionalLabel={l10n("FIELD_SCENE_TYPE_DEFAULT")}
                  optionalValue={defaultPlayerSprites[scene.type]}
                />
              </FormField>
            </FormRow>

            {isStartingScene && (
              <>
                <FormDivider />
                <FormRow>
                  <Label htmlFor="startX">{l10n("FIELD_START_POSITION")}</Label>
                </FormRow>
                <FormRow>
                  <CoordinateInput
                    name="startX"
                    coordinate="x"
                    value={startX}
                    placeholder="0"
                    min={0}
                    max={scene.width - 2}
                    onChange={onChangeSettingFieldInput("startX")}
                  />
                  <CoordinateInput
                    name="startY"
                    coordinate="y"
                    value={startY}
                    placeholder="0"
                    min={0}
                    max={scene.height - 1}
                    onChange={onChangeSettingFieldInput("startY")}
                  />
                </FormRow>

                <FormRow>
                  <FormField
                    name="actorDirection"
                    label={l10n("FIELD_DIRECTION")}
                  >
                    <DirectionPicker
                      id="actorDirection"
                      value={startDirection}
                      onChange={onChangeSettingFieldInput("startDirection")}
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
          <TabBar
            value={scriptMode}
            values={scriptTabs}
            onChange={onChangeScriptMode}
            overflowActiveTab={scriptMode === "hit"}
            buttons={
              <>
                {lockButton}
                {scriptButton}
              </>
            }
          />
          {scriptMode === "hit" && (
            <TabBar
              variant="secondary"
              value={scriptModeSecondary}
              values={scriptSecondaryTabs}
              onChange={onChangeScriptModeSecondary}
            />
          )}
        </StickyTabs>
        {scene.autoFadeSpeed === null && scriptKey === "script" && (
          <ScriptEventAutoFadeDisabledWarning />
        )}
        <ScriptEditor
          value={scene[scriptKey]}
          type="scene"
          entityId={scene.id}
          scriptKey={scriptKey}
          showAutoFadeIndicator={scriptKey === "script"}
        />
      </SidebarColumn>
    </Sidebar>
  );
};
