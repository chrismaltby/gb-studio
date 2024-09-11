import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import l10n from "shared/lib/lang/l10n";
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
import { Checkbox } from "ui/form/Checkbox";
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

  const tileTypes = useMemo(
    () => [
      {
        key: "solid",
        name: l10n("FIELD_SOLID"),
        flag: COLLISION_ALL,
        icon: <BrushToolbarTileSolidIcon />,
      },
      {
        key: "top",
        name: l10n("FIELD_COLLISION_TOP"),
        flag: COLLISION_TOP,
        icon: <BrushToolbarTileTopIcon />,
      },
      {
        key: "bottom",
        name: l10n("FIELD_COLLISION_BOTTOM"),
        flag: COLLISION_BOTTOM,
        icon: <BrushToolbarTileBottomIcon />,
      },
      {
        key: "left",
        name: l10n("FIELD_COLLISION_LEFT"),
        flag: COLLISION_LEFT,
        icon: <BrushToolbarTileLeftIcon />,
      },
      {
        key: "right",
        name: l10n("FIELD_COLLISION_RIGHT"),
        flag: COLLISION_RIGHT,
        icon: <BrushToolbarTileRightIcon />,
      },
      {
        key: "ladder",
        name: l10n("FIELD_COLLISION_LADDER"),
        flag: TILE_PROP_LADDER,
        icon: <BrushToolbarLadderTileIcon />,
      },
      {
        key: "slope_45_right",
        name: l10n("FIELD_COLLISION_SLOPE_45_RIGHT"),
        flag: COLLISION_SLOPE_45_RIGHT,
        extra: COLLISION_BOTTOM | COLLISION_RIGHT,
        icon: <BrushToolbarTileSlope45RightIcon />,
      },
      {
        key: "slope_45_left",
        name: l10n("FIELD_COLLISION_SLOPE_45_LEFT"),
        flag: COLLISION_SLOPE_45_LEFT,
        extra: COLLISION_BOTTOM | COLLISION_LEFT,
        icon: <BrushToolbarTileSlope45LeftIcon />,
      },
      {
        key: "slope_22_right_bot",
        name: l10n("FIELD_COLLISION_SLOPE_22_RIGHT_BOT"),
        flag: COLLISION_SLOPE_22_RIGHT_BOT,
        extra: COLLISION_BOTTOM,
        icon: <BrushToolbarTileSlope22RightBottomIcon />,
      },
      {
        key: "slope_22_right_top",
        name: l10n("FIELD_COLLISION_SLOPE_22_RIGHT_TOP"),
        flag: COLLISION_SLOPE_22_RIGHT_TOP,
        extra: COLLISION_BOTTOM | COLLISION_RIGHT,
        icon: <BrushToolbarTileSlope22RightTopIcon />,
      },
      {
        key: "slope_22_left_top",
        name: l10n("FIELD_COLLISION_SLOPE_22_LEFT_TOP"),
        flag: COLLISION_SLOPE_22_LEFT_TOP,
        extra: COLLISION_BOTTOM | COLLISION_LEFT,
        icon: <BrushToolbarTileSlope22LeftTopIcon />,
      },
      {
        key: "slope_22_left_bot",
        name: l10n("FIELD_COLLISION_SLOPE_22_LEFT_BOT"),
        flag: COLLISION_SLOPE_22_LEFT_BOT,
        extra: COLLISION_BOTTOM,
        icon: <BrushToolbarTileSlope22LeftBottomIcon />,
      },
      {
        key: "spare_08",
        name: l10n("FIELD_COLLISION_SPARE", { tile: 8 }),
        flag: 0x80,
        icon: <BrushToolbarExtraTileIcon $value="8" />,
      },
      {
        key: "spare_09",
        name: l10n("FIELD_COLLISION_SPARE", { tile: 9 }),
        flag: 0x90,
        icon: <BrushToolbarExtraTileIcon $value="9" />,
      },
      {
        key: "spare_10",
        name: l10n("FIELD_COLLISION_SPARE", { tile: 10 }),
        flag: 0xa0,
        icon: <BrushToolbarExtraTileIcon $value="10" />,
      },
      {
        key: "spare_11",
        name: l10n("FIELD_COLLISION_SPARE", { tile: 11 }),
        flag: 0xb0,
        icon: <BrushToolbarExtraTileIcon $value="11" />,
      },
      {
        key: "spare_12",
        name: l10n("FIELD_COLLISION_SPARE", { tile: 12 }),
        flag: 0xc0,
        icon: <BrushToolbarExtraTileIcon $value="12" />,
      },
      {
        key: "spare_13",
        name: l10n("FIELD_COLLISION_SPARE", { tile: 13 }),
        flag: 0xd0,
        icon: <BrushToolbarExtraTileIcon $value="13" />,
      },
      {
        key: "spare_14",
        name: l10n("FIELD_COLLISION_SPARE", { tile: 14 }),
        flag: 0xe0,
        icon: <BrushToolbarExtraTileIcon $value="14" />,
      },
      {
        key: "spare_15",
        name: l10n("FIELD_COLLISION_SPARE", { tile: 15 }),
        flag: 0xf0,
        icon: <BrushToolbarExtraTileIcon $value="15" />,
      },
    ],
    []
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
              tileType: tileTypes[index].flag | (tileTypes[index].extra ?? 0),
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
            {tileTypes.slice(0, 5).map((tileType, tileTypeIndex) => (
              <Button
                variant="transparent"
                key={tileType.name}
                onClick={setSelectedPalette(tileTypeIndex)}
                active={
                  tileType.flag === COLLISION_ALL
                    ? selectedTileType === tileType.flag
                    : selectedTileType !== COLLISION_ALL &&
                      !!(selectedTileType & tileType.flag)
                }
                title={`${tileType.name} (${tileTypeIndex + 1})`}
              >
                {tileType.icon}
              </Button>
            ))}
            <FloatingPanelDivider />
            {tileTypes.slice(5, 6).map((tileType, tileTypeIndex) => (
              <Button
                variant="transparent"
                key={tileType.name}
                onClick={setSelectedPalette(tileTypeIndex + 5)}
                active={selectedTileType === tileType.flag}
                title={`${tileType.name} (${tileTypeIndex + 5 + 1})`}
              >
                {tileType.icon}
              </Button>
            ))}

            {showCollisionSlopeTiles && (
              <>
                <FloatingPanelDivider />

                {tileTypes.slice(6, 12).map((tileType, tileTypeIndex) => (
                  <Button
                    variant="transparent"
                    key={tileType.name}
                    onClick={setSelectedPalette(tileTypeIndex + 6)}
                    active={(selectedTileType & 0xf0) === tileType.flag}
                    title={`${tileType.name}`}
                  >
                    {tileType.icon}
                  </Button>
                ))}
              </>
            )}

            {showCollisionExtraTiles && (
              <>
                <FloatingPanelDivider />
                {tileTypes.slice(12).map((tileType, tileTypeIndex) => (
                  <Button
                    variant="transparent"
                    key={tileType.name}
                    onClick={setSelectedPalette(tileTypeIndex + 12)}
                    active={(selectedTileType & 0xf0) === tileType.flag}
                    title={`${tileType.name}`}
                  >
                    {tileType.icon}
                  </Button>
                ))}
              </>
            )}
            <FloatingPanelDivider />
          </>
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
            <MenuItem onClick={onToggleViewSlopeTiles}>
              <Checkbox
                id="showCollisionSlopeTiles"
                name="showCollisionSlopeTiles"
                checked={showCollisionSlopeTiles}
              />
              {` ${l10n("FIELD_VIEW_SLOPE_TILES")}`}
            </MenuItem>
            <MenuItem onClick={onToggleViewExtraTiles}>
              <Checkbox
                id="showCollisionSlopeTiles"
                name="showCollisionSlopeTiles"
                checked={showCollisionExtraTiles}
              />
              {` ${l10n("FIELD_VIEW_EXTRA_TILES")}`}
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
