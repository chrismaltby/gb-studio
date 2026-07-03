import React, { useCallback, useEffect, useMemo } from "react";
import {
  SelectIcon,
  BrickIcon,
  PlusIcon,
  PaintIcon,
  ListIcon,
  JigsawIcon,
  BackgroundIcon,
  NoteIcon,
  TriggerIcon,
  ActorIcon,
  SceneIcon,
} from "ui/icons/Icons";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import l10n from "shared/lib/lang/l10n";
import { Tool } from "store/features/editor/editorState";
import editorActions from "store/features/editor/editorActions";
import styled from "styled-components";
import { Button } from "ui/buttons/Button";
import { FloatingPanel, FloatingPanelDivider } from "ui/panels/FloatingPanel";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { useAppDispatch, useAppSelector, useAppStore } from "store/hooks";
import settingsActions from "store/features/settings/settingsActions";
import {
  NAVIGATOR_MIN_WIDTH,
  TOOL_COLLISIONS,
  TOOL_COLORS,
  TOOL_SCENE,
  TOOL_TILES,
} from "consts";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";

interface ToolPickerProps {
  hasFocusForKeyboardShortcuts: () => boolean;
}

const Wrapper = styled(FloatingPanel)`
  position: absolute;
  left: 10px;
  top: 10px;
`;

