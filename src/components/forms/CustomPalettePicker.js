import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Solver from "3x3-equation-solver";
import cx from "classnames";
import * as actions from "../../actions";
import l10n from "../../lib/helpers/l10n";
import { FormField } from "../library/Forms";
import Button from "../library/Button";
import { getPalettesLookup } from "../../reducers/entitiesReducer";
import { PaletteShape } from "../../reducers/stateShape";

const DEFAULT_WHITE = "E8F8E0";
const DEFAULT_LIGHT = "B0F088";
const DEFAULT_DARK = "509878";
const DEFAULT_BLACK = "202850";

const channelValues = Array.from(Array(32).keys());

const hexToDecimal = (str) => {
  return parseInt(str, 16);
};

const clamp = (value, min, max) => {
  return Math.min(max, Math.max(min, value));
};

const clamp31 = (value) => {
  return clamp(value, 0, 31);
};

/* 5-bit rgb value => GBC representative hex value */
const rgbToGBCHex = (red, green, blue) => {
  const value = (blue << 10) + (green << 5) + red;
  const r = value & 0x1f;
  const g = (value >> 5) & 0x1f;
  const b = (value >> 10) & 0x1f;
  return (
    (((r * 13 + g * 2 + b) >> 1) << 16) |
    ((g * 3 + b) << 9) |
    ((r * 3 + g * 2 + b * 11) >> 1)
  )
    .toString(16)
    .padStart(6, "0");
};

window.rgbToGBCHex = rgbToGBCHex;

/* 24-bit hex value => GBC representative Hex value */
const hexToGBCHex = (hex) => {
  const r = clamp31(Math.floor(hexToDecimal(hex.substring(0, 2)) / 8));
  const g = clamp31(Math.floor(hexToDecimal(hex.substring(2, 4)) / 8));
  const b = clamp31(Math.floor(hexToDecimal(hex.substring(4)) / 8));
  return rgbToGBCHex(r, g, b);
};

const decimalToHexString = (number) => {
  const ret = number.toString(16).toUpperCase();
  return ret.length === 1 ? `0${ret}` : ret;
};

/* GBC representative Hex value => Closest matching 24-bit hex value => */
const GBCHexToClosestHex = (hex) => {
  if (hex.toLowerCase() === "ff0000") return hex; // otherwise comes back as 31,3,0
  const r = Math.floor(hexToDecimal(hex.substring(0, 2)));
  const g = Math.floor(hexToDecimal(hex.substring(2, 4)));
  const b = Math.floor(hexToDecimal(hex.substring(4)));
  const [r2, g2, b2] = Solver([
    [13, 2, 1, r << 1],
    [0, 3, 1, g >> 1],
    [3, 2, 11, b << 1],
  ]);
  return (
    (Math.round(255 * (clamp31(r2) / 31)) << 16) +
    (Math.round(255 * (clamp31(g2) / 31)) << 8) +
    Math.round(255 * (clamp31(b2) / 31))
  )
    .toString(16)
    .padStart(6, "0");
};

class CustomPalettePicker extends Component {
  constructor(props) {
    super(props);

    const { palette } = this.props;

    this.state = {
      selectedColor: 0,
      currentR: 0,
      currentG: 0,
      currentB: 0,
      whiteHex: palette.colors[0] || DEFAULT_WHITE,
      lightHex: palette.colors[1] || DEFAULT_LIGHT,
      darkHex: palette.colors[2] || DEFAULT_DARK,
      blackHex: palette.colors[3] || DEFAULT_BLACK,
      currentCustomHex: "",
    };
  }

  setCurrentColor(r, g, b) {
    console.log("setCurrentColor", r, g, b);
    const { selectedColor, whiteHex, lightHex, darkHex, blackHex } = this.state;
    const { editPalette, paletteId } = this.props;

    const hexString =
      decimalToHexString(r * 8) +
      decimalToHexString(g * 8) +
      decimalToHexString(b * 8);

    if (selectedColor === 0) {
      this.setState({ whiteHex: hexString });
      editPalette(paletteId, {
        colors: [hexString, lightHex, darkHex, blackHex],
      });
    } else if (selectedColor === 1) {
      this.setState({ lightHex: hexString });
      editPalette(paletteId, {
        colors: [whiteHex, hexString, darkHex, blackHex],
      });
    } else if (selectedColor === 2) {
      this.setState({ darkHex: hexString });
      editPalette(paletteId, {
        colors: [whiteHex, lightHex, hexString, blackHex],
      });
    } else if (selectedColor === 3) {
      this.setState({ blackHex: hexString });
      editPalette(paletteId, {
        colors: [whiteHex, lightHex, darkHex, hexString],
      });
    }
  }

