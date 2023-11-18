import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import cx from "classnames";
import l10n from "lib/helpers/l10n";
import {
  PaintBucketIcon,
  WandIcon,
  SquareIcon,
  SquareIconSmall,
  EyeOpenIcon,
  EyeClosedIcon,
  PriorityTileIcon,
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
} from "../../consts";
import PaletteBlock from "../library/PaletteBlock";
import Modal, { ModalFade, ModalContent } from "../library/Modal";
import { FormField } from "../library/Forms";
import editorActions from "store/features/editor/editorActions";
import {
  backgroundSelectors,
  paletteSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesState";
import settingsActions from "store/features/settings/settingsActions";
import navigationActions from "store/features/navigation/navigationActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { PaletteSelect } from "../forms/PaletteSelect";
import { Brush } from "store/features/editor/editorState";
import { RootState } from "store/configureStore";
import { cloneDeep } from "lodash";
import { NavigationSection } from "store/features/navigation/navigationState";
import styled from "styled-components";
import FloatingPanel, {
  FloatingPanelBreak,
  FloatingPanelDivider,
} from "ui/panels/FloatingPanel";
import { Button } from "ui/buttons/Button";

const paletteIndexes = [0, 1, 2, 3, 4, 5, 6, 7];
const validTools = [TOOL_COLORS, TOOL_COLLISIONS, TOOL_ERASER];
const tileTypes = [
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
    key: "slope45R",
    name: l10n("FIELD_COLLISION_SLOPE_45R"),
    flag: 32,
  },
  {
    key: "slope45L",
    name: l10n("FIELD_COLLISION_SLOPE_45L"),
    flag: 48,
  },
  {
    key: "slope_Shallow_R1",
    name: l10n("FIELD_COLLISION_SLOPE_SHALLOW_R1"),
    flag: 64,
  },
  {
    key: "slope_Shallow_R2",
    name: l10n("FIELD_COLLISION_SLOPE_SHALLOW_R2"),
    flag: 80,
  },
  {
    key: "slope_Shallow_L2",
    name: l10n("FIELD_COLLISION_SLOPE_SHALLOW_L2"),
    flag: 96,
  },
  {
    key: "slope_Shallow_L1",
    name: l10n("FIELD_COLLISION_SLOPE_SHALLOW_L1"),
    flag: 112,
  },
  {
    key: "slope_Steep_R1",
    name: l10n("FIELD_COLLISION_SLOPE_STEEP_R1"),
    flag: 128,
  },
  {
    key: "slope_Steep_R2",
    name: l10n("FIELD_COLLISION_SLOPE_STEEP_R2"),
    flag: 144,
  },
  {
    key: "slope_Steep_L2",
    name: l10n("FIELD_COLLISION_SLOPE_STEEP_L2"),
    flag: 160,
  },
  {
    key: "slope_Steep_L1",
    name: l10n("FIELD_COLLISION_SLOPE_STEEP_L1"),
    flag: 176,
  },
  {
    key: "spare_12",
    name: l10n("FIELD_COLLISION_SPARE_12"),
    flag: 192,
  },
  {
    key: "spare_13",
    name: l10n("FIELD_COLLISION_SPARE_13"),
    flag: 208,
  },
  {
    key: "spare_14",
    name: l10n("FIELD_COLLISION_SPARE_14"),
    flag: 224,
  },
  {
    key: "spare_15",
    name: l10n("FIELD_COLLISION_SPARE_15"),
    flag: 240,
  },
];

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

  const setSelectedPalette = (index: number) => (e: any) => {
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
      } else {
        dispatch(
          editorActions.setSelectedTileType({ tileType: tileTypes[index].flag })
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
  const palettes = paletteIndexes.map((paletteIndex) => {
    if (!scene) {
      return (
        palettesLookup[defaultBackgroundPaletteIds[paletteIndex]] || DMG_PALETTE
      );
    }
    if (scene.paletteIds && scene.paletteIds[paletteIndex] === "dmg") {
      return DMG_PALETTE;
    }
    return (
      palettesLookup[scene.paletteIds[paletteIndex]] ||
      palettesLookup[defaultBackgroundPaletteIds[paletteIndex]] ||
      DMG_PALETTE
    );
  });

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
          title={`${l10n("TOOL_MAGIC")} (0)`}
        >
          <WandIcon />
        </Button>
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
        {showTileTypes && (
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
            <FloatingPanelBreak />
            {tileTypes.slice(6).map((tileType, tileTypeIndex) => (
              <Button
                variant="transparent"
                key={tileType.name}
                onClick={setSelectedPalette(tileTypeIndex + 6)}
                active={selectedTileType === tileType.flag}
                title={`${tileType.name}`}
              >
                <BrushToolbarCollisionTile
                  className={`BrushToolbar__Tile--${tileType.key}`}
                />
              </Button>
            ))}
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
