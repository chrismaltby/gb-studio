import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useAppDispatch,
  useAppSelector,
  useAppSelectorPick,
  useAppSelectorPickArray,
} from "store/hooks";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import entitiesActions from "store/features/entities/entitiesActions";
import editorActions from "store/features/editor/editorActions";
import { Button } from "ui/buttons/Button";
import l10n from "shared/lib/lang/l10n";
import { EyeClosedIcon, EyeOpenIcon, PlusIcon } from "ui/icons/Icons";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { FlatList } from "ui/lists/FlatList";
import { EntityListItemDnD } from "ui/lists/EntityListItemDnD";
import renderTilemapLayerContextMenu from "components/world/contextMenus/renderTilemapLayerContextMenu";
import ItemTypes from "renderer/lib/dnd/itemTypes";
import styled, { css } from "styled-components";

interface SceneTilemapLayersPaneProps {
  sceneId: string;
}

const VisibilityButton = styled.div<{ $visible: boolean }>`
  button {
    width: 24px;
    margin-right: 5px;
    svg {
      margin: 0;
      width: 12px;
      height: 12px;
      max-width: 12px;
      max-height: 12px;

      ${(props) =>
        props.$visible
          ? css`
              fill: ${props.theme.colors.text};
            `
          : css`
              opacity: 0.5;
            `}
    }
  }
`;

const layerDragTypes = [ItemTypes.TILEMAP_LAYER];

const SceneTilemapLayersPane = ({ sceneId }: SceneTilemapLayersPaneProps) => {
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

  const selectedLayerId = useAppSelector(
    (state) => state.editor.selectedTilemapLayerId,
  );

  const [renameLayerId, setRenameLayerId] = useState("");
  const dragStart = useRef<{ x: number; y: number } | undefined>(undefined);

  const defaultPaintLast = useRef<{ x: number; y: number } | undefined>(
    undefined,
  );

  const displayLayers = useMemo(() => [...layers].reverse(), [layers]);

  useEffect(() => {
    const clearDrag = () => {
      dragStart.current = undefined;
      defaultPaintLast.current = undefined;
    };
    window.addEventListener("mouseup", clearDrag);
    return () => window.removeEventListener("mouseup", clearDrag);
  }, []);

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

  if (!scene) return null;
  const tilemap = hasTilemap ? { layers } : undefined;

  return (
    <>
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
        borderTop
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
                <VisibilityButton $visible={layer.visible}>
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
                </VisibilityButton>
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
    </>
  );
};

export default React.memo(SceneTilemapLayersPane);
