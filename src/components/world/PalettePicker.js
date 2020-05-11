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
    }
  };

  setTool = (id) => (e) => {
    e.stopPropagation();
    const { setTool } = this.props;
    setTool(id);
    this.setState({
      add: false,
    });
  };

  setSelectedPalette = (paletteIndex) => (e) => {
    const { setSelectedPalette } = this.props;
    setSelectedPalette(paletteIndex);
  };

  render() {
    const { selectedPalette, visible } = this.props;
    return (
      <div
        className={cx("PalettePicker", { "PalettePicker--Visible": visible })}
      >
        <div
          onClick={this.setTool("colors")}
          className={cx("PalettePicker__Item", {
            "PalettePicker__Item--Selected": true,
          })}
          title={`${l10n("TOOL_COLORS_LABEL")} (z)`}
        >
          <SquareIconSmall />
        </div>
        <div
          onClick={this.setTool("colors")}
          className={cx("PalettePicker__Item", {
            "PalettePicker__Item--Selected": false,
          })}
          title={`${l10n("TOOL_COLORS_LABEL")} (z)`}
        >
          <SquareIcon />
        </div>
        <div
          onClick={this.setTool("colors")}
          className={cx("PalettePicker__Item", {
            "PalettePicker__Item--Selected": false,
          })}
          title={`${l10n("TOOL_COLORS_LABEL")} (z)`}
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
            title={`${l10n("TOOL_COLORS_LABEL")} (z)`}
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
};

function mapStateToProps(state) {
  return {
    selectedPalette: state.editor.selectedPalette,
    visible: state.tools.selected === "colors",
  };
}

const mapDispatchToProps = {
  setSelectedPalette: actions.setSelectedPalette,
};

export default connect(mapStateToProps, mapDispatchToProps)(PalettePicker);
