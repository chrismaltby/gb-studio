import React, { FC, useState } from "react";
import { clipboard } from "electron";
import { useDispatch, useSelector } from "react-redux";
import ScriptEditor from "../script/ScriptEditor";
import castEventValue from "../../lib/helpers/castEventValue";
import l10n from "../../lib/helpers/l10n";
import { SidebarTabs } from "./Sidebar";
import WorldEditor from "./WorldEditor";
import ScriptEditorDropdownButton from "../script/ScriptEditorDropdownButton";
import BackgroundWarnings from "../world/BackgroundWarnings";
import { sceneSelectors } from "../../store/features/entities/entitiesState";
import editorActions from "../../store/features/editor/editorActions";
import clipboardActions from "../../store/features/clipboard/clipboardActions";
import entitiesActions from "../../store/features/entities/entitiesActions";
import settingsActions from "../../store/features/settings/settingsActions";
import { SidebarMultiColumnAuto, SidebarColumn } from "../ui/sidebars/Sidebar";
import {
  FormContainer,
  FormDivider,
  FormField,
  FormHeader,
  FormRow,
  FormSectionTitle,
} from "../ui/form/FormLayout";
import { EditableText } from "../ui/form/EditableText";
import { RootState } from "../../store/configureStore";
import {
  Scene,
  ScriptEvent,
} from "../../store/features/entities/entitiesTypes";
import { MenuDivider, MenuItem } from "../ui/menu/Menu";
import { DropdownButton } from "../ui/buttons/DropdownButton";
import { NoteField } from "../ui/form/NoteField";
import { SceneTypeSelect } from "../forms/SceneTypeSelect";
import { BackgroundSelectButton } from "../forms/BackgroundSelectButton";
import { PaletteSelectButton } from "../forms/PaletteSelectButton";
import { LabelButton, LabelColor } from "../ui/buttons/LabelButton";
import { CoordinateInput } from "../ui/form/CoordinateInput";
import DirectionPicker from "../forms/DirectionPicker";
import { SettingsState } from "../../store/features/settings/settingsState";

