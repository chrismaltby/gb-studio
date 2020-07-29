import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import l10n from "../../lib/helpers/l10n";
import * as actions from "../../actions";
import {
  PaintBucketIcon,
  SquareIcon,
  SquareIconSmall,
  EyeOpenIcon,
  EyeClosedIcon,
} from "../library/Icons";
import {
  TOOL_COLORS,
  TOOL_COLLISIONS,
  TOOL_ERASER,
  BRUSH_8PX,
  BRUSH_16PX,
  BRUSH_FILL,
  DMG_PALETTE,
} from "../../consts";
import PaletteBlock from "../library/PaletteBlock";
import {
  getSettings,
  getPalettesLookup,
  getScenesLookup,
} from "../../reducers/entitiesReducer";
import { PaletteShape } from "../../reducers/stateShape";
import Modal, { ModalFade, ModalContent } from "../library/Modal";
import Button from "../library/Button";
import PaletteSelect from "../forms/PaletteSelect";
import { FormField } from "../library/Forms";
import { getCachedObject } from "../../lib/helpers/cache";

const paletteIndexes = [0, 1, 2, 3, 4, 5];
const validTools = [TOOL_COLORS, TOOL_COLLISIONS, TOOL_ERASER];
const tileTypes = ["solid", "platform"];

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

  onMouseUp = (e) => {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  };

  setBrush = (brush) => (e) => {
    e.stopPropagation();
    const { setSelectedBrush } = this.props;
    setSelectedBrush(brush);
  };

  setSelectedPalette = (index) => (e) => {
    const { setSelectedPalette, setSelectedTileType, showPalettes, showTileTypes } = this.props;
    if(showPalettes){
      setSelectedPalette(index);
    }
    if (showTileTypes) {
      setSelectedTileType(index + 1)
    }
  };

  startReplacePalette = (paletteIndex) => (e) => {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(this.openReplacePalette(paletteIndex), 300);
  };

  openReplacePalette = (paletteIndex) => (e) => {
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
      editScene(sceneId, {
        paletteIds: newIds,
      });
    } else {
      const newIds = [].concat(defaultBackgroundPaletteIds);
      newIds[modalColorIndex] = newPalette;
      editProjectSettings({ defaultBackgroundPaletteIds: newIds });
    }
    this.closePaletteModal();
  };

  closePaletteModal = (e) => {
    this.setState({
      modalColorIndex: -1,
    });
  };

  toggleShowLayers = (e) => {
    const { setShowLayers, showLayers } = this.props;
    setShowLayers(!showLayers);
  };

  render() {
    const {
      selectedPalette,
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
                <PaletteBlock colors={palettes[paletteIndex].colors} />
              </div>
            ))}
          {showPalettes && <div className="BrushToolbar__Divider" />}
          {showTileTypes &&
            tileTypes.map((tileType, collisionTypeIndex) => (
              <div
                key={tileType}
                onClick={this.setSelectedPalette(collisionTypeIndex)}
                onMouseDown={this.startReplacePalette(collisionTypeIndex)}
                className={cx("BrushToolbar__Item", {
                  "BrushToolbar__Item--Selected":
                  collisionTypeIndex + 1 === selectedTileType,
                })}
                title={`${tileType} (${collisionTypeIndex + 1})`}
              >
                <div className={cx("BrushToolbar__Tile", `BrushToolbar__Tile--${tileType}`)} />
              </div>
            ))}
          {showTileTypes && <div className="BrushToolbar__Divider" />}          
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
                  value={(scenePaletteIds && scenePaletteIds[modalColorIndex]) || ""}
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
  sceneId: PropTypes.string,
  setSelectedPalette: PropTypes.func.isRequired,
  setSelectedTileType: PropTypes.func.isRequired,
  setSelectedBrush: PropTypes.func.isRequired,
  setShowLayers: PropTypes.func.isRequired,
  palettes: PropTypes.arrayOf(PaletteShape).isRequired,
  defaultBackgroundPaletteIds: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  sceneBackgroundPaletteIds: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  setSection: PropTypes.func.isRequired,
  setNavigationId: PropTypes.func.isRequired,
  editProjectSettings: PropTypes.func.isRequired,
  editScene: PropTypes.func.isRequired
};

BrushToolbar.defaultProps = {
  sceneId: null
};

function mapStateToProps(state) {
  const { selectedPalette, selectedTileType, selectedBrush, showLayers } = state.editor;
  const selectedTool = state.tools.selected;
  const visible = validTools.includes(selectedTool);
  const showPalettes = selectedTool === TOOL_COLORS;
  const showTileTypes = selectedTool === TOOL_COLLISIONS;

  const settings = getSettings(state);
  const palettesLookup = getPalettesLookup(state);
  const scenesLookup = getScenesLookup(state);

  const { scene: sceneId } = state.editor;

  const defaultBackgroundPaletteIds =
    settings.defaultBackgroundPaletteIds || [];

  const sceneBackgroundPaletteIds =
    (scenesLookup[sceneId] && scenesLookup[sceneId].paletteIds) || [];

  const scenePaletteIds = scenesLookup[sceneId] && scenesLookup[sceneId].paletteIds;

  const getPalette = (paletteIndex) => {
    if(sceneBackgroundPaletteIds[paletteIndex] === "dmg") {
      return DMG_PALETTE;
    }
    return palettesLookup[sceneBackgroundPaletteIds[paletteIndex]]
      || palettesLookup[defaultBackgroundPaletteIds[paletteIndex]]
      || DMG_PALETTE;
  }

  const palettes = getCachedObject([
    getPalette(0),
    getPalette(1),
    getPalette(2),
    getPalette(3),
    getPalette(4),
    getPalette(5),
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
  };
}

const mapDispatchToProps = {
  setSelectedPalette: actions.setSelectedPalette,
  setSelectedTileType: actions.setSelectedTileType,
  setSelectedBrush: actions.setSelectedBrush,
  setShowLayers: actions.setShowLayers,
  setSection: actions.setSection,
  setNavigationId: actions.setNavigationId,
  editProjectSettings: actions.editProjectSettings,
  editScene: actions.editScene,
};

export default connect(mapStateToProps, mapDispatchToProps)(BrushToolbar);