  onColorSelect = (colorIndex) => (e) => {
    const { whiteHex, lightHex, darkHex, blackHex } = this.state;
    this.setState({ selectedColor: colorIndex });
    if (colorIndex === 0) {
      this.applyHexToState(whiteHex);
    } else if (colorIndex === 1) {
      this.applyHexToState(lightHex);
    } else if (colorIndex === 2) {
      this.applyHexToState(darkHex);
    } else if (colorIndex === 3) {
      this.applyHexToState(blackHex);
    }
  };

  hexChange = (e) => {
    const parsedValue = e.target.value.replace(/[^#A-Fa-f0-9]/g, "");
    const croppedValue = parsedValue.startsWith("#")
      ? parsedValue.substring(0, 7)
      : parsedValue.substring(0, 6);

    this.setState({ currentCustomHex: croppedValue });

    let hex = croppedValue.replace("#", "");
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length === 6) {
      hex = GBCHexToClosestHex(hex);
      const result = this.applyHexToState(hex);
      this.setCurrentColor(result.r, result.g, result.b);
    }
  };

  onColorComponentChange = (channel) => (e) => {
    const { currentR, currentG, currentB } = this.state;
    const newValue = e.currentTarget ? e.currentTarget.value : e;
    const min = 0;
    const max = 31;
    const value = Math.max(min, Math.min(max, newValue));
    if (channel === "colorR") {
      this.setState({ currentR: value || "" });
      this.setCurrentColor(value, currentG, currentB);
    } else if (channel === "colorG") {
      this.setState({ currentG: value || "" });
      this.setCurrentColor(currentR, value, currentB);
    } else if (channel === "colorB") {
      this.setState({ currentB: value || "" });
      this.setCurrentColor(currentR, currentG, value);
    }
  };

  onRestoreDefault = () => {
    const { editPalette, paletteId } = this.props;
    this.setState(
      {
        currentR: 0,
        currentG: 0,
        currentB: 0,
        whiteHex: DEFAULT_WHITE,
        lightHex: DEFAULT_LIGHT,
        darkHex: DEFAULT_DARK,
        blackHex: DEFAULT_BLACK,
        currentCustomHex: "",
      },
      () => {
        editPalette(paletteId, {
          colors: [DEFAULT_WHITE, DEFAULT_LIGHT, DEFAULT_DARK, DEFAULT_BLACK],
        });
      }
    );
  };

  decimalToHexString = (number) => {
    const ret = number.toString(16).toUpperCase();
    return ret.length === 1 ? `0${ret}` : ret;
  };

  applyHexToState(hex) {
    let r = hexToDecimal(hex.substring(0, 2)) / 8;
    let g = hexToDecimal(hex.substring(2, 4)) / 8;
    let b = hexToDecimal(hex.substring(4)) / 8;

    if (r > 31) r = 31;
    if (g > 31) g = 31;
    if (b > 31) b = 31;

    this.setState({
      currentR: Math.floor(r),
      currentG: Math.floor(g),
      currentB: Math.floor(b),
    });

    return {
      r,
      g,
      b,
    };
  }

  render() {
    const { palette } = this.props;
    const {
      currentR,
      currentG,
      currentB,
      currentCustomHex,
      selectedColor,
    } = this.state;

    return (
      <div className="CustomPalettePicker">
        <div className="CustomPalettePicker__Colors">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={cx("CustomPalettePicker__Button", {
                "CustomPalettePicker__Button--Selected":
                  selectedColor === index,
              })}
              onClick={this.onColorSelect(index)}
              style={{
                backgroundColor: `#${hexToGBCHex(palette.colors[index])}`,
              }}
            />
          ))}
        </div>

