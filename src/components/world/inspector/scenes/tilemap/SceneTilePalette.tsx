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
  EyeClosedIcon,
  EyeOpenIcon,
  PlusIcon,
  PencilIcon,
  EraserIcon,
  PriorityTileIcon,
  ShieldIcon,
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
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { FormContainer, FormField, FormRow } from "ui/form/layout/FormLayout";
import { FixedSpacer } from "ui/spacing/Spacing";
import { InputGroup, InputGroupAppend } from "ui/form/InputGroup";
import { SplitPaneVerticalDivider } from "ui/splitpane/SplitPaneDivider";
import { FlatList } from "ui/lists/FlatList";
import { EntityListItemDnD } from "ui/lists/EntityListItemDnD";
import renderTilemapLayerContextMenu from "components/world/contextMenus/renderTilemapLayerContextMenu";
import { TabBar } from "ui/tabs/Tabs";
import ItemTypes from "renderer/lib/dnd/itemTypes";

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
  overflow: hidden;

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
  border: 2px solid ${(props) => props.theme.colors.highlight};
  box-sizing: border-box;
  box-shadow: 0 0 0 1px ${(props) => props.theme.colors.highlightText};
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

const TileSelectionLabel = styled.div`
  position: sticky;
  bottom: 0;
  z-index: 1;
  background: ${(props) => props.theme.colors.sidebar.background};
  padding: 5px 10px;
  font-size: 11px;
`;

interface SceneTilePaletteProps {
  sceneId: string;
}

const paletteZoomLevels = [100, 200, 400, 800, 1600];
const layerDragTypes = [ItemTypes.TILEMAP_LAYER];

