import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import l10n from "lib/helpers/l10n";
import {
  PaintBucketIcon,
  SquareIcon,
  SquareIconSmall,
  EyeOpenIcon,
  EyeClosedIcon,
} from "ui/icons/Icons";
import {
  TOOL_COLORS,
  TOOL_COLLISIONS,
  TOOL_ERASER,
  BRUSH_8PX,
  BRUSH_16PX,
  BRUSH_FILL,
  DMG_PALETTE,
  COLLISION_TOP,
  COLLISION_BOTTOM,
  COLLISION_LEFT,
  COLLISION_RIGHT,
  COLLISION_ALL,
  TILE_PROP_LADDER,
} from "../../consts";
import PaletteBlock from "../library/PaletteBlock";
import { PaletteShape } from "store/stateShape";
import Modal, { ModalFade, ModalContent } from "../library/Modal";
import Button from "../library/Button";
import { FormField } from "../library/Forms";
import { getCachedObject } from "lib/helpers/cache";
import editorActions from "store/features/editor/editorActions";
import {
  backgroundSelectors,
  paletteSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesState";
import { getSettings } from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import navigationActions from "store/features/navigation/navigationActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { PaletteSelect } from "../forms/PaletteSelect";

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
];

const collisionDirectionFlags = [
  COLLISION_TOP,
  COLLISION_BOTTOM,
  COLLISION_LEFT,
  COLLISION_RIGHT,
];

class BrushToolbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalColorIndex: -1,
    };
  }

  componentDidMount() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("mouseup", this.onMouseUp);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("mouseup", this.onMouseUp);
  }

  onKeyDown = (e) => {
    if (e.target.nodeName !== "BODY") {
      return;
    }
    if (e.ctrlKey || e.shiftKey || e.metaKey) {
      return;
    }
    if (e.code === "Digit1") {
      this.setSelectedPalette(0)(e);
    } else if (e.code === "Digit2") {
      this.setSelectedPalette(1)(e);
    } else if (e.code === "Digit3") {
      this.setSelectedPalette(2)(e);
    } else if (e.code === "Digit4") {
      this.setSelectedPalette(3)(e);
    } else if (e.code === "Digit5") {
      this.setSelectedPalette(4)(e);
    } else if (e.code === "Digit6") {
      this.setSelectedPalette(5)(e);
    } else if (e.code === "Digit7") {
      this.setSelectedPalette(6)(e);
    } else if (e.code === "Digit8") {
      this.setBrush(BRUSH_8PX)(e);
    } else if (e.code === "Digit9") {
      this.setBrush(BRUSH_16PX)(e);
    } else if (e.code === "Digit0") {
      this.setBrush(BRUSH_FILL)(e);
    } else if (e.code === "Minus") {
      this.toggleShowLayers(e);
    }
  };

  onMouseUp = (_e) => {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  };

  setBrush = (brush) => (e) => {
    e.stopPropagation();
    const { setBrush } = this.props;
    setBrush({ brush });
  };

  setSelectedPalette = (index) => (e) => {
    const {
      setSelectedPalette,
      setSelectedTileType,
      showPalettes,
      showTileTypes,
    } = this.props;
    if (showPalettes) {
      setSelectedPalette({ paletteIndex: index });
    }
    if (showTileTypes && tileTypes[index]) {
      const { selectedTileType } = this.props;

      if (
        e.shiftKey &&
        collisionDirectionFlags.includes(tileTypes[index].flag)
      ) {
        if (
          selectedTileType !== tileTypes[index].flag &&
          selectedTileType & tileTypes[index].flag
        ) {
          setSelectedTileType({
            tileType: selectedTileType & COLLISION_ALL & ~tileTypes[index].flag,
          });
        } else {
          setSelectedTileType({
            tileType:
              (selectedTileType & COLLISION_ALL) | tileTypes[index].flag,
          });
        }
      } else {
        setSelectedTileType({ tileType: tileTypes[index].flag });
      }
    }
  };

  startReplacePalette = (paletteIndex) => (_e) => {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(this.openReplacePalette(paletteIndex), 300);
  };

  openReplacePalette = (paletteIndex) => (_e) => {
    this.setState({
      modalColorIndex: paletteIndex,
    });
  };

  onChangePalette = (newPalette) => {
    const {
      sceneId,
      editProjectSettings,
      editScene,
      defaultBackgroundPaletteIds,
      sceneBackgroundPaletteIds,
    } = this.props;
    const { modalColorIndex } = this.state;
    if (sceneId) {
      const newIds = [].concat(sceneBackgroundPaletteIds);
      newIds[modalColorIndex] = newPalette;
      editScene({
        sceneId,
        changes: {
          paletteIds: newIds,
        },
      });
    } else {
      const newIds = [].concat(defaultBackgroundPaletteIds);
      newIds[modalColorIndex] = newPalette;
      editProjectSettings({ defaultBackgroundPaletteIds: newIds });
    }
    this.closePaletteModal();
  };

  closePaletteModal = (_e) => {
    this.setState({
      modalColorIndex: -1,
    });
  };

  toggleShowLayers = (_e) => {
    const { setShowLayers, showLayers } = this.props;
    setShowLayers({ showLayers: !showLayers });
  };

  render() {
    const {
      selectedPalette,
      highlightPalette,
      selectedTileType,
      selectedBrush,
      visible,
      showPalettes,
      showTileTypes,
      showLayers,
      palettes,
      setSection,
      setNavigationId,
      scenePaletteIds,
      defaultBackgroundPaletteIds,
    } = this.props;
    const { modalColorIndex } = this.state;

    return (
      <>
        <div
          className={cx("BrushToolbar", { "BrushToolbar--Visible": visible })}
        >
          <div
            onClick={this.setBrush(BRUSH_8PX)}
            className={cx("BrushToolbar__Item", {
              "BrushToolbar__Item--Selected": selectedBrush === BRUSH_8PX,
            })}
            title={`${l10n("TOOL_BRUSH", { size: "8px" })} (8)`}
          >
            <SquareIconSmall />
          </div>
          <div
            onClick={this.setBrush(BRUSH_16PX)}
            className={cx("BrushToolbar__Item", {
              "BrushToolbar__Item--Selected": selectedBrush === BRUSH_16PX,
            })}
            title={`${l10n("TOOL_BRUSH", { size: "16px" })} (9)`}
          >
            <SquareIcon />
          </div>
          <div
            onClick={this.setBrush(BRUSH_FILL)}
            className={cx("BrushToolbar__Item", {
              "BrushToolbar__Item--Selected": selectedBrush === BRUSH_FILL,
            })}
            title={`${l10n("TOOL_FILL")} (0)`}
          >
            <PaintBucketIcon />
          </div>
          <div className="BrushToolbar__Divider" />
          {showPalettes &&
            paletteIndexes.map((paletteIndex) => (
              <div
                key={paletteIndex}
                onClick={this.setSelectedPalette(paletteIndex)}
                onMouseDown={this.startReplacePalette(paletteIndex)}
                className={cx("BrushToolbar__Item", {
                  "BrushToolbar__Item--Selected":
                    paletteIndex === selectedPalette,
                })}
                title={`${l10n("TOOL_PALETTE_N", {
                  number: paletteIndex + 1,
                })} (${paletteIndex + 1}) - ${palettes[paletteIndex].name}`}
              >
                <PaletteBlock
                  colors={palettes[paletteIndex].colors}
                  highlight={paletteIndex === highlightPalette}
                />
              </div>
            ))}
          {showPalettes && <div className="BrushToolbar__Divider" />}
          {showTileTypes && (
            <>
              {tileTypes.slice(0, 5).map((tileType, tileTypeIndex) => (
                <div
                  key={tileType.name}
                  onClick={this.setSelectedPalette(tileTypeIndex)}
                  className={cx("BrushToolbar__Item", {
                    "BrushToolbar__Item--Selected":
                      tileType.flag === COLLISION_ALL
                        ? selectedTileType === tileType.flag
                        : selectedTileType !== COLLISION_ALL &&
                          selectedTileType & tileType.flag,
                  })}
                  title={`${tileType.name} (${tileTypeIndex + 1})`}
                >
                  <div
                    className={cx(
                      "BrushToolbar__Tile",
                      `BrushToolbar__Tile--${tileType.key}`
                    )}
                  />
                </div>
              ))}
              <div className="BrushToolbar__Divider" />
              {tileTypes.slice(5).map((tileType, tileTypeIndex) => (
                <div
                  key={tileType.name}
                  onClick={this.setSelectedPalette(tileTypeIndex + 5)}
                  className={cx("BrushToolbar__Item", {
                    "BrushToolbar__Item--Selected":
                      tileType.flag === COLLISION_ALL
                        ? selectedTileType === tileType.flag
                        : selectedTileType !== COLLISION_ALL &&
                          selectedTileType & tileType.flag,
                  })}
                  title={`${tileType.name} (${tileTypeIndex + 5 + 1})`}
                >
                  <div
                    className={cx(
                      "BrushToolbar__Tile",
                      `BrushToolbar__Tile--${tileType.key}`
                    )}
                  />
                </div>
              ))}
              <div className="BrushToolbar__Divider" />
            </>
          )}
          <div
            onClick={this.toggleShowLayers}
            className={cx("BrushToolbar__Item", {
              "BrushToolbar__Item--Selected": !showLayers,
            })}
            title={`${
              showLayers ? l10n("TOOL_HIDE_LAYERS") : l10n("TOOL_SHOW_LAYERS")
            } (-)`}
          >
            {showLayers ? <EyeOpenIcon /> : <EyeClosedIcon />}
          </div>
        </div>
        {modalColorIndex > -1 && (
          <>
            <ModalFade onClick={this.closePaletteModal} />
            <Modal
              style={{
                left: 200 + 36 * modalColorIndex,
                top: 70,
              }}
            >
              <FormField>
                <PaletteSelect
                  value={
                    (scenePaletteIds && scenePaletteIds[modalColorIndex]) || ""
                  }
                  optional
                  optionalDefaultPaletteId={
                    defaultBackgroundPaletteIds[modalColorIndex] || ""
                  }
                  optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
                  prefix={`${modalColorIndex + 1}: `}
                  onChange={this.onChangePalette}
                />
              </FormField>
              <ModalContent>
                <Button
                  small
                  onClick={() => {
                    setSection("palettes");
                    setNavigationId(
                      (palettes[modalColorIndex] &&
                        palettes[modalColorIndex].id) ||
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
  }
}

BrushToolbar.propTypes = {
  visible: PropTypes.bool.isRequired,
  selectedBrush: PropTypes.oneOf([BRUSH_8PX, BRUSH_16PX, BRUSH_FILL])
    .isRequired,
  showLayers: PropTypes.bool.isRequired,
  showPalettes: PropTypes.bool.isRequired,
  showTileTypes: PropTypes.bool.isRequired,
  selectedPalette: PropTypes.number.isRequired,
  highlightPalette: PropTypes.number.isRequired,
  selectedTileType: PropTypes.number.isRequired,
  sceneId: PropTypes.string,
  setSelectedPalette: PropTypes.func.isRequired,
  setSelectedTileType: PropTypes.func.isRequired,
  setBrush: PropTypes.func.isRequired,
  setShowLayers: PropTypes.func.isRequired,
  palettes: PropTypes.arrayOf(PaletteShape).isRequired,
  defaultBackgroundPaletteIds: PropTypes.arrayOf(PropTypes.string.isRequired)
    .isRequired,
  sceneBackgroundPaletteIds: PropTypes.arrayOf(PropTypes.string.isRequired)
    .isRequired,
  setSection: PropTypes.func.isRequired,
  setNavigationId: PropTypes.func.isRequired,
  editProjectSettings: PropTypes.func.isRequired,
  editScene: PropTypes.func.isRequired,
};

BrushToolbar.defaultProps = {
  sceneId: null,
};

function mapStateToProps(state) {
  const { selectedPalette, selectedTileType, selectedBrush, showLayers } =
    state.editor;
  const selectedTool = state.editor.tool;
  const visible = validTools.includes(selectedTool);
  const showPalettes = selectedTool === TOOL_COLORS;
  const showTileTypes = selectedTool === TOOL_COLLISIONS;

  const settings = getSettings(state);
  const palettesLookup = paletteSelectors.selectEntities(state);
  const scenesLookup = sceneSelectors.selectEntities(state);

  const { scene: sceneId } = state.editor;

  let highlightPalette = -1;
  const scene = sceneSelectors.selectById(state, state.editor.hover.sceneId);

  if (scene) {
    const background = backgroundSelectors.selectById(
      state,
      scene.backgroundId
    );
    const { x, y } = state.editor.hover;
    if (background) {
      highlightPalette = Array.isArray(scene.tileColors)
        ? scene.tileColors[x + y * scene.width]
        : 0;
    }
  }

  const defaultBackgroundPaletteIds =
    settings.defaultBackgroundPaletteIds || [];

  const sceneBackgroundPaletteIds =
    (scenesLookup[sceneId] && scenesLookup[sceneId].paletteIds) || [];

  const scenePaletteIds =
    scenesLookup[sceneId] && scenesLookup[sceneId].paletteIds;

  const getPalette = (paletteIndex) => {
    if (sceneBackgroundPaletteIds[paletteIndex] === "dmg") {
      return DMG_PALETTE;
    }
    return (
      palettesLookup[sceneBackgroundPaletteIds[paletteIndex]] ||
      palettesLookup[defaultBackgroundPaletteIds[paletteIndex]] ||
      DMG_PALETTE
    );
  };

  const palettes = getCachedObject([
    getPalette(0),
    getPalette(1),
    getPalette(2),
    getPalette(3),
    getPalette(4),
    getPalette(5),
    getPalette(6),
    getPalette(7),
  ]);

  return {
    selectedPalette,
    selectedTileType,
    selectedBrush,
    visible,
    showPalettes,
    showTileTypes,
    showLayers,
    palettes,
    sceneId,
    defaultBackgroundPaletteIds,
    scenePaletteIds,
    sceneBackgroundPaletteIds,
    highlightPalette,
  };
}

const mapDispatchToProps = {
  setSelectedPalette: editorActions.setSelectedPalette,
  setSelectedTileType: editorActions.setSelectedTileType,
  setBrush: editorActions.setBrush,
  setShowLayers: editorActions.setShowLayers,
  setSection: navigationActions.setSection,
  setNavigationId: navigationActions.setNavigationId,
  editProjectSettings: settingsActions.editSettings,
  editScene: entitiesActions.editScene,
};

export default connect(mapStateToProps, mapDispatchToProps)(BrushToolbar);
