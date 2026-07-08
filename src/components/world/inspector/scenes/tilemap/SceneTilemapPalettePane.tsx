import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import {
  useAppDispatch,
  useAppSelector,
  useAppSelectorPick,
  useAppSelectorPickArray,
} from "store/hooks";
import {
  sceneSelectors,
  tilesetSelectors,
  paletteSelectors,
} from "store/features/entities/entitiesSelectors";
import entitiesActions from "store/features/entities/entitiesActions";
import editorActions from "store/features/editor/editorActions";
import settingsActions from "store/features/settings/settingsActions";
import { TilesetSelect } from "components/forms/TilesetSelect";
import { Button } from "ui/buttons/Button";
import { assetURL } from "shared/lib/helpers/assets";
import {
  DMG_PALETTE,
  TILE_COLOR_PROP_PRIORITY,
  TILE_DEFAULT_UNSET,
  TILE_SIZE,
  defaultCollisionTileDefs,
} from "consts";
import l10n from "shared/lib/lang/l10n";
import {
  PencilIcon,
  EraserIcon,
  PriorityTileIcon,
  ShieldIcon,
  Autotile9SliceIcon,
  Autotile2x2Icon,
} from "ui/icons/Icons";
import PaletteBlock from "components/forms/PaletteBlock";
import { CollisionTileIcon } from "components/collisions/CollisionTileIcon";
import { isCollisionTileActive } from "shared/lib/collisions/collisionTiles";
import { paletteName } from "shared/lib/entities/entitiesHelpers";
import { ZoomButton } from "ui/buttons/ZoomButton";
import ColorizedImage from "components/rendering/ColorizedImage";
import ScenePriorityMap from "components/world/entities/scenes/ScenePriorityMap";
import SceneCollisions from "components/world/entities/scenes/SceneCollisions";
import SceneAutotileSelection from "components/world/inspector/scenes/tilemap/SceneAutotileSelection";
import TilesetUnsetDefaultsOverlay from "components/world/inspector/scenes/tilemap/TilesetUnsetDefaultsOverlay";
import {
  isAutotileDefinitionWithinBounds,
  isTileWithinAutotileDefinition,
} from "shared/lib/tiles/sceneTilemapData";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { FormContainer, FormField, FormRow } from "ui/form/layout/FormLayout";
import { FixedSpacer } from "ui/spacing/Spacing";
import { InputGroup, InputGroupAppend } from "ui/form/InputGroup";
import { TabBar } from "ui/tabs/Tabs";
import { Alert } from "ui/alerts/Alert";

const Wrapper = styled.div`
  max-width: 100%;
`;

const PaletteViewport = styled.div`
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 5px;
  overflow: auto;
  margin-top: -1px;
  background: ${(props) => props.theme.colors.input.background};
  border-top: 1px solid ${(props) => props.theme.colors.input.border};
  border-bottom: 1px solid ${(props) => props.theme.colors.input.border};
  min-height: 224px;
`;

const PaletteSurfaceFrame = styled.div`
  position: relative;
`;

const PaletteSurface = styled.div`
  position: relative;
  line-height: 0;
  cursor: crosshair;
  user-select: none;

  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
  }
`;

const TileSelection = styled.div`
  position: absolute;
  pointer-events: none;
  box-sizing: border-box;
  outline: 1px solid ${(props) => props.theme.colors.highlight};
  box-shadow: 0px 0px 10px 5px rgba(0, 0, 0, 1);
`;

const PaintTools = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 1px;
  padding: 4px;
  background: ${(props) => props.theme.colors.tabs.secondaryBackground};

  & > * {
    width: 36px;
    height: 36px;
    border-radius: 0;
  }