const SceneTilePalette = ({ sceneId }: SceneTilePaletteProps) => {
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
    "autotileGroups",
  ] as const);

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
  const selectedAutotile = selectedSceneTile?.autotile ?? false;

  const preferredTilesetId = useAppSelector(
    (state) => state.project.present.settings.selectedSceneTilesetId,
  );
  const selectedTileset = useAppSelector((state) =>
    tilesetSelectors.selectById(state, selectedTilesetId),
  );
  const [paletteZoom, setPaletteZoom] = useState(200);
  const [editingDefaults, setEditingDefaults] = useState(false);
  const [defaultEditMode, setDefaultEditMode] = useState<
    "colors" | "collisions" | "autotiles"
  >("collisions");

  const [renameLayerId, setRenameLayerId] = useState("");
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

  const displayLayers = useMemo(() => [...layers].reverse(), [layers]);
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

  const canAutotile =
    Boolean(selectedTileset) &&
    selectedTileWidth === 1 &&
    selectedTileHeight === 1 &&
    selectedTileIndex >= 0 &&
    Boolean(selectedTileset?.autotileGroups?.includes(selectedTileIndex));

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
      colors: l10n("FIELD_COLORS"),
      autotiles: l10n("FIELD_AUTOTILES"),
    }),
    [],
  );

  useEffect(() => {
    if (selectedAutotile && !canAutotile) {
      dispatch(editorActions.setSelectedSceneTileAutotile(false));
    }
  }, [canAutotile, dispatch, selectedAutotile]);

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
          autotile: Boolean(tileset.autotileGroups?.includes(0)),
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

  const selectLayer = useCallback(
    (layerId: string) => {
      dispatch(editorActions.setSelectedTilemapLayerId(layerId));
    },
    [dispatch],
  );

  const selectTileset = useCallback(
    (tilesetId: string) => {
      const tileset = tilesets.find((item) => item.id === tilesetId);
      dispatch(
        editorActions.selectSceneTileForPainting({
          tilesetId,
          tileIndex: 0,
          tilesetWidth: tileset?.width,
          autotile: Boolean(tileset?.autotileGroups?.includes(0)),
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
      const autotileGroup = selectedTileset.autotileGroups?.find(
        (tileIndex) => {
          const groupX = tileIndex % selectedTileset.width;
          const groupY = Math.floor(tileIndex / selectedTileset.width);
          return (
            position.x >= groupX &&
            position.x < groupX + 4 &&
            position.y >= groupY &&
            position.y < groupY + 4
          );
        },
      );

      if (autotileGroup !== undefined) {
        dragStart.current = undefined;
        const selectIndividualTile =
          selectedAutotile && selectedTileIndex === autotileGroup;
        dispatch(
          editorActions.selectSceneTileForPainting({
            tilesetId: selectedTileset.id,
            tileIndex: selectIndividualTile ? clickedIndex : autotileGroup,
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
      selectedAutotile,
      selectedTileIndex,
      selectedTileset,
      updateTileSelection,
    ],
  );

  const toggleAutotileGroup = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const position = getTilePosition(e);
      if (!selectedTileset || !position) return;
      e.preventDefault();
      dispatch(
        entitiesActions.toggleTilesetAutotileGroup({
          tilesetId: selectedTileset.id,
          tileIndex: position.y * selectedTileset.width + position.x,
        }),
      );
    },
    [dispatch, getTilePosition, selectedTileset],
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

  if (!scene) return null;
  const tilemap = hasTilemap ? { layers } : undefined;

  const selectCollision = (
    tileIndex: number,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    const tile = collisionTileDefs[tileIndex];
    if (!tile) return;
    let value = tile.flag;
    const mask = tile.mask ?? 0xff;
    if (e.shiftKey && tile.multi) {
      value =
        selectedTileType & tile.flag
          ? selectedTileType & mask & ~tile.flag
          : (selectedTileType & mask) | tile.flag;
    }
    if (e.shiftKey && tile.extra !== undefined) value |= tile.extra;
    dispatch(
      editorActions.setSelectedTileType({ tileType: value, tileMask: mask }),
    );
  };

  return (
    <Wrapper>
      <SplitPaneVerticalDivider />
      <SplitPaneHeader
        collapsed={false}
        buttons={
          tilemap ? (
            <Button
              variant="transparent"
              size="small"
              title={l10n("FIELD_ADD_LAYER")}
              onClick={() => {
                const action = entitiesActions.addTilemapLayer({
                  sceneId,
                  afterLayerId: selectedLayerId,
                });
                dispatch(action);
                selectLayer(action.payload.layerId);
              }}
            >
              <PlusIcon />
            </Button>
          ) : null
        }
      >
        {l10n("FIELD_LAYERS")}
      </SplitPaneHeader>
      {tilemap && (
        <FlatList
          items={displayLayers}
          selectedId={selectedLayerId}
          setSelectedId={selectLayer}
          height={displayLayers.length * 25}
          onKeyDown={(e) => {
            if (e.key === "Enter" && selectedLayerId) {
              setRenameLayerId(selectedLayerId);
            }
          }}
        >
          {({ item: layer }) => (
            <EntityListItemDnD
              item={layer}
              type="custom"
              dragType={ItemTypes.TILEMAP_LAYER}
              acceptTypes={layerDragTypes}
              onDrop={(draggedLayer, targetLayer) => {
                const draggedIndex = layers.findIndex(
                  (candidate) => candidate.id === draggedLayer.id,
                );
                const targetIndex = layers.findIndex(
                  (candidate) => candidate.id === targetLayer.id,
                );
                if (
                  draggedIndex < 0 ||
                  targetIndex < 0 ||
                  draggedIndex === targetIndex
                ) {
                  return;
                }
                dispatch(
                  entitiesActions.moveTilemapLayer({
                    sceneId,
                    layerId: draggedLayer.id,
                    direction: targetIndex - draggedIndex,
                  }),
                );
              }}
              icon={
                <Button
                  size="small"
                  variant="transparent"
                  title={
                    layer.visible
                      ? l10n("FIELD_HIDE_LAYER")
                      : l10n("FIELD_SHOW_LAYER")
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(
                      entitiesActions.editTilemapLayer({
                        sceneId,
                        layerId: layer.id,
                        changes: { visible: !layer.visible },
                      }),
                    );
                  }}
                >
                  {layer.visible ? <EyeOpenIcon /> : <EyeClosedIcon />}
                </Button>
              }
              rename={renameLayerId === layer.id}
              onRename={(name) => {
                dispatch(
                  entitiesActions.editTilemapLayer({
                    sceneId,
                    layerId: layer.id,
                    changes: { name },
                  }),
                );
                setRenameLayerId("");
              }}
              onRenameCancel={() => setRenameLayerId("")}
              renderContextMenu={() =>
                renderTilemapLayerContextMenu({
                  dispatch,
                  sceneId,
                  layerId: layer.id,
                  layerIndex: layers.findIndex(
                    (candidate) => candidate.id === layer.id,
                  ),
                  layerCount: layers.length,
                  visible: layer.visible,
                  onRename: () => setRenameLayerId(layer.id),
                })
              }
            />
          )}
        </FlatList>
      )}
      <FixedSpacer height={5} />
      {tilemap && (
        <>
          <SplitPaneVerticalDivider />
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
          >
            {l10n("FIELD_TILES")}
          </SplitPaneHeader>
          <FormContainer>
            <FixedSpacer height={10} />
            <FormRow>
              <FormField name="">
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
              </FormField>
            </FormRow>
          </FormContainer>
          {editingDefaults && (
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
                    selectedTileset.autotileGroups?.map((tileIndex) => (
                      <SceneAutotileSelection
                        key={tileIndex}
                        tileIndex={tileIndex}
                        tilesetWidth={selectedTileset.width}
                      />
                    ))}
                  {!editingDefaults && selectedAutotile && canAutotile && (
                    <SceneAutotileSelection
                      tileIndex={selectedTileIndex}
                      tilesetWidth={selectedTileset.width}
                    />
                  )}
                  {!editingDefaults && (!selectedAutotile || !canAutotile) && (
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
          <TileSelectionLabel>
            {l10n("FIELD_TILE_N", {
              tile: selectedTileIndex >= 0 ? selectedTileIndex : "—",
            })}
            {selectedTileWidth > 1 || selectedTileHeight > 1
              ? ` (${selectedTileWidth}×${selectedTileHeight})`
              : ""}
          </TileSelectionLabel>
        </>
      )}
    </Wrapper>
  );
};

export default React.memo(SceneTilePalette);