        <FormField>
          <label htmlFor="colorHex">
            {l10n("FIELD_HEX_COLOR")}
            <small> ({l10n("FIELD_CLOSEST_MATCH")})</small>

            <input
              className="Input--Large"
              type="text"
              maxLength="7"
              placeholder="#000000"
              value={currentCustomHex}
              onChange={this.hexChange.bind()}
            />
          </label>
        </FormField>

        <FormField thirdWidth>
          <label htmlFor="colorR">
            {l10n("FIELD_CUSTOM_RED")}
            <small> (0-31)</small>
            <input
              type="number"
              value={currentR}
              min={0}
              max={31}
              placeholder={0}
              onChange={this.onColorComponentChange("colorR")}
            />
          </label>
          <div className="CustomPalettePicker__ChannelRow">
            {channelValues.map((channelIndex) => (
              <div
                className={cx("CustomPalettePicker__ChannelBlock", {
                  "CustomPalettePicker__ChannelBlock--Selected": currentR
                    ? currentR === channelIndex
                    : channelIndex === 0,
                })}
                style={{
                  backgroundColor: `#${rgbToGBCHex(
                    channelIndex,
                    currentG,
                    currentB
                  )}`,
                }}
                onClick={() =>
                  this.onColorComponentChange("colorR")(channelIndex)
                }
              />
            ))}
          </div>
        </FormField>

        <FormField thirdWidth>
          <label htmlFor="colorG">
            {l10n("FIELD_CUSTOM_GREEN")}
            <small> (0-31)</small>
            <input
              type="number"
              value={currentG}
              min={0}
              max={31}
              placeholder={0}
              onChange={this.onColorComponentChange("colorG")}
            />
          </label>
          <div className="CustomPalettePicker__ChannelRow">
            {channelValues.map((channelIndex) => (
              <div
                className={cx("CustomPalettePicker__ChannelBlock", {
                  "CustomPalettePicker__ChannelBlock--Selected": currentG
                    ? currentG === channelIndex
                    : channelIndex === 0,
                })}
                style={{
                  backgroundColor: `#${rgbToGBCHex(
                    currentR,
                    channelIndex,
                    currentB
                  )}`,
                }}
                onClick={() =>
                  this.onColorComponentChange("colorG")(channelIndex)
                }
              />
            ))}
          </div>
        </FormField>

        <FormField thirdWidth>
          <label htmlFor="colorB">
            {l10n("FIELD_CUSTOM_BLUE")}
            <small> (0-31)</small>
            <input
              type="number"
              value={currentB}
              min={0}
              max={31}
              placeholder={0}
              onChange={this.onColorComponentChange("colorB")}
            />
          </label>
          <div className="CustomPalettePicker__ChannelRow">
            {channelValues.map((channelIndex) => (
              <div
                className={cx("CustomPalettePicker__ChannelBlock", {
                  "CustomPalettePicker__ChannelBlock--Selected": currentB
                    ? currentB === channelIndex
                    : channelIndex === 0,
                })}
                style={{
                  backgroundColor: `#${rgbToGBCHex(
                    currentR,
                    currentG,
                    channelIndex
                  )}`,
                }}
                onClick={() =>
                  this.onColorComponentChange("colorB")(channelIndex)
                }
              />
            ))}
          </div>
        </FormField>

        <div style={{ marginTop: 10 }}>
          <Button onClick={this.onRestoreDefault}>
            {l10n("FIELD_RESTORE_DEFAULT")}
          </Button>
        </div>
      </div>
    );
  }
}

CustomPalettePicker.propTypes = {
  palette: PaletteShape,
  paletteId: PropTypes.string.isRequired,
  editPalette: PropTypes.func.isRequired,
};

CustomPalettePicker.defaultProps = {
  palette: {
    id: "",
    colors: [],
  },
};

function mapStateToProps(state, props) {
  const { paletteId } = props;
  const palette = getPalettesLookup(state)[paletteId];
  return {
    palette,
  };
}

const mapDispatchToProps = {
  editPalette: actions.editPalette,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomPalettePicker);
