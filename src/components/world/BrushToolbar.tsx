import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import {
  PaintBucketIcon,
  WandIcon,
  SquareIcon,
  SquareIconSmall,
  EyeOpenIcon,
  EyeClosedIcon,
  PriorityTileIcon,
  SlopeIcon,
  AutoColorIcon,
  CheckIcon,
  BlankIcon,
} from "ui/icons/Icons";
import {
  TOOL_COLORS,
  TOOL_COLLISIONS,
  TOOL_ERASER,
  BRUSH_8PX,
  BRUSH_16PX,
  BRUSH_FILL,
  BRUSH_MAGIC,
  DMG_PALETTE,
  COLLISION_TOP,
  COLLISION_BOTTOM,
  COLLISION_LEFT,
  COLLISION_RIGHT,
  COLLISION_ALL,
  TILE_COLOR_PROP_PRIORITY,
  COLLISION_SLOPE_VALUES,
  BRUSH_SLOPE,
  defaultCollisionTileLabels,
  defaultProjectSettings,
} from "consts";
import PaletteBlock from "components/forms/PaletteBlock";
import editorActions from "store/features/editor/editorActions";
import {
  backgroundSelectors,
  paletteSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesState";
import settingsActions from "store/features/settings/settingsActions";
import navigationActions from "store/features/navigation/navigationActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { PaletteSelect } from "components/forms/PaletteSelect";
import { Brush } from "store/features/editor/editorState";
import { cloneDeep } from "lodash";
import { NavigationSection } from "store/features/navigation/navigationState";
import styled, { css } from "styled-components";
import { FloatingPanel, FloatingPanelDivider } from "ui/panels/FloatingPanel";
import { Button } from "ui/buttons/Button";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuItem, MenuOverlay } from "ui/menu/Menu";
import { RelativePortal } from "ui/layout/RelativePortal";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { paletteName } from "shared/lib/entities/entitiesHelpers";
import { StyledButton } from "ui/buttons/style";
import { Slider } from "ui/form/Slider";
import { StyledFloatingPanel } from "ui/panels/style";
import { CollisionTileIcon } from "components/collisions/CollisionTileIcon";

interface BrushToolbarProps {
  hasFocusForKeyboardShortcuts: () => boolean;
}

const paletteIndexes = [0, 1, 2, 3, 4, 5, 6, 7];
const validTools = [TOOL_COLORS, TOOL_COLLISIONS, TOOL_ERASER];

const collisionDirectionFlags = [
  COLLISION_TOP,
  COLLISION_BOTTOM,
  COLLISION_LEFT,
  COLLISION_RIGHT,
];

function useHiglightPalette() {
  const hoverScene = useAppSelector((state) =>
    sceneSelectors.selectById(state, state.editor.hover.sceneId)
  );
  const background = useAppSelector((state) =>
    backgroundSelectors.selectById(state, hoverScene?.backgroundId ?? "")
  );
  const { x, y } = useAppSelector((state) => state.editor.hover);

  let highlightPalette = -1;
  if (background) {
    highlightPalette = Array.isArray(background.tileColors)
      ? background.tileColors[x + y * background.width]
      : 0;
  }

  return highlightPalette;
}

interface BrushToolbarWrapperProps {
  $visible: boolean;
}

const BrushToolbarWrapper = styled.div<BrushToolbarWrapperProps>`
  position: absolute;
  left: 56px;
  top: ${(props) => (props.$visible ? "10px" : "-80px")};
  transition: top 0.2s ease-in-out;
  z-index: 10;
  display: flex;
  flex-direction: column;

  ${StyledFloatingPanel} {
    flex-wrap: wrap;
    margin-right: 20px;
    margin-bottom: 10px;
    align-self: flex-start;
  }

  ${(props) =>
    !props.$visible
      ? css`
          ${StyledFloatingPanel} {
            flex-wrap: nowrap;
          }
        `
      : ""}
`;

const LayerVisibilityPanel = styled(FloatingPanel)`
  display: flex;
  align-items: center;
  font-size: 11px;
  label {
    color: ${(props) => props.theme.colors.button.text};
  }
  label:first-child {
    padding-left: 1px;
  }
  ${StyledButton} {
    height: 22px;
    svg {
      margin-right: 5px;
    }
  }
`;

