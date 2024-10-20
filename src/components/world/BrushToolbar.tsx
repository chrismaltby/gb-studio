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
  TILE_PROP_LADDER,
  TILE_COLOR_PROP_PRIORITY,
  COLLISION_SLOPE_45_RIGHT,
  COLLISION_SLOPE_22_RIGHT_BOT,
  COLLISION_SLOPE_22_RIGHT_TOP,
  COLLISION_SLOPE_45_LEFT,
  COLLISION_SLOPE_22_LEFT_BOT,
  COLLISION_SLOPE_22_LEFT_TOP,
  COLLISION_SLOPE_VALUES,
  BRUSH_SLOPE,
  COLLISIONS_EXTRA_SYMBOLS,
  defaultCollisionTileLabels,
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
import {
  BrushToolbarExtraTileIcon,
  BrushToolbarLadderTileIcon,
  BrushToolbarTileBottomIcon,
  BrushToolbarTileLeftIcon,
  BrushToolbarTileRightIcon,
  BrushToolbarTileSlope22LeftBottomIcon,
  BrushToolbarTileSlope22LeftTopIcon,
  BrushToolbarTileSlope22RightBottomIcon,
  BrushToolbarTileSlope22RightTopIcon,
  BrushToolbarTileSlope45LeftIcon,
  BrushToolbarTileSlope45RightIcon,
  BrushToolbarTileSolidIcon,
  BrushToolbarTileTopIcon,
} from "./BrushToolbarIcons";
import { RelativePortal } from "ui/layout/RelativePortal";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { paletteName } from "shared/lib/entities/entitiesHelpers";
import { StyledButton } from "ui/buttons/style";
import { Slider } from "ui/form/Slider";
import { CollisionTileLabel } from "shared/lib/resources/types";

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

export const getTileIcon = (t: CollisionTileLabel) => {
  switch (t.key) {
    case "solid": return <BrushToolbarTileSolidIcon $color={t.color}/>
    case "top": return <BrushToolbarTileTopIcon $color={t.color}/>
    case "bottom": return <BrushToolbarTileBottomIcon $color={t.color}/>
    case "left": return <BrushToolbarTileLeftIcon $color={t.color}/>
    case "right": return <BrushToolbarTileRightIcon $color={t.color}/>
    case "ladder": return <BrushToolbarLadderTileIcon $color={t.color}/>
    case "slope_45_right": return <BrushToolbarTileSlope45RightIcon $color={t.color}/>
    case "slope_45_left": return <BrushToolbarTileSlope45LeftIcon $color={t.color}/>
    case "slope_22_right_bot": return <BrushToolbarTileSlope22RightBottomIcon $color={t.color}/>
    case "slope_22_right_top": return <BrushToolbarTileSlope22RightTopIcon $color={t.color}/>
    case "slope_22_left_top": return <BrushToolbarTileSlope22LeftTopIcon $color={t.color}/>
    case "slope_22_left_bot": return <BrushToolbarTileSlope22LeftBottomIcon $color={t.color}/>
    case "spare_08": return <BrushToolbarExtraTileIcon $value={"8"} $color={t.color}/>
    case "spare_09": return <BrushToolbarExtraTileIcon $value={"9"} $color={t.color}/>
    case "spare_10": return <BrushToolbarExtraTileIcon $value={"A"} $color={t.color}/>
    case "spare_11": return <BrushToolbarExtraTileIcon $value={"B"} $color={t.color}/>
    case "spare_12": return <BrushToolbarExtraTileIcon $value={"C"} $color={t.color}/>
    case "spare_13": return <BrushToolbarExtraTileIcon $value={"D"} $color={t.color}/>
    case "spare_14": return <BrushToolbarExtraTileIcon $value={"E"} $color={t.color}/>
    case "spare_15": return <BrushToolbarExtraTileIcon $value={"F"} $color={t.color}/>
    default: return <BrushToolbarExtraTileIcon $value={""} $color={t.color}/>
  }
}

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

const BrushToolbarWrapper = styled(FloatingPanel)<BrushToolbarWrapperProps>`
  position: absolute;
  left: 56px;
  top: ${(props) => (props.$visible ? "10px" : "-45px")};
  transition: top 0.2s ease-in-out;
  z-index: 10;
  flex-wrap: wrap;
  margin-right: 20px;

  ${(props) =>
    !props.$visible
      ? css`
          flex-wrap: nowrap;
        `
      : ""}
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
  width: 32px;
  align-items: center;
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
  const collisionTileLabels = useAppSelector(
    (state) => state.project.present.settings.collisionTileLabels
  );

  const tileTypes = useMemo(
    () => collisionTileLabels.map((t) => {
      const name = t.name && t.name.trim().length > 0 ? l10n(t.name as L10NKey) : undefined;
      const icon = t.icon ? <BrushToolbarExtraTileIcon $value={t.icon[0]} $color={t.color}/> : getTileIcon(t);
      
      return {
        key: t.key,
        flag: t.flag,
        mask: t.mask,
        name: name,
        color: t.color,
        icon: icon,
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

  const setSelectedPalette = //TODO!!!!!!!!!!!!!!!!!!!!!!!!!!
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

  const onCollisionAlphaChanged = useCallback(
    (a?: number) => {
      dispatch(
        settingsActions.editSettings({
          collisionLayerOpacity: a,
        })
      );
    },
    [dispatch]
  );

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
        <FloatingPanelDivider />
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
        {showPalettes && <FloatingPanelDivider />}
        {selectedBrush !== BRUSH_SLOPE && showTileTypes && (
          <>
            {tileTypes.map((tileType, tileTypeIndex) => (
              <>
                {tileTypeIndex > 0 && tileType.mask != tileTypes[tileTypeIndex-1].mask && <FloatingPanelDivider />}
                <Button
                  variant="transparent"
                  key={tileType.name}
                  onClick={setSelectedPalette(tileTypeIndex)}
                  active={tileType.flag === selectedTileType}
                  title={`${tileType.name} (${tileTypeIndex + 1})`}
                >
                  {tileType.icon}
                </Button>
              </>
            ))}

            {/* {showCollisionSlopeTiles && ( */}
             
            {/* {showCollisionExtraTiles && ( */}

            <FloatingPanelDivider />
          </>
        )}

        {showTileTypes && (
          <SliderWrapper>
            <Slider
              value={collisionLayerOpacity}
              min={0}
              max={100}
              onChange={onCollisionAlphaChanged}
            ></Slider>
          </SliderWrapper>
        )}

        <Button
          variant="transparent"
          onClick={toggleShowLayers}
          active={!showLayers}
          title={`${
            showLayers ? l10n("TOOL_HIDE_LAYERS") : l10n("TOOL_SHOW_LAYERS")
          } (-)`}
        >
          {showLayers ? <EyeOpenIcon /> : <EyeClosedIcon />}
        </Button>

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
