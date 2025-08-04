import React, { useCallback, useMemo, useState } from "react";
import ScriptEditor from "components/script/ScriptEditor";
import { castEventToInt } from "renderer/lib/helpers/castEventValue";
import { WorldEditor } from "./WorldEditor";
import ScriptEditorDropdownButton from "components/script/ScriptEditorDropdownButton";
import BackgroundWarnings from "components/world/BackgroundWarnings";
import {
  backgroundSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import entitiesActions from "store/features/entities/entitiesActions";
import settingsActions from "store/features/settings/settingsActions";
import { Sidebar, SidebarColumn, SidebarColumns } from "ui/sidebars/Sidebar";
import {
  FormContainer,
  FormField,
  FormHeader,
  FormRow,
} from "ui/form/layout/FormLayout";
import { EditableText, EditableTextOverlay } from "ui/form/EditableText";
import {
  ActorDirection,
  SceneNormalized,
  SceneParallaxLayer,
  ScriptEventNormalized,
  SpriteSheetNormalized,
} from "shared/lib/entities/entitiesTypes";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import {
  DropdownButton,
  InlineDropdownWrapper,
} from "ui/buttons/DropdownButton";
import { NoteField } from "ui/form/NoteField";
import { SceneTypeSelect } from "components/forms/SceneTypeSelect";
import { BackgroundSelectButton } from "components/forms/BackgroundSelectButton";
import { PaletteSelectButton } from "components/forms/PaletteSelectButton";
import { LabelButton, LabelColor } from "ui/buttons/LabelButton";
import { CoordinateInput } from "ui/form/CoordinateInput";
import DirectionPicker from "components/forms/DirectionPicker";
import { SettingsState } from "store/features/settings/settingsState";
import { StickyTabs, TabBar } from "ui/tabs/Tabs";
import { Label } from "ui/form/Label";
import { Button } from "ui/buttons/Button";
import {
  LockIcon,
  LockOpenIcon,
  ParallaxIcon,
  JigsawIcon,
  BlankIcon,
  CheckIcon,
  SettingsIcon,
  CameraIcon,
} from "ui/icons/Icons";
import ParallaxSelect, {
  defaultValues as parallaxDefaultValues,
} from "components/forms/ParallaxSelect";
import { SpriteSheetSelectButton } from "components/forms/SpriteSheetSelectButton";
import styled from "styled-components";
import {
  ClipboardTypePaletteIds,
  ClipboardTypeScenes,
} from "store/features/clipboard/clipboardTypes";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "consts";
import { ScriptEventAutoFadeDisabledWarning } from "components/script/ScriptEventAutoFade";
import { SceneSymbolsEditor } from "components/forms/symbols/SceneSymbolsEditor";
import { BackgroundSymbolsEditor } from "components/forms/symbols/BackgroundSymbolsEditor";
import { SymbolEditorWrapper } from "components/forms/symbols/SymbolEditorWrapper";
import { ScriptEditorContext } from "components/script/ScriptEditorContext";
import { Alert, AlertItem } from "ui/alerts/Alert";
import { sceneName } from "shared/lib/entities/entitiesHelpers";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { ScriptEditorCtx } from "shared/lib/scripts/context";
import { TilesetSelect } from "components/forms/TilesetSelect";
import { FlexBreak, FlexGrow } from "ui/spacing/Spacing";
import CachedScroll from "ui/util/CachedScroll";
import { ColorModeOverrideSelect } from "components/forms/ColorModeOverrideSelect";
import {
  ColorModeOverrideSetting,
  SceneBoundsRect,
} from "shared/lib/resources/types";
import EngineFieldsEditor from "components/settings/EngineFieldsEditor";
import { useGroupedEngineFields } from "components/settings/useGroupedEngineFields";
import ScrollBoundsInput from "components/forms/ScrollBoundsInput";
import { SpriteModeSelect } from "components/forms/SpriteModeSelect";
import { SpriteModeSetting } from "shared/lib/resources/types";

interface SceneEditorProps {
  id: string;
}

interface ScriptHandler {
  value: ScriptEventNormalized[];
  onChange: (newValue: ScriptEventNormalized[]) => void;
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

type ScriptTab = "start" | "hit";
type SecondaryTab = "hit1" | "hit2" | "hit3";

const getScriptKey = (
  primaryTab: ScriptTab,
  secondaryTab: SecondaryTab,
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

export const SceneEditor = ({ id }: SceneEditorProps) => {
  const scene = useAppSelector((state) => sceneSelectors.selectById(state, id));
  const sceneIndex = useAppSelector((state) =>
    sceneSelectors.selectIds(state).indexOf(id),
  );
  const background = useAppSelector((state) =>
    backgroundSelectors.selectById(state, scene?.backgroundId ?? ""),
  );
  const clipboardFormat = useAppSelector(
    (state) => state.clipboard.data?.format,
  );
  const [notesOpen, setNotesOpen] = useState<boolean>(!!scene?.notes);
  const [colorModeOverrideOpen, setColorModeOverrideOpen] = useState<boolean>(
    scene?.colorModeOverride && scene?.colorModeOverride !== "none",
  );
  const [spriteModeOverrideOpen, setSpriteModeOverrideOpen] = useState<boolean>(
    scene?.spriteMode !== undefined,
  );
  const [commonTilesetOpen, setCommonTilesetOpen] = useState<boolean>(
    !!scene?.tilesetId,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  const projectColorMode = useAppSelector(
    (state) => state.project.present.settings.colorMode,
  );
  const colorsEnabled = useAppSelector(
    (state) => state.project.present.settings.colorMode !== "mono",
  );
  const startSceneId = useAppSelector(
    (state) => state.project.present.settings.startSceneId,
  );
  const startX = useAppSelector(
    (state) => state.project.present.settings.startX,
  );
  const startY = useAppSelector(
    (state) => state.project.present.settings.startY,
  );
  const startDirection = useAppSelector(
    (state) => state.project.present.settings.startDirection,
  );
  const defaultBackgroundPaletteIds = useAppSelector(
    (state) => state.project.present.settings.defaultBackgroundPaletteIds || [],
  );
  const defaultSpritePaletteIds = useAppSelector(
    (state) => state.project.present.settings.defaultSpritePaletteIds || [],
  );
  const defaultPlayerSprites = useAppSelector(
    (state) => state.project.present.settings.defaultPlayerSprites,
  );
  const defaultSpriteMode = useAppSelector(
    (state) => state.project.present.settings.spriteMode,
  );
  const sceneSpriteMode = scene?.spriteMode ?? defaultSpriteMode;

  const scriptTabs: Record<ScriptTab, string> = useMemo(
    () => ({
      start: l10n("SIDEBAR_ON_INIT"),
      hit: l10n("SIDEBAR_ON_PLAYER_HIT"),
    }),
    [],
  );

  const scriptSecondaryTabs: Record<SecondaryTab, string> = useMemo(
    () => ({
      hit1: l10n("FIELD_COLLISION_GROUP_N", { n: 1 }),
      hit2: l10n("FIELD_COLLISION_GROUP_N", { n: 2 }),
      hit3: l10n("FIELD_COLLISION_GROUP_N", { n: 3 }),
    }),
    [],
  );

  const tabs = Object.keys(scriptTabs);
  const secondaryTabs = Object.keys(scriptSecondaryTabs);

  const lastScriptTab = useAppSelector(
    (state) => state.editor.lastScriptTabScene,
  );
  const lastScriptTabSecondary = useAppSelector(
    (state) => state.editor.lastScriptTabSecondary,
  );
  const initialTab = tabs.includes(lastScriptTab) ? lastScriptTab : tabs[0];
  const initialSecondaryTab = secondaryTabs.includes(lastScriptTabSecondary)
    ? lastScriptTabSecondary
    : secondaryTabs[0];

  const [scriptMode, setScriptMode] = useState<keyof ScriptHandlers>(
    initialTab as keyof ScriptHandlers,
  );
  const [scriptModeSecondary, setScriptModeSecondary] = useState<
    keyof ScriptHandlers["hit"]
  >(initialSecondaryTab as keyof ScriptHandlers["hit"]);
  const lockScriptEditor = useAppSelector(
    (state) => state.editor.lockScriptEditor,
  );
  const [showSymbols, setShowSymbols] = useState(false);
  const groupedEngineFields = useGroupedEngineFields(scene?.type);

  const dispatch = useAppDispatch();

  const logoSceneForBackground = useAppSelector(
    (state) =>
      // If current scene is logo don't bother searching for the background being used in other logo scenes
      scene?.type !== "LOGO" &&
      // Search for uses of the background within logo scenes
      // @todo Cache a lookup of logo backgroundIds to scenes (or just one scene) where they're used, store in redux
      sceneSelectors
        .selectAll(state)
        .find(
          (s) =>
            s.id !== scene?.id &&
            s.backgroundId === scene?.backgroundId &&
            s.type === "LOGO",
        ),
  );

  const onChangeScriptMode = (mode: keyof ScriptHandlers) => {
    setScriptMode(mode);
    dispatch(editorActions.setScriptTabScene(mode));
  };

  const onChangeScriptModeSecondary = (mode: keyof ScriptHandlers["hit"]) => {
    setScriptModeSecondary(mode);
    dispatch(editorActions.setScriptTabSecondary(mode));
  };

  const onChangeSceneProp = useCallback(
    <K extends keyof SceneNormalized>(key: K, value: SceneNormalized[K]) => {
      dispatch(
        entitiesActions.editScene({
          sceneId: id,
          changes: {
            [key]: value,
          },
        }),
      );
    },
    [dispatch, id],
  );

  const onChangeSettingProp = useCallback(
    <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
      dispatch(
        settingsActions.editSettings({
          [key]: value,
        }),
      );
    },
    [dispatch],
  );

  const onChangeName = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSceneProp("name", e.currentTarget.value),
    [onChangeSceneProp],
  );

  const onChangeNotes = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onChangeSceneProp("notes", e.currentTarget.value),
    [onChangeSceneProp],
  );

  const onChangeType = useCallback(
    (e: string) => onChangeSceneProp("type", e),
    [onChangeSceneProp],
  );

  const onChangeColorModeOverride = useCallback(
    (e: ColorModeOverrideSetting) => onChangeSceneProp("colorModeOverride", e),
    [onChangeSceneProp],
  );

  const onChangeBackgroundId = useCallback(
    (e: string) => onChangeSceneProp("backgroundId", e),
    [onChangeSceneProp],
  );

  const onChangeTilesetdId = useCallback(
    (e: string) => onChangeSceneProp("tilesetId", e),
    [onChangeSceneProp],
  );

  const onChangeParallax = useCallback(
    (value: SceneParallaxLayer[] | undefined) =>
      onChangeSceneProp("parallax", value),
    [onChangeSceneProp],
  );

  const onChangeScrollBounds = useCallback(
    (value: SceneBoundsRect | undefined) =>
      onChangeSceneProp("scrollBounds", value),
    [onChangeSceneProp],
  );

  const onChangePlayerSpriteSheetId = useCallback(
    (e: string) => onChangeSceneProp("playerSpriteSheetId", e),
    [onChangeSceneProp],
  );

  const onChangeStartX = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSettingProp("startX", castEventToInt(e, 0)),
    [onChangeSettingProp],
  );

  const onChangeStartY = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSettingProp("startY", castEventToInt(e, 0)),
    [onChangeSettingProp],
  );

  const onChangeStartDirection = useCallback(
    (e: ActorDirection) => onChangeSettingProp("startDirection", e),
    [onChangeSettingProp],
  );

  const onChangeSpriteMode = useCallback(
    (e: SpriteModeSetting | undefined) => onChangeSceneProp("spriteMode", e),
    [onChangeSceneProp],
  );

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

  const onOverrideColorMode = () => {
    if (projectColorMode === "mixed") {
      onChangeColorModeOverride("color");
    } else {
      onChangeColorModeOverride("mixed");
    }
    setColorModeOverrideOpen(true);
  };

  const onOverrideSpriteMode = useCallback(() => {
    const sceneSpriteMode = defaultSpriteMode === "8x16" ? "8x8" : "8x16";
    onChangeSpriteMode(sceneSpriteMode);
    setSpriteModeOverrideOpen(true);
  }, [defaultSpriteMode, onChangeSpriteMode]);

  const onToggleCommonTileset = useCallback(() => {
    if (commonTilesetOpen) {
      onChangeSceneProp("tilesetId", "");
      setCommonTilesetOpen(false);
    } else {
      setCommonTilesetOpen(true);
    }
  }, [commonTilesetOpen, onChangeSceneProp]);

  const onToggleSettingsOpen = useCallback(() => {
    if (settingsOpen) {
      setSettingsOpen(false);
    } else {
      setSettingsOpen(true);
    }
  }, [settingsOpen]);

  const onToggleLockScriptEditor = () => {
    dispatch(editorActions.setLockScriptEditor(!lockScriptEditor));
  };

  const onChangeAutoColor = useCallback(
    (value: boolean) => {
      scene?.backgroundId &&
        dispatch(
          entitiesActions.editBackgroundAutoColor({
            backgroundId: scene.backgroundId,
            autoColor: value,
          }),
        );
    },
    [dispatch, scene?.backgroundId],
  );

  const onToggleParallaxSettings = () => {
    dispatch(
      entitiesActions.editScene({
        sceneId: id,
        changes: {
          parallax: scene?.parallax
            ? undefined
            : parallaxDefaultValues.slice(-2),
        },
      }),
    );
  };

  const onToggleScrollBounds = () => {
    dispatch(
      entitiesActions.editScene({
        sceneId: id,
        changes: {
          scrollBounds: scene?.scrollBounds
            ? undefined
            : {
                x: 0,
                y: 0,
                width: scene?.width || SCREEN_WIDTH,
                height: scene?.height || SCREEN_HEIGHT,
              },
        },
      }),
    );
  };

  const onFetchClipboard = useCallback(() => {
    dispatch(clipboardActions.fetchClipboard());
  }, [dispatch]);

  const onCopyBackgroundPaletteIds = useCallback(() => {
    if (scene) {
      const paletteIds = Array.from(Array(8).keys()).map(
        (n) => scene.paletteIds[n] || defaultBackgroundPaletteIds[n] || "",
      );
      dispatch(
        clipboardActions.copyPaletteIds({
          paletteIds,
        }),
      );
    }
  }, [dispatch, scene, defaultBackgroundPaletteIds]);

  const onCopySpritePaletteIds = useCallback(() => {
    if (scene) {
      const paletteIds = Array.from(Array(8).keys()).map(
        (n) => scene.spritePaletteIds[n] || defaultSpritePaletteIds[n] || "",
      );
      dispatch(
        clipboardActions.copyPaletteIds({
          paletteIds,
        }),
      );
    }
  }, [dispatch, scene, defaultSpritePaletteIds]);

  const onPasteBackgroundPaletteIds = useCallback(() => {
    dispatch(
      clipboardActions.pastePaletteIds({
        sceneId: id,
        type: "background",
      }),
    );
  }, [dispatch, id]);

  const onPasteSpritePaletteIds = useCallback(() => {
    dispatch(
      clipboardActions.pastePaletteIds({
        sceneId: id,
        type: "sprite",
      }),
    );
  }, [dispatch, id]);

  const onlyCurrentSpriteMode = useCallback(
    (spriteSheet: SpriteSheetNormalized) => {
      return (spriteSheet.spriteMode ?? defaultSpriteMode) === sceneSpriteMode;
    },
    [defaultSpriteMode, sceneSpriteMode],
  );

  const scriptKey = getScriptKey(scriptMode, scriptModeSecondary);

  const scriptCtx: ScriptEditorCtx = useMemo(
    () => ({
      type: "entity",
      entityType: "scene",
      entityId: id,
      sceneId: id,
      scriptKey,
    }),
    [id, scriptKey],
  );

  if (!scene) {
    return <WorldEditor />;
  }

  const showNotes = scene.notes || notesOpen;
  const showColorModeOverride =
    (scene.colorModeOverride && scene.colorModeOverride !== "none") ||
    colorModeOverrideOpen;
  const showSpriteModeOverride = scene.spriteMode || spriteModeOverrideOpen;

  const onEditPaletteId = (index: number) => (paletteId: string) => {
    const paletteIds = scene.paletteIds ? [...scene.paletteIds] : [];
    paletteIds[index] = paletteId;
    onChangeSceneProp("paletteIds", paletteIds);
  };

  const onEditSpritePaletteId = (index: number) => (paletteId: string) => {
    const spritePaletteIds = scene.spritePaletteIds
      ? [...scene.spritePaletteIds]
      : [];
    spritePaletteIds[index] = paletteId;
    onChangeSceneProp("spritePaletteIds", spritePaletteIds);
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
  const showCommonTilesetButton = scene.type !== "LOGO";
  const showScrollBoundsButton =
    (scene.width && scene.width > SCREEN_WIDTH) ||
    (scene.height && scene.height > SCREEN_HEIGHT);
  const showScrollBoundsOptions = showScrollBoundsButton && scene.scrollBounds;
  const numBackgroundButtons =
    (showCommonTilesetButton ? 1 : 0) +
    (showParallaxButton ? 1 : 0) +
    (showScrollBoundsButton ? 1 : 0);

  const scriptButton = (
    <ScriptEditorDropdownButton
      value={scene[scriptKey]}
      type="scene"
      entityId={scene.id}
      scriptKey={scriptKey}
    />
  );

  const scrollKey = `${scene.id}_${scriptKey}`;

  return (
    <Sidebar onClick={selectSidebar}>
      <CachedScroll key={scrollKey} cacheKey={scrollKey}>
        {!lockScriptEditor && (
          <FormContainer>
            <FormHeader>
              <FlexGrow style={{ minWidth: 0 }}>
                <EditableText
                  name="name"
                  placeholder={sceneName(scene, sceneIndex)}
                  value={scene.name || ""}
                  onChange={onChangeName}
                />
                <EditableTextOverlay>
                  {sceneName(scene, sceneIndex).replace(/.*[/\\]/, "")}
                </EditableTextOverlay>
              </FlexGrow>
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
                        onClick={() => onChangeSceneProp("labelColor", "")}
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
                          onClick={() => onChangeSceneProp("labelColor", color)}
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
                {!showSymbols && (
                  <MenuItem onClick={() => setShowSymbols(true)}>
                    {l10n("FIELD_VIEW_GBVM_SYMBOLS")}
                  </MenuItem>
                )}
                {!showColorModeOverride && colorsEnabled && (
                  <MenuItem onClick={onOverrideColorMode}>
                    {l10n("FIELD_SET_COLOR_MODE_OVERRIDE")}
                  </MenuItem>
                )}
                {!showSpriteModeOverride && (
                  <MenuItem onClick={onOverrideSpriteMode}>
                    {l10n("FIELD_SET_SPRITE_MODE_OVERRIDE")}
                  </MenuItem>
                )}
                <MenuDivider />
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
          </FormContainer>
        )}
        {!lockScriptEditor && (
          <SidebarColumns>
            {(showSymbols || showNotes) && (
              <SidebarColumn>
                {showSymbols && (
                  <SymbolEditorWrapper>
                    <SceneSymbolsEditor id={scene.id} />
                    <BackgroundSymbolsEditor id={scene.backgroundId} />
                  </SymbolEditorWrapper>
                )}
                {showNotes && (
                  <FormContainer>
                    <FormRow>
                      <NoteField
                        value={scene.notes || ""}
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
                  <FormField name="type" label={l10n("FIELD_TYPE")}>
                    <div style={{ display: "flex" }}>
                      <SceneTypeSelect
                        name="type"
                        value={scene.type}
                        onChange={onChangeType}
                      />
                      {groupedEngineFields.length > 0 && (
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <Button
                            style={{
                              padding: "5px 0",
                              minWidth: 28,
                              marginLeft: 4,
                              marginBottom: 4,
                            }}
                            variant={settingsOpen ? "primary" : "transparent"}
                            onClick={onToggleSettingsOpen}
                            title={l10n("SETTINGS")}
                          >
                            <SettingsIcon />
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormField>
                </FormRow>

                {settingsOpen && <EngineFieldsEditor sceneType={scene.type} />}
              </FormContainer>
            </SidebarColumn>
            <FlexBreak />

            <SidebarColumn>
              <FormContainer>
                <FormRow>
                  <FormField
                    name="backgroundId"
                    label={l10n("FIELD_BACKGROUND")}
                  >
                    <div style={{ display: "flex" }}>
                      <BackgroundSelectButton
                        name="backgroundId"
                        value={scene.backgroundId}
                        tilesetId={scene.tilesetId}
                        onChange={onChangeBackgroundId}
                        is360={scene.type === "LOGO"}
                        includeInfo
                      />
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            numBackgroundButtons > 2
                              ? "repeat(2, 1fr)"
                              : undefined,
                          gap: 4,
                          marginLeft: 4,
                        }}
                      >
                        {showCommonTilesetButton && (
                          <Button
                            style={{
                              padding: "5px 0",
                              minWidth: 28,
                            }}
                            variant={
                              commonTilesetOpen ? "primary" : "transparent"
                            }
                            onClick={onToggleCommonTileset}
                            title={l10n("FIELD_COMMON_TILESET")}
                          >
                            <JigsawIcon />
                          </Button>
                        )}
                        {showParallaxButton && (
                          <Button
                            style={{
                              padding: "5px 0",
                              minWidth: 28,
                            }}
                            variant={
                              scene?.parallax ? "primary" : "transparent"
                            }
                            onClick={onToggleParallaxSettings}
                            title={l10n("FIELD_PARALLAX")}
                          >
                            <ParallaxIcon />
                          </Button>
                        )}
                        {showScrollBoundsButton && (
                          <Button
                            style={{
                              padding: "5px 0",
                              minWidth: 28,
                            }}
                            variant={
                              scene?.scrollBounds ? "primary" : "transparent"
                            }
                            onClick={onToggleScrollBounds}
                            title={l10n("FIELD_CAMERA_BOUNDS")}
                          >
                            <CameraIcon />
                          </Button>
                        )}
                      </div>
                    </div>
                  </FormField>
                </FormRow>

                {commonTilesetOpen && (
                  <FormRow>
                    <FormField
                      name="tilesetId"
                      label={l10n("FIELD_COMMON_TILESET")}
                      title={l10n("FIELD_COMMON_TILESET_DESC")}
                    >
                      <TilesetSelect
                        name="tilesetId"
                        value={scene.tilesetId}
                        onChange={onChangeTilesetdId}
                        optional
                      />
                    </FormField>
                  </FormRow>
                )}

                <FormRow>
                  <BackgroundWarnings id={scene.backgroundId} />
                  {logoSceneForBackground && (
                    <Alert variant="warning">
                      <AlertItem>
                        {l10n("WARNING_BACKGROUND_LOGO_REUSED", {
                          name: logoSceneForBackground.name,
                        })}
                      </AlertItem>
                    </Alert>
                  )}
                </FormRow>

                {/* <FormDivider /> */}
              </FormContainer>
            </SidebarColumn>

            {showParallaxOptions && (
              <SidebarColumn>
                <FormContainer>
                  <FormRow>
                    <FormField name="parallax" label={l10n("FIELD_PARALLAX")}>
                      <ParallaxSelect
                        name="parallax"
                        value={scene.parallax}
                        sceneHeight={scene.height}
                        onChange={onChangeParallax}
                      />
                    </FormField>
                  </FormRow>
                </FormContainer>
              </SidebarColumn>
            )}

            {showScrollBoundsOptions && scene.scrollBounds && (
              <SidebarColumn>
                <FormContainer>
                  <FormRow>
                    <FormField
                      name="scrollBounds"
                      label={l10n("FIELD_CAMERA_BOUNDS")}
                    >
                      <ScrollBoundsInput
                        name={"scrollBounds"}
                        sceneWidth={scene.width}
                        sceneHeight={scene.height}
                        value={scene.scrollBounds}
                        onChange={onChangeScrollBounds}
                      />
                    </FormField>
                  </FormRow>
                </FormContainer>
              </SidebarColumn>
            )}

            {colorsEnabled && (
              <SidebarColumn>
                {showColorModeOverride && (
                  <FormRow>
                    <FormField
                      name="colorModeOverride"
                      label={l10n("FIELD_COLOR_MODE_OVERRIDE")}
                    >
                      <ColorModeOverrideSelect
                        name="colorModeOverride"
                        value={scene.colorModeOverride}
                        onChange={onChangeColorModeOverride}
                      />
                    </FormField>
                  </FormRow>
                )}

                <FormRow>
                  <FormField
                    name="playerSpriteSheetId"
                    label={
                      <>
                        {l10n("FIELD_SCENE_BACKGROUND_PALETTES")}
                        <InlineDropdownWrapper>
                          <DropdownButton
                            size="small"
                            variant="transparent"
                            showArrow={false}
                            label={l10n(
                              background?.autoColor
                                ? "FIELD_AUTOMATIC"
                                : "FIELD_MANUAL",
                            )}
                          >
                            <MenuItem
                              onClick={() => onChangeAutoColor(true)}
                              icon={
                                background?.autoColor ? (
                                  <CheckIcon />
                                ) : (
                                  <BlankIcon />
                                )
                              }
                            >
                              {l10n("FIELD_AUTOMATIC")}
                            </MenuItem>
                            <MenuItem
                              onClick={() => onChangeAutoColor(false)}
                              icon={
                                !background?.autoColor ? (
                                  <CheckIcon />
                                ) : (
                                  <BlankIcon />
                                )
                              }
                            >
                              {l10n("FIELD_MANUAL")}
                            </MenuItem>
                          </DropdownButton>
                        </InlineDropdownWrapper>
                      </>
                    }
                  >
                    {!background?.autoColor && (
                      <PaletteButtons>
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                          <PaletteSelectButton
                            key={index}
                            name={`scenePalette${index}`}
                            value={
                              (scene.paletteIds && scene.paletteIds[index]) ||
                              ""
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
                    )}
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

                {/* <FormDivider /> */}
              </SidebarColumn>
            )}
            {scene.type !== "LOGO" && (
              <>
                <SidebarColumn>
                  <FormRow>
                    <FormField
                      name="playerSpriteSheetId"
                      label={l10n("FIELD_PLAYER_SPRITE_SHEET")}
                    >
                      <SpriteSheetSelectButton
                        name="playerSpriteSheetId"
                        value={scene.playerSpriteSheetId}
                        direction={isStartingScene ? startDirection : "down"}
                        onChange={onChangePlayerSpriteSheetId}
                        filter={onlyCurrentSpriteMode}
                        includeInfo
                        optional
                        optionalLabel={l10n("FIELD_SCENE_TYPE_DEFAULT")}
                        optionalValue={defaultPlayerSprites[scene.type]}
                      />
                    </FormField>
                  </FormRow>
                  {showSpriteModeOverride && (
                    <FormRow>
                      <FormField
                        name="spriteMode"
                        label={l10n("FIELD_SPRITE_MODE_OVERRIDE")}
                      >
                        <SpriteModeSelect
                          name={"spriteMode"}
                          onChange={onChangeSpriteMode}
                          allowDefault={true}
                          value={scene.spriteMode}
                        />
                      </FormField>
                    </FormRow>
                  )}
                </SidebarColumn>
              </>
            )}
            {isStartingScene && (
              <SidebarColumn>
                {/* <FormDivider /> */}
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
                    onChange={onChangeStartX}
                  />
                  <CoordinateInput
                    name="startY"
                    coordinate="y"
                    value={startY}
                    placeholder="0"
                    min={0}
                    max={scene.height - 1}
                    onChange={onChangeStartY}
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
                      onChange={onChangeStartDirection}
                    />
                  </FormField>
                </FormRow>
              </SidebarColumn>
            )}
          </SidebarColumns>
        )}
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
        <ScriptEditorContext.Provider value={scriptCtx}>
          <ScriptEditor
            value={scene[scriptKey]}
            showAutoFadeIndicator={scriptKey === "script"}
          />
        </ScriptEditorContext.Provider>
      </CachedScroll>
    </Sidebar>
  );
};
