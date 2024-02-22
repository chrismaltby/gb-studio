import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import cx from "classnames";
import l10n from "renderer/lib/l10n";
import {
  PaintBucketIcon,
  WandIcon,
  SquareIcon,
  SquareIconSmall,
  EyeOpenIcon,
  EyeClosedIcon,
  PriorityTileIcon,
  SlopeIcon,
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
import Modal, { ModalFade, ModalContent } from "components/library/Modal";
import { FormField } from "components/library/Forms";
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
import { RootState } from "store/configureStore";
import { cloneDeep } from "lodash";
import { NavigationSection } from "store/features/navigation/navigationState";
import styled from "styled-components";
import FloatingPanel, { FloatingPanelDivider } from "ui/panels/FloatingPanel";
import { Button } from "ui/buttons/Button";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuItem } from "ui/menu/Menu";
import { Checkbox } from "ui/form/Checkbox";

const paletteIndexes = [0, 1, 2, 3, 4, 5, 6, 7];
const validTools = [TOOL_COLORS, TOOL_COLLISIONS, TOOL_ERASER];

const collisionDirectionFlags = [
  COLLISION_TOP,
  COLLISION_BOTTOM,
  COLLISION_LEFT,
  COLLISION_RIGHT,
];

function useHiglightPalette() {
  const hoverScene = useSelector((state: RootState) =>
    sceneSelectors.selectById(state, state.editor.hover.sceneId)
  );
  const background = useSelector((state: RootState) =>
    backgroundSelectors.selectById(state, hoverScene?.backgroundId ?? "")
  );
  const { x, y } = useSelector((state: RootState) => state.editor.hover);

  let highlightPalette = -1;
  if (background) {
    highlightPalette = Array.isArray(background.tileColors)
      ? background.tileColors[x + y * background.width]
      : 0;
  }

  return highlightPalette;
}

interface BrushToolbarWrapperProps {
  visible: boolean;
}

const BrushToolbarWrapper = styled(FloatingPanel)<BrushToolbarWrapperProps>`
  position: absolute;
  left: 56px;
  top: ${(props) => (props.visible ? "10px" : "-45px")};
  transition: top 0.2s ease-in-out;
  z-index: 10;
  flex-wrap: wrap;
  margin-right: 10px;
`;

const BrushToolbarCollisionTile = styled.div`
  position: relative;
  background-color: var(--input-bg-color);
  width: 24px;
  height: 24px;
  border: 1px solid var(--input-bg-color);
  box-sizing: border-box;
  border-radius: 4px;
}`;