interface SceneEditorProps {
  id: string;
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

const defaultTabs = {
  start: l10n("SIDEBAR_ON_INIT"),
  hit: l10n("SIDEBAR_ON_PLAYER_HIT"),
};

const hitTabs = {
  hit1: l10n("FIELD_COLLISION_GROUP_N", { n: 1 }),
  hit2: l10n("FIELD_COLLISION_GROUP_N", { n: 2 }),
  hit3: l10n("FIELD_COLLISION_GROUP_N", { n: 3 }),
};

const sceneName = (scene: Scene, sceneIndex: number) =>
  scene.name ? scene.name : `Scene ${sceneIndex + 1}`;

export const SceneEditor: FC<SceneEditorProps> = ({ id }) => {
  const scene = useSelector((state: RootState) =>
    sceneSelectors.selectById(state, id)
  );
  const sceneIndex = useSelector((state: RootState) =>
    sceneSelectors.selectIds(state).indexOf(id)
  );
  const [clipboardData, setClipboardData] = useState<any>(null);
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
  const tabs = Object.keys(defaultTabs);
  const secondaryTabs = Object.keys(hitTabs);

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
  const dispatch = useDispatch();

  const onChangeScriptMode = (mode: keyof ScriptHandlers) => {
    setScriptMode(mode);
    dispatch(editorActions.setScriptTabScene(mode));
  };

  const onChangeScriptModeSecondary = (mode: keyof ScriptHandlers["hit"]) => {
    setScriptModeSecondary(mode);
    dispatch(editorActions.setScriptTabSecondary(mode));
  };

  const onChangeField = <T extends keyof Scene>(key: T) => (
    editValue: Scene[T]
  ) => {
    dispatch(
      entitiesActions.editScene({
        sceneId: id,
        changes: {
          [key]: editValue,
        },
      })
    );
  };

  const onChangeFieldInput = (key: keyof Scene) => (
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

  const onChangeSettingFieldInput = (key: keyof SettingsState) => (
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
      dispatch(clipboardActions.copyScene(scene));
    }
  };

  const onPaste = () => {
    if (clipboardData) {
      dispatch(clipboardActions.pasteClipboardEntity(clipboardData));
    }
  };

  const onRemove = () => {
    if (scene) {
      dispatch(entitiesActions.removeScene({ sceneId: scene.id }));
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

  if (!scene) {
    return <WorldEditor />;
  }

  const showNotes = scene.notes || notesOpen;

  const onEditScript = onChangeField("script");

  const onEditPlayerHit1Script = onChangeField("playerHit1Script");

  const onEditPlayerHit2Script = onChangeField("playerHit2Script");

  const onEditPlayerHit3Script = onChangeField("playerHit3Script");

  const onEditPaletteId = (index: number) => (paletteId: string) => {
    const paletteIds = scene.paletteIds ? [...scene.paletteIds] : [];
    paletteIds[index] = paletteId;
    onChangeField("paletteIds")(paletteIds);
  };

  const scripts = {
    start: {
      value: scene.script,
      onChange: onEditScript,
    },
    hit: {
      tabs: hitTabs,
      hit1: {
        value: scene.playerHit1Script,
        onChange: onEditPlayerHit1Script,
      },
      hit2: {
        value: scene.playerHit2Script,
        onChange: onEditPlayerHit2Script,
      },
      hit3: {
        value: scene.playerHit3Script,
        onChange: onEditPlayerHit3Script,
      },
    },
  } as const;

  const isStartingScene = startSceneId === id;

  return (
    <SidebarMultiColumnAuto onClick={selectSidebar}>
      <SidebarColumn>
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
              onMouseDown={readClipboard}
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
              {clipboardData && clipboardData.__type === "scene" && (
                <MenuItem onClick={onPaste}>
                  {l10n("MENU_PASTE_SCENE")}
                </MenuItem>
              )}
              <MenuDivider />
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
            <FormField name="backgroundId" label={l10n("FIELD_BACKGROUND")}>
              <BackgroundSelectButton
                name="backgroundId"
                value={scene.backgroundId}
                onChange={onChangeField("backgroundId")}
                includeInfo
              />
            </FormField>
            {colorsEnabled && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gridTemplateRows: "1fr 1fr",
                  gap: 5,
                  marginTop: 18,
                  flexShrink: 0,
                }}
              >
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <PaletteSelectButton
                    key={index}
                    name={`scenePalette${index}`}
                    value={(scene.paletteIds && scene.paletteIds[index]) || ""}
                    onChange={onEditPaletteId(index)}
                    optional
                    optionalDefaultPaletteId={
                      defaultBackgroundPaletteIds[index] || ""
                    }
                    optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
                  />
                ))}
              </div>
            )}
          </FormRow>

          <FormRow>
            <BackgroundWarnings id={scene.backgroundId} />
          </FormRow>

          <FormDivider />

          <FormRow>
            <FormField name="type" label={l10n("FIELD_TYPE")}>
              <SceneTypeSelect
                name="type"
                value={scene.type}
                onChange={onChangeField("type")}
              />
            </FormField>
          </FormRow>

          {isStartingScene && (
            <>
              <FormSectionTitle>
                {l10n("SIDEBAR_STARTING_SCENE")}
              </FormSectionTitle>
              <FormRow>
                <CoordinateInput
                  name="x"
                  coordinate="x"
                  value={startX}
                  placeholder="0"
                  min={0}
                  max={scene.width - 2}
                  onChange={onChangeSettingFieldInput("startX")}
                />
                <CoordinateInput
                  name="y"
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
      <SidebarColumn>
        <SidebarTabs
          value={scriptMode}
          values={defaultTabs}
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
        {scriptMode === "hit" && scripts[scriptMode] && (
          <SidebarTabs
            secondary
            value={scriptModeSecondary}
            values={scripts[scriptMode].tabs}
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
            type="scene"
            onChange={scripts[scriptMode].onChange}
            entityId={scene.id}
          />
        )}
        {scriptMode === "hit" &&
          scripts[scriptMode] &&
          scripts[scriptMode][scriptModeSecondary] && (
            <ScriptEditor
              value={scripts[scriptMode][scriptModeSecondary].value}
              type="scene"
              onChange={scripts[scriptMode][scriptModeSecondary].onChange}
              entityId={scene.id}
            />
          )}
      </SidebarColumn>
    </SidebarMultiColumnAuto>
  );
};