const ToolPicker = ({ hasFocusForKeyboardShortcuts }: ToolPickerProps) => {
  const dispatch = useAppDispatch();
  const store = useAppStore();

  const selected = useAppSelector((state) => state.editor.tool);
  const tilePaintAvailable = useAppSelector((state) => {
    const scene = sceneSelectors.selectById(state, state.editor.scene);
    return Boolean(scene?.tilemap);
  });

  const isAddSelected = useMemo(() => {
    return ["actors", "triggers", "scene"].indexOf(selected) > -1;
  }, [selected]);

  const showNavigator = useAppSelector(
    (state) => state.project.present.settings.showNavigator,
  );

  const setTool = useCallback(
    (tool: Tool) => {
      if (tool === TOOL_TILES && !tilePaintAvailable) {
        return;
      }
      dispatch(editorActions.setTool({ tool }));
    },
    [dispatch, tilePaintAvailable],
  );

  useEffect(() => {
    if (selected === TOOL_TILES && !tilePaintAvailable) {
      dispatch(editorActions.setTool({ tool: "select" }));
    }
  }, [dispatch, selected, tilePaintAvailable]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.shiftKey || e.metaKey) {
        return;
      }
      if (!hasFocusForKeyboardShortcuts()) {
        return;
      }
      if (e.code === "KeyT") {
        setTool("triggers");
      } else if (e.code === "KeyA") {
        setTool("actors");
      } else if (e.code === "KeyC") {
        setTool("collisions");
      } else if (e.code === "KeyZ") {
        setTool("colors");
      } else if (e.code === "KeyX") {
        setTool("tiles");
      } else if (e.code === "KeyS") {
        const state = store.getState();
        const currentTool = state.editor.tool;
        if (currentTool !== TOOL_SCENE) {
          setTool("scene");
        } else {
          // Toggle scene type
          const newSceneType =
            state.editor.sceneAddType === "image" ? "tilemap" : "image";
          dispatch(editorActions.setSceneAddType(newSceneType));
        }
      } else if (e.code === "KeyN") {
        setTool("note");
      } else if (e.code === "KeyV") {
        setTool("select");
      } else if (e.code === "Escape") {
        setTool("select");
      }
    },
    [dispatch, hasFocusForKeyboardShortcuts, setTool, store],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  const setToolActors = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.stopPropagation();
      setTool("actors");
    },
    [setTool],
  );
  const setToolTriggers = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.stopPropagation();
      setTool("triggers");
    },
    [setTool],
  );
  const setToolSceneType = useCallback(
    (sceneType: "image" | "tilemap") =>
      (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.stopPropagation();
        dispatch(editorActions.setSceneAddType(sceneType));
        setTool("scene");
      },
    [dispatch, setTool],
  );
  const setToolNote = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.stopPropagation();
      setTool("note");
    },
    [setTool],
  );
  const setToolSelect = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();
      e.stopPropagation();
      setTool("select");
    },
    [setTool],
  );
  const setToolCollisions = useCallback(
    () => setTool(TOOL_COLLISIONS),
    [setTool],
  );
  const setToolColors = useCallback(() => setTool(TOOL_COLORS), [setTool]);
  const setToolTiles = useCallback(() => setTool(TOOL_TILES), [setTool]);

  const enableNavigator = useCallback(() => {
    dispatch(editorActions.resizeNavigatorSidebar(NAVIGATOR_MIN_WIDTH));
    dispatch(settingsActions.setShowNavigator(true));
  }, [dispatch]);

  return (
    <Wrapper vertical>
      <Button
        variant="transparent"
        onClick={setToolSelect}
        title={`${l10n("TOOL_SELECT_LABEL")} (v)`}
        active={selected === "select"}
      >
        <SelectIcon />
      </Button>
      <DropdownButton
        size="small"
        variant="transparent"
        menuDirection="left"
        offsetX={23}
        offsetY={-13}
        showArrow={false}
        label={<PlusIcon />}
        active={isAddSelected}
      >
        <MenuItem
          onClick={setToolActors}
          title={`${l10n("TOOL_ADD_ACTOR_LABEL")} (a)`}
          icon={<ActorIcon />}
        >
          {l10n("ACTOR")}
        </MenuItem>
        <MenuItem
          onClick={setToolTriggers}
          title={`${l10n("TOOL_ADD_TRIGGER_LABEL")} (t)`}
          icon={<TriggerIcon />}
        >
          {l10n("TRIGGER")}
        </MenuItem>
        <MenuItem
          title={`${l10n("TOOL_ADD_SCENE_LABEL")} (s)`}
          subMenu={[
            <MenuItem
              key="image"
              onClick={setToolSceneType("image")}
              icon={<BackgroundIcon />}
            >
              {l10n("FIELD_IMAGE_SCENE")}
            </MenuItem>,
            <MenuItem
              key="tilemap"
              onClick={setToolSceneType("tilemap")}
              icon={<JigsawIcon />}
            >
              {l10n("FIELD_TILEMAP_SCENE")}
            </MenuItem>,
          ]}
          icon={<SceneIcon />}
        >
          {l10n("SCENE")}
        </MenuItem>
        <MenuDivider />
        <MenuItem
          onClick={setToolNote}
          title={`${l10n("TOOL_ADD_NOTE_LABEL")} (n)`}
          icon={<NoteIcon />}
        >
          {l10n("NOTE")}
        </MenuItem>
      </DropdownButton>
      <FloatingPanelDivider />
      <Button
        variant="transparent"
        onClick={setToolCollisions}
        title={`${l10n("TOOL_COLLISIONS_LABEL")} (c)`}
        active={selected === TOOL_COLLISIONS}
      >
        <BrickIcon />
      </Button>
      <Button
        variant="transparent"
        onClick={setToolColors}
        title={`${l10n("TOOL_COLORS_LABEL")} (z)`}
        active={selected === TOOL_COLORS}
      >
        <PaintIcon />
      </Button>
      {tilePaintAvailable && (
        <Button
          variant="transparent"
          onClick={setToolTiles}
          title={`${l10n("FIELD_TILES")} (x)`}
          active={selected === TOOL_TILES}
        >
          <JigsawIcon />
        </Button>
      )}
      {!showNavigator && (
        <>
          <FloatingPanelDivider />
          <Button
            variant="transparent"
            onClick={enableNavigator}
            title={l10n("MENU_SHOW_NAVIGATOR")}
          >
            <ListIcon />
          </Button>
        </>
      )}
    </Wrapper>
  );
};

export default ToolPicker;