const BrushToolbar = () => {
  const dispatch = useDispatch();

  const sceneId = useSelector((state: RootState) => state.editor.scene);
  const { selectedPalette, selectedTileType, selectedBrush, showLayers } =
    useSelector((state: RootState) => state.editor);
  const scene = useSelector((state: RootState) =>
    sceneSelectors.selectById(state, sceneId)
  );
  const selectedTool = useSelector((state: RootState) => state.editor.tool);
  const visible = validTools.includes(selectedTool);
  const showPalettes = selectedTool === TOOL_COLORS;
  const showTileTypes = selectedTool === TOOL_COLLISIONS;
  const showCollisionSlopeTiles = useSelector(
    (state: RootState) => state.project.present.settings.showCollisionSlopeTiles
  );
  const showCollisionExtraTiles = useSelector(
    (state: RootState) => state.project.present.settings.showCollisionExtraTiles
  );

  const tileTypes = useMemo(
    () => [
      {
        key: "solid",
        name: l10n("FIELD_SOLID"),
        flag: COLLISION_ALL,
      },
      {
        key: "top",
        name: l10n("FIELD_COLLISION_TOP"),
        flag: COLLISION_TOP,
      },
      {
        key: "bottom",
        name: l10n("FIELD_COLLISION_BOTTOM"),
        flag: COLLISION_BOTTOM,
      },
      {
        key: "left",
        name: l10n("FIELD_COLLISION_LEFT"),
        flag: COLLISION_LEFT,
      },
      {
        key: "right",
        name: l10n("FIELD_COLLISION_RIGHT"),
        flag: COLLISION_RIGHT,
      },
      {
        key: "ladder",
        name: l10n("FIELD_COLLISION_LADDER"),
        flag: TILE_PROP_LADDER,
      },
      {
        key: "slope_45_right",
        name: l10n("FIELD_COLLISION_SLOPE_45_RIGHT"),
        flag: COLLISION_SLOPE_45_RIGHT,
        extra: COLLISION_BOTTOM | COLLISION_RIGHT,
      },
      {
        key: "slope_45_left",
        name: l10n("FIELD_COLLISION_SLOPE_45_LEFT"),
        flag: COLLISION_SLOPE_45_LEFT,
        extra: COLLISION_BOTTOM | COLLISION_LEFT,
      },
      {
        key: "slope_22_right_bot",
        name: l10n("FIELD_COLLISION_SLOPE_22_RIGHT_BOT"),
        flag: COLLISION_SLOPE_22_RIGHT_BOT,
        extra: COLLISION_BOTTOM,
      },
      {
        key: "slope_22_right_top",
        name: l10n("FIELD_COLLISION_SLOPE_22_RIGHT_TOP"),
        flag: COLLISION_SLOPE_22_RIGHT_TOP,
        extra: COLLISION_BOTTOM | COLLISION_RIGHT,
      },
      {
        key: "slope_22_left_top",
        name: l10n("FIELD_COLLISION_SLOPE_22_LEFT_TOP"),
        flag: COLLISION_SLOPE_22_LEFT_TOP,
        extra: COLLISION_BOTTOM | COLLISION_LEFT,
      },
      {
        key: "slope_22_left_bot",
        name: l10n("FIELD_COLLISION_SLOPE_22_LEFT_BOT"),
        flag: COLLISION_SLOPE_22_LEFT_BOT,
        extra: COLLISION_BOTTOM,
      },
      {
        key: "spare_08",
        name: l10n("FIELD_COLLISION_SPARE", { tile: 8 }),
        flag: 0x80,
      },
      {
        key: "spare_09",
        name: l10n("FIELD_COLLISION_SPARE", { tile: 9 }),
        flag: 0x90,
      },
      {
        key: "spare_10",
        name: l10n("FIELD_COLLISION_SPARE", { tile: 10 }),
        flag: 0xa0,
      },
      {
        key: "spare_11",
        name: l10n("FIELD_COLLISION_SPARE", { tile: 11 }),
        flag: 0xb0,
      },
      {
        key: "spare_12",
        name: l10n("FIELD_COLLISION_SPARE", { tile: 12 }),
        flag: 0xc0,
      },
      {
        key: "spare_13",
        name: l10n("FIELD_COLLISION_SPARE", { tile: 13 }),
        flag: 0xd0,
      },
      {
        key: "spare_14",
        name: l10n("FIELD_COLLISION_SPARE", { tile: 14 }),
        flag: 0xe0,
      },
      {
        key: "spare_15",
        name: l10n("FIELD_COLLISION_SPARE", { tile: 15 }),
        flag: 0xf0,
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

  const palettesLookup = useSelector((state: RootState) =>
    paletteSelectors.selectEntities(state)
  );
  const defaultBackgroundPaletteIds = useSelector(
    (state: RootState) =>
      state.project.present.settings.defaultBackgroundPaletteIds
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
  const timerRef = useRef<number | null>(null);
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

  const onMouseUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.target && (e.target as Node).nodeName !== "BODY") {
      return;
    }
    if (e.ctrlKey || e.shiftKey || e.metaKey) {
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
      <BrushToolbarWrapper visible={visible} className={cx("BrushToolbar")}>
        {/* // <div className={cx("BrushToolbar", { "BrushToolbar--Visible": visible })}> */}
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
          paletteIndexes.map((paletteIndex) => (
            <Button
              variant="transparent"
              key={paletteIndex}
              onClick={setSelectedPalette(paletteIndex)}
              onMouseDown={startReplacePalette(paletteIndex)}
              active={paletteIndex === selectedPalette}
              title={`${l10n("TOOL_PALETTE_N", {
                number: paletteIndex + 1,
              })} (${paletteIndex + 1}) - ${palettes[paletteIndex]?.name}`}
            >
              <PaletteBlock
                colors={palettes[paletteIndex]?.colors ?? []}
                highlight={paletteIndex === highlightPalette}
              />
            </Button>
          ))}
        {showPalettes && <FloatingPanelDivider />}
        {showPalettes && (
          <Button
            variant="transparent"
            onClick={setSelectedPalette(TILE_COLOR_PROP_PRIORITY)}
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
                <BrushToolbarCollisionTile
                  className={`BrushToolbar__Tile--${tileType.key}`}
                />
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
                <BrushToolbarCollisionTile
                  className={`BrushToolbar__Tile--${tileType.key}`}
                />
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
                    <BrushToolbarCollisionTile
                      className={`BrushToolbar__Tile--${tileType.key}`}
                    />
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
                    <BrushToolbarCollisionTile
                      className={`BrushToolbar__Tile--${tileType.key}`}
                    />
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
          <ModalFade onClick={closePaletteModal} />
          <Modal
            style={{
              left: 200 + 36 * modalColorIndex,
              top: 70,
            }}
          >
            <FormField style={undefined}>
              <PaletteSelect
                value={scene?.paletteIds[modalColorIndex] || ""}
                optional
                optionalDefaultPaletteId={
                  defaultBackgroundPaletteIds[modalColorIndex] || ""
                }
                optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
                prefix={`${modalColorIndex + 1}: `}
                onChange={onChangePalette}
                name={""}
              />
            </FormField>
            <ModalContent>
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
            </ModalContent>
          </Modal>
        </>
      )}
    </>
  );
};

export default BrushToolbar;