`;

interface SceneTilemapPalettePaneProps {
  sceneId: string;
}

const paletteZoomLevels = [100, 200, 400, 800, 1600];

const SceneTilemapPalettePane = ({ sceneId }: SceneTilemapPalettePaneProps) => {
  const dispatch = useAppDispatch();

  const scene = useAppSelectorPick(
    (state) => sceneSelectors.selectById(state, sceneId),
    ["type", "paletteIds"] as const,
  );
  const hasTilemap = useAppSelector((state) =>
    Boolean(sceneSelectors.selectById(state, sceneId)?.tilemap),
  );
  const layers = useAppSelectorPickArray(
    (state) => sceneSelectors.selectById(state, sceneId)?.tilemap?.layers ?? [],
    ["id", "name", "visible"] as const,
  );
  const tilesets = useAppSelectorPickArray(tilesetSelectors.selectAll, [
    "id",
    "width",
    "autotiles",
  ] as const);

  const colorMode = useAppSelector(
    (state) => state.project.present.settings.colorMode,
  );

  const previewAsMono = useAppSelector(
    (state) =>
      state.project.present.settings.colorMode === "mono" ||
      (state.project.present.settings.colorMode === "mixed" &&
        state.project.present.settings.previewAsMono),
  );

  const selectedSceneTile = useAppSelector(
    (state) => state.editor.selectedSceneTile,
  );
  const selectedTilesetId = selectedSceneTile?.tilesetId ?? "";
  const selectedTileIndex = selectedSceneTile?.tileIndex ?? 0;
  const selectedTileWidth = selectedSceneTile?.width ?? 1;
  const selectedTileHeight = selectedSceneTile?.height ?? 1;
  const selectedLayerId = useAppSelector(
    (state) => state.editor.selectedTilemapLayerId,
  );

  const preferredTilesetId = useAppSelector(
    (state) => state.project.present.settings.selectedSceneTilesetId,
  );

  const selectedTileset = useAppSelector((state) =>
    tilesetSelectors.selectById(state, selectedTilesetId),
  );

  const validAutotileType = useMemo(() => {
    if (
      !selectedTileset ||
      selectedTileWidth !== 1 ||
      selectedTileHeight !== 1 ||
      selectedTileIndex < 0
    ) {
      return false;
    }

    return (
      selectedTileset.autotiles?.find(
        (definition) => definition.startTile === selectedTileIndex,
      )?.type ?? false
    );
  }, [
    selectedTileset,
    selectedTileWidth,
    selectedTileHeight,
    selectedTileIndex,
  ]);

  const selectedAutotileType =
    selectedSceneTile?.autotile && validAutotileType
      ? validAutotileType
      : false;

  const [paletteZoom, setPaletteZoom] = useState(200);
  const [editingDefaults, setEditingDefaults] = useState(false);
  const [defaultEditMode, setDefaultEditMode] = useState<string>("collisions");
  const [autotileType, setAutotileType] = useState<"2x2" | "9slice">("2x2");

  const dragStart = useRef<{ x: number; y: number } | undefined>(undefined);

  const defaultPaintLast = useRef<{ x: number; y: number } | undefined>(
    undefined,
  );
  const defaultPaintValue = useRef(0);
  const defaultPaintIsTileProp = useRef(false);
  const defaultCollisionValue = useRef(0);
  const defaultCollisionMask = useRef(0xff);

  const selectedPalette = useAppSelector(
    (state) => state.editor.selectedPalette,
  );
  const selectedTileType = useAppSelector(
    (state) => state.editor.selectedTileType,
  );
  const selectedTileMask = useAppSelector(
    (state) => state.editor.selectedTileMask,
  );

  const eraser = useAppSelector((state) => state.editor.scenePaintEraser);
  const palettesLookup = useAppSelector(paletteSelectors.selectEntities);
  const defaultPaletteIds = useAppSelector(
    (state) => state.project.present.settings.defaultBackgroundPaletteIds,
  );

  const collisionTileDefs = useAppSelector((state) => {
    const sceneType = state.engine.sceneTypes?.find(
      (item) => item.key === scene?.type,
    );
    return sceneType?.collisionTiles ?? defaultCollisionTileDefs;
  });

  const tilesetWidth = (selectedTileset?.width ?? 0) * TILE_SIZE;
  const tilesetHeight = (selectedTileset?.height ?? 0) * TILE_SIZE;

  const displayTileColors = useMemo(
    () =>
      selectedTileset?.tileColors.map((value) =>
        value === TILE_DEFAULT_UNSET ? 0 : value,
      ) ?? [],
    [selectedTileset?.tileColors],
  );

  const displayTileCollisions = useMemo(
    () =>
      selectedTileset?.tileCollisions.map((value) =>
        value === TILE_DEFAULT_UNSET ? 0 : value,
      ) ?? [],
    [selectedTileset?.tileCollisions],
  );

  const palettes = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) =>
        scene?.paletteIds?.[index] === "dmg"
          ? DMG_PALETTE
          : palettesLookup[scene?.paletteIds?.[index] ?? ""] ||
            palettesLookup[defaultPaletteIds[index]] ||
            DMG_PALETTE,
      ),
    [defaultPaletteIds, palettesLookup, scene?.paletteIds],
  );

  const tileDefaultsTabs = useMemo(
    () => ({
      collisions: l10n("TOOL_COLLISIONS_LABEL"),
      ...(colorMode !== "mono" ? { colors: l10n("FIELD_COLORS") } : {}),
      autotiles: l10n("FIELD_AUTOTILES"),
    }),
    [colorMode],
  );

  useEffect(() => {
    if (selectedSceneTile?.autotile && !validAutotileType) {
      dispatch(editorActions.setSelectedSceneTileAutotile(false));
    }
  }, [dispatch, selectedSceneTile?.autotile, validAutotileType]);

  useEffect(() => {
    const clearDrag = () => {
      dragStart.current = undefined;
      defaultPaintLast.current = undefined;
    };
    window.addEventListener("mouseup", clearDrag);
    return () => window.removeEventListener("mouseup", clearDrag);
  }, []);

  useEffect(() => {
    const preferredTileset = tilesets.find(
      (tileset) => tileset.id === preferredTilesetId,
    );
    const currentTileset = tilesets.find(
      (tileset) => tileset.id === selectedTilesetId,
    );
    const tileset = preferredTileset ?? currentTileset ?? tilesets[0];

    if (tileset && tileset.id !== selectedTilesetId) {
      dispatch(
        editorActions.selectSceneTileForPainting({
          tilesetId: tileset.id,
          tileIndex: 0,
          tilesetWidth: tileset.width,
          autotile: Boolean(
            tileset.autotiles?.some((definition) => definition.startTile === 0),
          ),
          persistTileset: tileset.id !== preferredTilesetId,
          activateTool: false,
        }),
      );
    } else if (tileset && tileset.id !== preferredTilesetId) {
      dispatch(
        settingsActions.editSettings({ selectedSceneTilesetId: tileset.id }),
      );
    }
  }, [dispatch, preferredTilesetId, selectedTilesetId, tilesets]);

  useEffect(() => {
    if (
      layers.length &&
      !layers.some((layer) => layer.id === selectedLayerId)
    ) {
      dispatch(
        editorActions.setSelectedTilemapLayerId(layers[layers.length - 1].id),
      );
    }
  }, [dispatch, layers, selectedLayerId]);

  const selectTileset = useCallback(
    (tilesetId: string) => {
      const tileset = tilesets.find((item) => item.id === tilesetId);
      dispatch(
        editorActions.selectSceneTileForPainting({
          tilesetId,
          tileIndex: 0,
          tilesetWidth: tileset?.width,
          autotile: Boolean(
            tileset?.autotiles?.some(
              (definition) => definition.startTile === 0,
            ),
          ),
          persistTileset: true,
        }),
      );
    },
    [dispatch, tilesets],
  );

  const getTilePosition = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!selectedTileset) return undefined;
      const bounds = e.currentTarget.getBoundingClientRect();
      return {
        x: Math.max(
          0,
          Math.min(
            selectedTileset.width - 1,
            Math.floor(
              ((e.clientX - bounds.left) / bounds.width) *
                selectedTileset.width,
            ),
          ),
        ),
        y: Math.max(
          0,
          Math.min(
            selectedTileset.height - 1,
            Math.floor(
              ((e.clientY - bounds.top) / bounds.height) *
                selectedTileset.height,
            ),
          ),
        ),
      };
    },
    [selectedTileset],
  );

  const updateTileSelection = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const position = getTilePosition(e);
      const start = dragStart.current;
      if (!selectedTileset || !position || !start) return;
      const x = Math.min(start.x, position.x);
      const y = Math.min(start.y, position.y);
      dispatch(
        editorActions.selectSceneTileForPainting({
          tilesetId: selectedTileset.id,
          tileIndex: y * selectedTileset.width + x,
          width: Math.abs(position.x - start.x) + 1,
          height: Math.abs(position.y - start.y) + 1,
          tilesetWidth: selectedTileset.width,
          autotile: false,
        }),
      );
    },
    [dispatch, getTilePosition, selectedTileset],
  );

  const startTileSelection = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const position = getTilePosition(e);
      if (!selectedTileset || !position) return;
      e.preventDefault();

      const clickedIndex = position.y * selectedTileset.width + position.x;
      const autotileDefinition = selectedTileset.autotiles?.find((definition) =>
        isTileWithinAutotileDefinition(
          clickedIndex,
          selectedTileset.width,
          definition,
        ),
      );

      if (autotileDefinition) {
        dragStart.current = undefined;
        const selectIndividualTile =
          Boolean(selectedAutotileType) &&
          selectedTileIndex === autotileDefinition.startTile;
        dispatch(
          editorActions.selectSceneTileForPainting({
            tilesetId: selectedTileset.id,
            tileIndex: selectIndividualTile
              ? clickedIndex
              : autotileDefinition.startTile,
            tilesetWidth: selectedTileset.width,
            autotile: !selectIndividualTile,
          }),
        );
        return;
      }

      dragStart.current = position;
      updateTileSelection(e);
    },
    [
      dispatch,
      getTilePosition,
      selectedAutotileType,
      selectedTileIndex,
      selectedTileset,
      updateTileSelection,
    ],
  );

  const toggleAutotileGroup = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const position = getTilePosition(e);
      if (!selectedTileset || !position) {
        return;
      }
      e.preventDefault();
      const tileIndex = position.y * selectedTileset.width + position.x;
      const existingDefinition = selectedTileset.autotiles?.find((definition) =>
        isTileWithinAutotileDefinition(
          tileIndex,
          selectedTileset.width,
          definition,
        ),
      );
      const isValidAutotile = isAutotileDefinitionWithinBounds(
        { type: autotileType, startTile: tileIndex },
        selectedTileset.width,
        selectedTileset.height,
      );
      dispatch(
        entitiesActions.toggleTilesetAutotileGroup({
          tilesetId: selectedTileset.id,
          tileIndex,
          type: autotileType,
        }),
      );
      if (!existingDefinition && isValidAutotile) {
        dispatch(
          editorActions.selectSceneTileForPainting({
            tilesetId: selectedTileset.id,
            tileIndex,
            tilesetWidth: selectedTileset.width,
            autotile: true,
            activateTool: false,
          }),
        );
      }
    },
    [autotileType, dispatch, getTilePosition, selectedTileset],
  );

  const startDefaultPaint = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const position = getTilePosition(e);
      if (!selectedTileset || !position) return;
      e.preventDefault();
      defaultPaintLast.current = position;

      if (defaultEditMode === "collisions") {
        const index = position.y * selectedTileset.width + position.x;
        const current = selectedTileset.tileCollisions[index];
        const normalizedCurrent =
          current === undefined || current === TILE_DEFAULT_UNSET ? 0 : current;
        defaultCollisionMask.current = eraser ? 0xff : selectedTileMask;
        defaultCollisionValue.current = eraser
          ? 0
          : (normalizedCurrent & selectedTileMask) ===
              (selectedTileType & selectedTileMask)
            ? 0
            : selectedTileType;
        dispatch(
          entitiesActions.paintTilesetCollision({
            tilesetId: selectedTileset.id,
            ...position,
            value: defaultCollisionValue.current,
            mask: defaultCollisionMask.current,
            clear: eraser,
          }),
        );
        return;
      }

      const index = position.y * selectedTileset.width + position.x;
      const current = selectedTileset.tileColors[index];
      defaultPaintIsTileProp.current =
        !eraser && Boolean(selectedPalette & TILE_COLOR_PROP_PRIORITY);
      defaultPaintValue.current = defaultPaintIsTileProp.current
        ? current !== undefined &&
          current !== TILE_DEFAULT_UNSET &&
          current & TILE_COLOR_PROP_PRIORITY
          ? 0
          : TILE_COLOR_PROP_PRIORITY
        : selectedPalette;
      dispatch(
        entitiesActions.paintTilesetColor({
          tilesetId: selectedTileset.id,
          ...position,
          value: defaultPaintValue.current,
          isTileProp: defaultPaintIsTileProp.current,
          clear: eraser,
        }),
      );
    },
    [
      defaultEditMode,
      dispatch,
      eraser,
      getTilePosition,
      selectedPalette,
      selectedTileMask,
      selectedTileType,
      selectedTileset,
    ],
  );

  const moveDefaultPaint = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const position = getTilePosition(e);
      const last = defaultPaintLast.current;
      if (!selectedTileset || !position || !last || e.buttons !== 1) return;
      if (position.x === last.x && position.y === last.y) return;

      if (defaultEditMode === "collisions") {
        dispatch(
          entitiesActions.paintTilesetCollision({
            tilesetId: selectedTileset.id,
            ...position,
            value: defaultCollisionValue.current,
            mask: defaultCollisionMask.current,
            clear: eraser,
          }),
        );
      } else {
        dispatch(
          entitiesActions.paintTilesetColor({
            tilesetId: selectedTileset.id,
            ...position,
            value: defaultPaintValue.current,
            isTileProp: defaultPaintIsTileProp.current,
            clear: eraser,
          }),
        );
      }
      defaultPaintLast.current = position;
    },
    [defaultEditMode, dispatch, eraser, getTilePosition, selectedTileset],
  );

  if (!scene) {
    return null;
  }

  const tilemap = hasTilemap ? { layers } : undefined;

  const selectCollision = (
    tileIndex: number,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    const tile = collisionTileDefs[tileIndex];
    if (!tile) {
      return;
    }
    let value = tile.flag;
    const mask = tile.mask ?? 0xff;
    if (e.shiftKey && tile.multi) {
      value =
        selectedTileType & tile.flag
          ? selectedTileType & mask & ~tile.flag
          : (selectedTileType & mask) | tile.flag;
    }
    if (e.shiftKey && tile.extra !== undefined) {
      value |= tile.extra;
    }
    dispatch(
      editorActions.setSelectedTileType({ tileType: value, tileMask: mask }),
    );
  };

  return (
    <Wrapper>
      {tilemap && (
        <>
          <SplitPaneHeader
            collapsed={false}
            buttons={
              <ZoomButton
                zoom={paletteZoom}
                size="small"
                variant="transparent"
                title={l10n("TOOLBAR_ZOOM_RESET")}
                titleIn={l10n("TOOLBAR_ZOOM_IN")}
                titleOut={l10n("TOOLBAR_ZOOM_OUT")}
                onZoomReset={() => setPaletteZoom(200)}
                onZoomIn={() => {
                  const index = paletteZoomLevels.indexOf(paletteZoom);
                  setPaletteZoom(
                    paletteZoomLevels[
                      Math.min(index + 1, paletteZoomLevels.length - 1)
                    ],
                  );
                }}
                onZoomOut={() => {
                  const index = paletteZoomLevels.indexOf(paletteZoom);
                  setPaletteZoom(paletteZoomLevels[Math.max(index - 1, 0)]);
                }}
              />
            }
            borderTop
          >
            {l10n("FIELD_TILESET")}
          </SplitPaneHeader>
          <FormContainer>
            <FixedSpacer height={10} />
            <FormRow>
              <FormField name="">
                {tilesets.length > 0 ? (
                  <InputGroup>
                    <TilesetSelect
                      name="paintTilesetId"
                      value={selectedTilesetId}
                      onChange={selectTileset}
                    />
                    <InputGroupAppend>
                      <Button
                        variant={editingDefaults ? "primary" : "normal"}
                        title={l10n("FIELD_EDIT_TILE_DEFAULTS")}
                        onClick={() => setEditingDefaults(!editingDefaults)}
                      >
                        <PencilIcon />
                      </Button>
                    </InputGroupAppend>
                  </InputGroup>
                ) : (
                  <Alert variant="warning">
                    <strong>{l10n("MESSAGE_NO_TILESETS_FOUND")}</strong>
                    <p>{l10n("MESSAGE_ADD_TILESET_FILES")}</p>
                  </Alert>
                )}
              </FormField>
            </FormRow>
          </FormContainer>
          {editingDefaults && tilesets.length > 0 && (
            <>
              <TabBar
                value={defaultEditMode}
                values={tileDefaultsTabs}
                overflowActiveTab
                onChange={setDefaultEditMode}
              />
              {defaultEditMode === "colors" && (
                <PaintTools>
                  <Button
                    variant="transparent"
                    active={eraser}
                    title={l10n("FIELD_KEEP")}
                    onClick={() =>
                      dispatch(editorActions.setScenePaintEraser(true))
                    }
                  >
                    <ShieldIcon />
                  </Button>
                  {palettes.map((palette, index) => (
                    <Button
                      key={index}
                      variant="transparent"
                      active={!eraser && selectedPalette === index}
                      title={paletteName(palette, index)}
                      onClick={() =>
                        dispatch(
                          editorActions.setSelectedPalette({
                            paletteIndex: index,
                          }),
                        )
                      }
                    >
                      <PaletteBlock colors={palette.colors} />
                    </Button>
                  ))}
                  <Button
                    variant="transparent"
                    active={
                      !eraser && selectedPalette === TILE_COLOR_PROP_PRIORITY
                    }
                    title={l10n("TOOL_TILE_PRIORITY")}
                    onClick={() =>
                      dispatch(
                        editorActions.setSelectedPalette({
                          paletteIndex: TILE_COLOR_PROP_PRIORITY,
                        }),
                      )
                    }
                  >
                    <PriorityTileIcon />
                  </Button>
                </PaintTools>
              )}
              {defaultEditMode === "collisions" && (
                <PaintTools>
                  <Button
                    variant="transparent"
                    active={eraser}
                    title={l10n("FIELD_KEEP")}
                    onClick={() =>
                      dispatch(editorActions.setScenePaintEraser(true))
                    }
                  >
                    <ShieldIcon />
                  </Button>
                  <Button
                    variant="transparent"
                    active={!eraser && selectedTileType === 0}
                    title={l10n("FIELD_NO_COLLISION")}
                    onClick={() =>
                      dispatch(
                        editorActions.setSelectedTileType({
                          tileType: 0,
                          tileMask: 0xff,
                        }),
                      )
                    }
                  >
                    <EraserIcon />
                  </Button>
                  {collisionTileDefs.map((tile, index) => (
                    <Button
                      key={tile.key}
                      variant="transparent"
                      active={
                        !eraser &&
                        isCollisionTileActive(
                          selectedTileType,
                          tile,
                          collisionTileDefs,
                        )
                      }
                      onClick={(e) => selectCollision(index, e)}
                    >
                      <CollisionTileIcon icon={tile.icon} color={tile.color} />
                    </Button>
                  ))}
                </PaintTools>
              )}
              {defaultEditMode === "autotiles" && (
                <PaintTools>
                  <Button
                    variant="transparent"
                    title={l10n("FIELD_AUTOTILE_TYPE_2X2")}
                    active={autotileType === "2x2"}
                    onClick={() => setAutotileType("2x2")}
                  >
                    <Autotile2x2Icon />
                  </Button>
                  <Button
                    variant="transparent"
                    title={l10n("FIELD_AUTOTILE_TYPE_9_SLICE")}
                    active={autotileType === "9slice"}
                    onClick={() => setAutotileType("9slice")}
                  >
                    <Autotile9SliceIcon />
                  </Button>
                </PaintTools>
              )}
            </>
          )}
          {selectedTileset && (
            <PaletteViewport>
              <PaletteSurfaceFrame
                style={{
                  width: tilesetWidth * (paletteZoom / 100),
                  height: tilesetHeight * (paletteZoom / 100),
                }}
              >
                <PaletteSurface
                  data-testid="scene-tile-palette-surface"
                  style={{
                    width: tilesetWidth,
                    height: tilesetHeight,
                    transform: `scale(${paletteZoom / 100})`,
                    transformOrigin: "top left",
                  }}
                  onMouseDown={
                    editingDefaults && defaultEditMode === "autotiles"
                      ? toggleAutotileGroup
                      : editingDefaults
                        ? startDefaultPaint
                        : startTileSelection
                  }
                  onMouseMove={(e) => {
                    if (editingDefaults && defaultEditMode !== "autotiles") {
                      moveDefaultPaint(e);
                    } else if (dragStart.current && e.buttons === 1) {
                      updateTileSelection(e);
                    }
                  }}
                >
                  <ColorizedImage
                    width={tilesetWidth}
                    height={tilesetHeight}
                    src={assetURL("tilesets", selectedTileset)}
                    tiles={displayTileColors}
                    palettes={palettes}
                    previewAsMono={previewAsMono}
                  />
                  {editingDefaults && defaultEditMode === "colors" && (
                    <>
                      {selectedPalette === TILE_COLOR_PROP_PRIORITY && (
                        <ScenePriorityMap
                          width={selectedTileset.width}
                          height={selectedTileset.height}
                          tileColors={displayTileColors}
                        />
                      )}
                      <TilesetUnsetDefaultsOverlay
                        width={selectedTileset.width}
                        height={selectedTileset.height}
                        values={selectedTileset.tileColors}
                        unsetValue={TILE_DEFAULT_UNSET}
                      />
                    </>
                  )}
                  {editingDefaults && defaultEditMode === "collisions" && (
                    <>
                      <SceneCollisions
                        width={selectedTileset.width}
                        height={selectedTileset.height}
                        collisions={displayTileCollisions}
                        sceneTypeKey={scene.type}
                      />
                      <TilesetUnsetDefaultsOverlay
                        width={selectedTileset.width}
                        height={selectedTileset.height}
                        values={selectedTileset.tileCollisions}
                        unsetValue={TILE_DEFAULT_UNSET}
                      />
                    </>
                  )}
                  {editingDefaults &&
                    defaultEditMode === "autotiles" &&
                    selectedTileset.autotiles?.map((definition) => (
                      <SceneAutotileSelection
                        key={`${definition.type}-${definition.startTile}`}
                        tileIndex={definition.startTile}
                        tilesetWidth={selectedTileset.width}
                        type={definition.type}
                      />
                    ))}
                  {!editingDefaults && selectedAutotileType && (
                    <SceneAutotileSelection
                      tileIndex={selectedTileIndex}
                      tilesetWidth={selectedTileset.width}
                      type={selectedAutotileType}
                    />
                  )}
                  {!editingDefaults && !selectedAutotileType && (
                    <TileSelection
                      style={{
                        left:
                          (selectedTileIndex % selectedTileset.width) *
                          TILE_SIZE,
                        top:
                          Math.floor(
                            selectedTileIndex / selectedTileset.width,
                          ) * TILE_SIZE,
                        width: selectedTileWidth * TILE_SIZE,
                        height: selectedTileHeight * TILE_SIZE,
                      }}
                    />
                  )}
                </PaletteSurface>
              </PaletteSurfaceFrame>
            </PaletteViewport>
          )}
        </>
      )}
    </Wrapper>
  );
};

export default React.memo(SceneTilemapPalettePane);