const PaletteModal = styled.div`
  position: absolute;
  border-radius: 4px;
  padding: 5px;
  box-shadow: ${(props) => props.theme.colors.menu.boxShadow};
  background: ${(props) => props.theme.colors.menu.background};
  z-index: 1001;
  min-width: 200px;
  ${StyledButton} {
    margin-top: 5px;
  }
`;

const SliderWrapper = styled.div`
  display: flex;
  width: 80px;
  margin-left: 10px;
  margin-right: 5px;
  align-items: center;

  & > * {
    height: 22px;
  }
`;

const BrushToolbar = ({ hasFocusForKeyboardShortcuts }: BrushToolbarProps) => {
  const dispatch = useAppDispatch();

  const sceneId = useAppSelector((state) => state.editor.scene);
  const { selectedPalette, selectedTileType, selectedBrush, showLayers } =
    useAppSelector((state) => state.editor);
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, sceneId)
  );
  const background = useAppSelector((state) =>
    backgroundSelectors.selectById(state, scene?.backgroundId ?? "")
  );
  const selectedTool = useAppSelector((state) => state.editor.tool);
  const visible = validTools.includes(selectedTool);
  const showPalettes = selectedTool === TOOL_COLORS;
  const showTileTypes = selectedTool === TOOL_COLLISIONS;
  const showCollisionSlopeTiles = useAppSelector(
    (state) => state.project.present.settings.showCollisionSlopeTiles
  );
  const showCollisionExtraTiles = useAppSelector(
    (state) => state.project.present.settings.showCollisionExtraTiles
  );
  const collisionLayerOpacity = useAppSelector(
    (state) => state.project.present.settings.collisionLayerOpacity
  );
  const collisionTileLabels = useAppSelector((state) => {
    if (!scene || !scene.type || !state.engine.sceneTypes)
      return defaultCollisionTileLabels;
    const key = scene.type || "";
    const sceneType = state.engine.sceneTypes.find((s) => s.key === key);
    if (sceneType && sceneType.collisionTileLabels)
      return sceneType.collisionTileLabels;
    return defaultCollisionTileLabels;
  });
  const tileTypes = useMemo(
    () =>
      collisionTileLabels.map((tile, index) => {
        const name =
          tile.name && tile.name.trim().length > 0
            ? l10n(tile.name as L10NKey, { tile: index + 1 })
            : l10n("FIELD_COLLISION_TILE_N", { tile: index + 1 });
        return {
          key: tile.key,
          flag: tile.flag,
          mask: tile.mask,
          name: name,
          color: tile.color,
          icon: tile.icon,
        };
      }),
    [collisionTileLabels]
  );

  const setBrush = (brush: Brush) => {
    dispatch(editorActions.setBrush({ brush: brush }));
  };
  const setSection = (section: NavigationSection) => {
    dispatch(navigationActions.setSection(section));
  };
  const setNavigationId = (navigationId: string) => {
    dispatch(navigationActions.setNavigationId(navigationId));
  };

  const highlightPalette = useHiglightPalette();

  const setSelectedPalette =
    (index: number) =>
    (e: KeyboardEvent | React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (showPalettes) {
        dispatch(editorActions.setSelectedPalette({ paletteIndex: index }));
      }
      if (showTileTypes && tileTypes[index]) {
        if (
          e.shiftKey &&
          collisionDirectionFlags.includes(tileTypes[index].flag)
        ) {
          if (
            selectedTileType !== tileTypes[index].flag &&
            selectedTileType & tileTypes[index].flag
          ) {
            dispatch(
              editorActions.setSelectedTileType({
                tileType:
                  selectedTileType & COLLISION_ALL & ~tileTypes[index].flag,
              })
            );
          } else {
            dispatch(
              editorActions.setSelectedTileType({
                tileType:
                  (selectedTileType & COLLISION_ALL) | tileTypes[index].flag,
              })
            );
          }
        } else if (
          e.shiftKey &&
          COLLISION_SLOPE_VALUES.includes(tileTypes[index].flag)
        ) {
          dispatch(
            editorActions.setSelectedTileType({
              tileType: tileTypes[index].flag,
            })
          );
        } else {
          dispatch(
            editorActions.setSelectedTileType({
              tileType: tileTypes[index].flag,
            })
          );
        }
      }
    };

  const palettesLookup = useAppSelector((state) =>
    paletteSelectors.selectEntities(state)
  );
  const defaultBackgroundPaletteIds = useAppSelector(
    (state) => state.project.present.settings.defaultBackgroundPaletteIds
  );
  const palettes = useMemo(
    () =>
      paletteIndexes.map((paletteIndex) => {
        if (!scene) {
          return (
            palettesLookup[defaultBackgroundPaletteIds[paletteIndex]] ||
            DMG_PALETTE
          );
        }
        if (scene.paletteIds && scene.paletteIds[paletteIndex] === "dmg") {
          return DMG_PALETTE;
        }
        return (
          (scene.paletteIds &&
            palettesLookup[scene.paletteIds[paletteIndex]]) ||
          palettesLookup[defaultBackgroundPaletteIds[paletteIndex]] ||
          DMG_PALETTE
        );
      }),
    [defaultBackgroundPaletteIds, palettesLookup, scene]
  );

  const [modalColorIndex, setModalColorIndex] = useState<number>(-1);
  const openReplacePalette = (paletteIndex: number) => () => {
    setModalColorIndex(paletteIndex);
  };
  const closePaletteModal = () => {
    setModalColorIndex(-1);
  };
  useEffect(() => {
    if (selectedTool !== TOOL_COLORS) {
      setModalColorIndex(-1);
    }
  }, [selectedTool]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const startReplacePalette = (paletteIndex: number) => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(openReplacePalette(paletteIndex), 300);
  };
  const onChangePalette = useCallback(
    (newPalette: string) => {
      if (scene) {
        const newIds = cloneDeep(scene.paletteIds ?? []);
        newIds[modalColorIndex] = newPalette;

        dispatch(
          entitiesActions.editScene({
            sceneId,
            changes: {
              paletteIds: newIds,
            },
          })
        );
      } else {
        const newIds = cloneDeep(defaultBackgroundPaletteIds);
        newIds[modalColorIndex] = newPalette;
        dispatch(
          settingsActions.editSettings({ defaultBackgroundPaletteIds: newIds })
        );
      }
      closePaletteModal();
    },
    [defaultBackgroundPaletteIds, dispatch, modalColorIndex, scene, sceneId]
  );

  const onChangeCollisionLayerOpacity = useCallback(
    (opacity?: number) => {
      dispatch(
        settingsActions.editSettings({
          collisionLayerOpacity: opacity,
        })
      );
    },
    [dispatch]
  );

  const onResetCollisionLayerOpacity = useCallback(() => {
    dispatch(
      settingsActions.editSettings({
        collisionLayerOpacity: defaultProjectSettings.collisionLayerOpacity,
      })
    );
  }, [dispatch]);

  const onToggleViewSlopeTiles = useCallback(() => {
    dispatch(
      settingsActions.editSettings({
        showCollisionSlopeTiles: !showCollisionSlopeTiles,
      })
    );
  }, [dispatch, showCollisionSlopeTiles]);

  const onToggleViewExtraTiles = useCallback(() => {
    dispatch(
      settingsActions.editSettings({
        showCollisionExtraTiles: !showCollisionExtraTiles,
      })
    );
  }, [dispatch, showCollisionExtraTiles]);

  const onToggleAutoColor = useCallback(() => {
    scene?.backgroundId &&
      dispatch(
        entitiesActions.editBackgroundAutoColor({
          backgroundId: scene.backgroundId,
          autoColor: !background?.autoColor,
        })
      );
  }, [dispatch, scene?.backgroundId, background]);

  const onMouseUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.shiftKey || e.metaKey) {
      return;
    }
    if (!hasFocusForKeyboardShortcuts()) {
      return;
    }
    if (e.code === "Digit1") {
      setSelectedPalette(0)(e);
    } else if (e.code === "Digit2") {
      setSelectedPalette(1)(e);
    } else if (e.code === "Digit3") {
      setSelectedPalette(2)(e);
    } else if (e.code === "Digit4") {
      setSelectedPalette(3)(e);
    } else if (e.code === "Digit5") {
      setSelectedPalette(4)(e);
    } else if (e.code === "Digit6") {
      setSelectedPalette(5)(e);
    } else if (e.code === "Digit7") {
      setSelectedPalette(6)(e);
    } else if (e.code === "Digit8") {
      setBrush(BRUSH_8PX);
    } else if (e.code === "Digit9") {
      setBrush(BRUSH_16PX);
    } else if (e.code === "Digit0") {
      setBrush(BRUSH_FILL);
    } else if (e.code === "Minus") {
      toggleShowLayers();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  });

  const toggleShowLayers = () => {
    dispatch(editorActions.setShowLayers({ showLayers: !showLayers }));
  };

  return (
    <>
      <BrushToolbarWrapper $visible={visible}>
        <FloatingPanel>
          <Button
            variant="transparent"
            onClick={() => setBrush(BRUSH_8PX)}
            active={selectedBrush === BRUSH_8PX}
            title={`${l10n("TOOL_BRUSH", { size: "8px" })} (8)`}
          >
            <SquareIconSmall />
          </Button>
          <Button
            variant="transparent"
            onClick={() => setBrush(BRUSH_16PX)}
            active={selectedBrush === BRUSH_16PX}
            title={`${l10n("TOOL_BRUSH", { size: "16px" })} (9)`}
          >
            <SquareIcon />
          </Button>
          <Button
            variant="transparent"
            onClick={() => setBrush(BRUSH_FILL)}
            active={selectedBrush === BRUSH_FILL}
            title={`${l10n("TOOL_FILL")} (0)`}
          >
            <PaintBucketIcon />
          </Button>
          <Button
            variant="transparent"
            onClick={() => setBrush(BRUSH_MAGIC)}
            active={selectedBrush === BRUSH_MAGIC}
            title={`${l10n("TOOL_MAGIC")}`}
          >
            <WandIcon />
          </Button>
          {showTileTypes && (
            <Button
              variant="transparent"
              onClick={() => setBrush(BRUSH_SLOPE)}
              active={selectedBrush === BRUSH_SLOPE}
              title={`${l10n("TOOL_SLOPE")}`}
            >
              <SlopeIcon />
            </Button>
          )}
          {(showPalettes || showTileTypes) && <FloatingPanelDivider />}
          {showPalettes &&
            !background?.autoColor &&
            paletteIndexes.map((paletteIndex) => (
              <Button
                variant="transparent"
                key={paletteIndex}
                onClick={setSelectedPalette(paletteIndex)}
                onMouseDown={startReplacePalette(paletteIndex)}
                active={paletteIndex === selectedPalette}
                title={`${l10n("TOOL_PALETTE_N", {
                  number: paletteIndex + 1,
                })} (${paletteIndex + 1}) - ${paletteName(
                  palettes[paletteIndex],
                  -1
                )}`}
              >
                <PaletteBlock
                  colors={palettes[paletteIndex]?.colors ?? []}
                  highlight={paletteIndex === highlightPalette}
                />
              </Button>
            ))}
          {showPalettes && background && (
            <Button
              variant="transparent"
              onClick={onToggleAutoColor}
              active={background.autoColor}
              title={l10n("FIELD_AUTO_COLOR")}
            >
              <AutoColorIcon />
            </Button>
          )}
          {showPalettes && <FloatingPanelDivider />}
          {showPalettes && (
            <Button
              variant="transparent"
              onClick={
                TILE_COLOR_PROP_PRIORITY !== selectedPalette
                  ? setSelectedPalette(TILE_COLOR_PROP_PRIORITY)
                  : setSelectedPalette(0)
              }
              active={TILE_COLOR_PROP_PRIORITY === selectedPalette}
              title={l10n("TOOL_TILE_PRIORITY")}
            >
              <PriorityTileIcon />
            </Button>
          )}
          {selectedBrush !== BRUSH_SLOPE && showTileTypes && (
            <>
              {tileTypes.map((tileType, tileTypeIndex) => {
                if (
                  !showCollisionSlopeTiles &&
                  tileType.key?.startsWith("slope_")
                )
                  return <></>;
                if (
                  !showCollisionExtraTiles &&
                  tileType.key?.startsWith("spare_")
                )
                  return <></>;
                return (
                  <>
                    {tileTypeIndex > 0 &&
                      tileType.mask !== tileTypes[tileTypeIndex - 1].mask && (
                        <FloatingPanelDivider />
                      )}
                    <Button
                      variant="transparent"
                      key={tileType.key}
                      onClick={setSelectedPalette(tileTypeIndex)}
                      active={tileType.flag === selectedTileType}
                      title={
                        tileTypeIndex < 6
                          ? `${tileType.name} (${tileTypeIndex + 1})`
                          : tileType.name
                      }
                    >
                      <CollisionTileIcon
                        icon={tileType.icon}
                        color={tileType.color}
                      />
                    </Button>
                  </>
                );
              })}
              <FloatingPanelDivider />
            </>
          )}
          {selectedBrush !== BRUSH_SLOPE && showTileTypes && (
            <DropdownButton
              size="small"
              variant="transparent"
              menuDirection="right"
            >
              <MenuItem
                onClick={onToggleViewSlopeTiles}
                icon={showCollisionSlopeTiles ? <CheckIcon /> : <BlankIcon />}
              >
                {l10n("FIELD_VIEW_SLOPE_TILES")}
              </MenuItem>
              <MenuItem
                onClick={onToggleViewExtraTiles}
                icon={showCollisionExtraTiles ? <CheckIcon /> : <BlankIcon />}
              >
                {l10n("FIELD_VIEW_EXTRA_TILES")}
              </MenuItem>
            </DropdownButton>
          )}
        </FloatingPanel>
        <LayerVisibilityPanel>
          {selectedTool === TOOL_COLLISIONS && (
            <>
              <label
                id="collisionLayerOpacityLabel"
                onClick={onResetCollisionLayerOpacity}
              >
                {l10n("FIELD_LAYER_OPACITY")}
              </label>
              <SliderWrapper
                title={`${l10n(
                  "FIELD_LAYER_OPACITY"
                )} (${collisionLayerOpacity}%)`}
              >
                <Slider
                  labelledBy="collisionLayerOpacityLabel"
                  value={collisionLayerOpacity}
                  min={0}
                  max={100}
                  step={10}
                  onChange={onChangeCollisionLayerOpacity}
                ></Slider>
              </SliderWrapper>
              <FloatingPanelDivider />
            </>
          )}

          <Button
            style={{ width: "auto" }}
            variant="transparent"
            onClick={toggleShowLayers}
            active={!showLayers}
            title={`${
              showLayers ? l10n("TOOL_HIDE_LAYERS") : l10n("TOOL_SHOW_LAYERS")
            } (-)`}
          >
            {showLayers ? <EyeOpenIcon /> : <EyeClosedIcon />}
            {l10n("FIELD_HIDE_OTHER_LAYERS")}
          </Button>
        </LayerVisibilityPanel>
      </BrushToolbarWrapper>

      {modalColorIndex > -1 && (
        <>
          <MenuOverlay onClick={closePaletteModal} />
          <RelativePortal>
            <PaletteModal
              style={{
                left: 200 + 36 * modalColorIndex,
                top: 30,
              }}
            >
              <PaletteSelect
                value={scene?.paletteIds?.[modalColorIndex] || ""}
                optional
                optionalDefaultPaletteId={
                  defaultBackgroundPaletteIds[modalColorIndex] || ""
                }
                optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
                prefix={`${modalColorIndex + 1}: `}
                onChange={onChangePalette}
                name={""}
              />
              <Button
                variant="normal"
                size="small"
                onClick={() => {
                  setSection("palettes");
                  setNavigationId(
                    (palettes[modalColorIndex] &&
                      palettes[modalColorIndex]?.id) ??
                      ""
                  );
                }}
              >
                {l10n("FIELD_EDIT_PALETTES")}
              </Button>
            </PaletteModal>
          </RelativePortal>
        </>
      )}
    </>
  );
};

export default BrushToolbar;
