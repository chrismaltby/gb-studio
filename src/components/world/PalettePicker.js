import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import l10n from "../../lib/helpers/l10n";
import * as actions from "../../actions";
import { PaintBucketIcon, SquareIcon, SquareIconSmall } from "../library/Icons";

const paletteIndexes = [0, 1, 2, 3, 4, 5];

class PalettePicker extends Component {
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
    console.log(e.code);
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
      this.setBrush("8px")(e);
    } else if (e.code === "Digit9") {
      this.setBrush("16px")(e);
    } else if (e.code === "Digit0") {
      this.setBrush("fill")(e);
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

  render() {
    const { selectedPalette, selectedBrush, visible } = this.props;
    return (
      <div
        className={cx("PalettePicker", { "PalettePicker--Visible": visible })}
      >
        <div
          onClick={this.setBrush("8px")}
          className={cx("PalettePicker__Item", {
            "PalettePicker__Item--Selected": selectedBrush === "8px",
          })}
          title={`${l10n("TOOL_BRUSH", {size: "8px"})} (8)`}
        >
          <SquareIconSmall />
        </div>
        <div
          onClick={this.setBrush("16px")}
          className={cx("PalettePicker__Item", {
            "PalettePicker__Item--Selected": selectedBrush === "16px",
          })}
          title={`${l10n("TOOL_BRUSH", {size: "16px"})} (9)`}
        >
          <SquareIcon />
        </div>
        <div
          onClick={this.setBrush("fill")}
          className={cx("PalettePicker__Item", {
            "PalettePicker__Item--Selected": selectedBrush === "fill",
          })}
          title={`${l10n("TOOL_FILL")} (0)`}
        >
          <PaintBucketIcon />
        </div>
        <div className="PalettePicker__Divider" />        
        {paletteIndexes.map((paletteIndex) => (
          <div
            key={paletteIndex}
            onClick={this.setSelectedPalette(paletteIndex)}
            className={cx("PalettePicker__Item", {
              "PalettePicker__Item--Selected": paletteIndex === selectedPalette,
            })}
            title={`${l10n("TOOL_PALETTE_N", {number: paletteIndex + 1})} (${paletteIndex + 1})`}
          >
            <div className="PalettePicker__Swatch">
              <div
                className="PalettePicker__Color"
                style={{ background: "#ff0000" }}
              />
              <div
                className="PalettePicker__Color"
                style={{ background: "#00ff00" }}
              />
              <div
                className="PalettePicker__Color"
                style={{ background: "#ff00ff" }}
              />
              <div
                className="PalettePicker__Color"
                style={{ background: "#0000ff" }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
}

PalettePicker.propTypes = {
  visible: PropTypes.bool.isRequired,
  selectedPalette: PropTypes.number.isRequired,
  setSelectedPalette: PropTypes.func.isRequired,
  setSelectedBrush: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  const { selectedPalette, selectedBrush } = state.editor;
  const selectedTool = state.tools.selected;
  const visible = selectedTool === "colors";
  return {
    selectedPalette,
    selectedBrush,
    visible
  };
}

const mapDispatchToProps = {
  setSelectedPalette: actions.setSelectedPalette,
  setSelectedBrush: actions.setSelectedBrush
};

export default connect(mapStateToProps, mapDispatchToProps)(PalettePicker);
