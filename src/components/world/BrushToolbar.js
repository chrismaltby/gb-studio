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

const paletteIndexes = [0, 1, 2, 3, 4, 5];
const validTools = [TOOL_COLORS, TOOL_COLLISIONS, TOOL_ERASER];

class BrushToolbar extends Component {
  componentDidMount() {
    window.addEventListener("keydown", this.onKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
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

  setBrush = (brush) => (e) => {
    e.stopPropagation();
    const { setSelectedBrush } = this.props;
    setSelectedBrush(brush);
  };

  setSelectedPalette = (paletteIndex) => (e) => {
    const { setSelectedPalette } = this.props;
    setSelectedPalette(paletteIndex);
  };

  toggleShowLayers = (e) => {
    const { setShowLayers, showLayers } = this.props;
    setShowLayers(!showLayers);
  };

  render() {
    const {
      selectedPalette,
      selectedBrush,
      visible,
      showPalettes,
      showLayers,
      palettes,
    } = this.props;
    return (
      <div className={cx("BrushToolbar", { "BrushToolbar--Visible": visible })}>
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
              className={cx("BrushToolbar__Item", {
                "BrushToolbar__Item--Selected":
                  paletteIndex === selectedPalette,
              })}
              title={`${l10n("TOOL_PALETTE_N", {
                number: paletteIndex + 1,
              })} (${paletteIndex + 1})`}
            >
              <PaletteBlock colors={palettes[paletteIndex].colors} />
            </div>
          ))}
        {showPalettes && <div className="BrushToolbar__Divider" />}
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
    );
  }
}

BrushToolbar.propTypes = {
  visible: PropTypes.bool.isRequired,
  selectedBrush: PropTypes.oneOf([BRUSH_8PX, BRUSH_16PX, BRUSH_FILL])
    .isRequired,
  showLayers: PropTypes.bool.isRequired,
  showPalettes: PropTypes.bool.isRequired,
  selectedPalette: PropTypes.number.isRequired,
  setSelectedPalette: PropTypes.func.isRequired,
  setSelectedBrush: PropTypes.func.isRequired,
  setShowLayers: PropTypes.func.isRequired,
  palettes: PropTypes.arrayOf(PaletteShape).isRequired,
};

function mapStateToProps(state) {
  const { selectedPalette, selectedBrush, showLayers } = state.editor;
  const selectedTool = state.tools.selected;
  const visible = validTools.includes(selectedTool);
  const showPalettes = selectedTool === TOOL_COLORS;

  const settings = getSettings(state);
  const palettesLookup = getPalettesLookup(state);
  const scenesLookup = getScenesLookup(state);

  const { scene: sceneId } = state.editor;

  const defaultBackgroundPaletteIds =
    settings.defaultBackgroundPaletteIds || [];

  const sceneBackgroundPaletteIds =
    (scenesLookup[sceneId] && scenesLookup[sceneId].paletteIds) || [];

  const palettes = [
    palettesLookup[sceneBackgroundPaletteIds[0]] ||
      palettesLookup[defaultBackgroundPaletteIds[0]] ||
      DMG_PALETTE,
    palettesLookup[sceneBackgroundPaletteIds[1]] ||
      palettesLookup[defaultBackgroundPaletteIds[1]] ||
      DMG_PALETTE,
    palettesLookup[sceneBackgroundPaletteIds[2]] ||
      palettesLookup[defaultBackgroundPaletteIds[2]] ||
      DMG_PALETTE,
    palettesLookup[sceneBackgroundPaletteIds[3]] ||
      palettesLookup[defaultBackgroundPaletteIds[3]] ||
      DMG_PALETTE,
    palettesLookup[sceneBackgroundPaletteIds[4]] ||
      palettesLookup[defaultBackgroundPaletteIds[4]] ||
      DMG_PALETTE,
    palettesLookup[sceneBackgroundPaletteIds[5]] ||
      palettesLookup[defaultBackgroundPaletteIds[5]] ||
      DMG_PALETTE,
  ];

  return {
    selectedPalette,
    selectedBrush,
    visible,
    showPalettes,
    showLayers,
    palettes,
  };
}

const mapDispatchToProps = {
  setSelectedPalette: actions.setSelectedPalette,
  setSelectedBrush: actions.setSelectedBrush,
  setShowLayers: actions.setShowLayers,
};

export default connect(mapStateToProps, mapDispatchToProps)(BrushToolbar);
