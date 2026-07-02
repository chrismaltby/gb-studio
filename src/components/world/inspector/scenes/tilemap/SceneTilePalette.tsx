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
  useAppSelectorPickArray,
} from "store/hooks";
import {
  sceneSelectors,
  tilesetSelectors,
} from "store/features/entities/entitiesSelectors";
import entitiesActions from "store/features/entities/entitiesActions";
import editorActions from "store/features/editor/editorActions";
import settingsActions from "store/features/settings/settingsActions";
import { TilesetSelect } from "components/forms/TilesetSelect";
import { Button } from "ui/buttons/Button";
import { assetURL } from "shared/lib/helpers/assets";
import { TILE_SIZE, TOOL_TILES } from "consts";
import l10n from "shared/lib/lang/l10n";
import { EyeClosedIcon, EyeOpenIcon, PlusIcon } from "ui/icons/Icons";
import { ZoomButton } from "ui/buttons/ZoomButton";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { FormContainer, FormField, FormRow } from "ui/form/layout/FormLayout";
import { FixedSpacer } from "ui/spacing/Spacing";
import { SplitPaneVerticalDivider } from "ui/splitpane/SplitPaneDivider";
import { FlatList } from "ui/lists/FlatList";
import { EntityListItem } from "ui/lists/EntityListItem";
import renderTilemapLayerContextMenu from "components/world/contextMenus/renderTilemapLayerContextMenu";

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

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
    pointer-events: none;
  }
`;

const TileSelection = styled.div`
  position: absolute;
  pointer-events: none;
  border: 2px solid ${(props) => props.theme.colors.highlight};
  box-sizing: border-box;
  box-shadow: 0 0 0 1px ${(props) => props.theme.colors.highlightText};
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

const SceneTilePalette = ({ sceneId }: SceneTilePaletteProps) => {
  const dispatch = useAppDispatch();
  const sceneExists = useAppSelector((state) =>
    Boolean(sceneSelectors.selectById(state, sceneId)),
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
  const preferredTilesetId = useAppSelector(
    (state) => state.project.present.settings.selectedSceneTilesetId,
  );
  const selectedTileset = useAppSelector((state) =>
    tilesetSelectors.selectById(state, selectedTilesetId),
  );
  const [paletteZoom, setPaletteZoom] = useState(200);
  const [renameLayerId, setRenameLayerId] = useState("");
  const dragStart = useRef<{ x: number; y: number } | undefined>(undefined);

  const displayLayers = useMemo(() => [...layers].reverse(), [layers]);
  const tilesetWidth = (selectedTileset?.width ?? 0) * TILE_SIZE;
  const tilesetHeight = (selectedTileset?.height ?? 0) * TILE_SIZE;

  useEffect(() => {
    const clearDrag = () => {
      dragStart.current = undefined;
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
          autotile: false,
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
      dispatch(editorActions.setTool({ tool: TOOL_TILES }));
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
          autotile: false,
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
      if (!position) return;
      e.preventDefault();
      dragStart.current = position;
      updateTileSelection(e);
    },
    [getTilePosition, updateTileSelection],
  );

  if (!sceneExists) return null;
  const tilemap = hasTilemap ? { layers } : undefined;

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
                const action = entitiesActions.addTilemapLayer({ sceneId });
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
            <EntityListItem
              item={layer}
              type="custom"
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
                <TilesetSelect
                  name="paintTilesetId"
                  value={selectedTilesetId}
                  onChange={selectTileset}
                />
              </FormField>
            </FormRow>
          </FormContainer>
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
                  onMouseDown={startTileSelection}
                  onMouseMove={(e) => {
                    if (dragStart.current && e.buttons === 1) {
                      updateTileSelection(e);
                    }
                  }}
                >
                  <img src={assetURL("tilesets", selectedTileset)} alt="" />
                  <TileSelection
                    style={{
                      left:
                        (selectedTileIndex % selectedTileset.width) * TILE_SIZE,
                      top:
                        Math.floor(selectedTileIndex / selectedTileset.width) *
                        TILE_SIZE,
                      width: selectedTileWidth * TILE_SIZE,
                      height: selectedTileHeight * TILE_SIZE,
                    }}
                  />
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
