import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import * as actions from "../../actions";
import l10n from "../../lib/helpers/l10n";
import { FormField } from "../library/Forms";
import Button from "../library/Button";
import Solver from "3x3-equation-solver";
import { getPalettesLookup } from "../../reducers/entitiesReducer";
import { PaletteShape } from "../../reducers/stateShape";

const DEFAULT_WHITE = "E8F8E0";
const DEFAULT_LIGHT = "B0F088";
const DEFAULT_DARK = "509878";
const DEFAULT_BLACK = "202850";

const hexToDecimal = str => {
  return parseInt(str, 16);
};

const clamp = (value, min, max) => {
  return Math.min(max, Math.max(min, value));
}

const clamp31 = (value) => {
  return clamp(value, 0, 31);
}

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
  ).toString(16).padStart(6, "0");
};

/* 24-bit hex value => GBC representative Hex value */
const hexToGBCHex = hex => {
  let r = clamp31(Math.floor(hexToDecimal(hex.substring(0, 2)) / 8));
  let g = clamp31(Math.floor(hexToDecimal(hex.substring(2, 4)) / 8));
  let b = clamp31(Math.floor(hexToDecimal(hex.substring(4)) / 8));
  return rgbToGBCHex(r, g, b);
};

/* GBC representative Hex value => Closest matching 24-bit hex value => */
const GBCHexToClosestHex = hex => {
  if(hex.toLowerCase() === "ff0000") return hex; // otherwise comes back as 31,3,0
  const r = Math.floor(hexToDecimal(hex.substring(0, 2)));
  const g = Math.floor(hexToDecimal(hex.substring(2, 4)));
  const b = Math.floor(hexToDecimal(hex.substring(4)));
  const [r2, g2, b2] = Solver([
    [13, 2, 1, r << 1],
    [0, 3, 1, g >> 1],
    [3, 2, 11, b << 1]
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
      selectedColor: -1,
      currentR: 0,
      currentG: 0,
      currentB: 0,
      whiteHex: palette.colors[0] || DEFAULT_WHITE,
      lightHex: palette.colors[1] || DEFAULT_LIGHT,
      darkHex: palette.colors[2] || DEFAULT_DARK,
      blackHex: palette.colors[3] || DEFAULT_BLACK,
      currentCustomHex: ""
    };
  }

  setCurrentColor(r, g, b) {
    const { selectedColor, whiteHex, lightHex, darkHex, blackHex } = this.state;
    const { editPalette, paletteId } = this.props;

    const hexString =
      this.decimalToHexString(r * 8) +
      this.decimalToHexString(g * 8) +
      this.decimalToHexString(b * 8);

    if (selectedColor === 0) {
      this.setState({ whiteHex: hexString });
      editPalette(paletteId, {
        colors: [hexString, lightHex, darkHex, blackHex]
      })
    } else if (selectedColor === 1) {
      this.setState({ lightHex: hexString });
      editPalette(paletteId, {
        colors: [whiteHex, hexString, darkHex, blackHex]
      })
    } else if (selectedColor === 2) {
      this.setState({ darkHex: hexString });
      editPalette(paletteId, {
        colors: [whiteHex, lightHex, hexString, blackHex]
      })
    } else if (selectedColor === 3) {
      this.setState({ blackHex: hexString });
      editPalette(paletteId, {
        colors: [whiteHex, lightHex, darkHex, hexString]
      })
    }
  }

  onColorSelect = e => {
    const { selectedColor, whiteHex, lightHex, darkHex, blackHex } = this.state;
    const { id } = this.props;

    if (e.target.id === `${id}-customColor_0`) {
      if (selectedColor === 0) {
        this.setState({ selectedColor: -1 });
      } else {
        this.setState({ selectedColor: 0 });
        this.applyHexToState(whiteHex);
      }
    } else if (e.target.id === `${id}-customColor_1`) {
      if (selectedColor === 1) {
        this.setState({ selectedColor: -1 });
      } else {
        this.setState({ selectedColor: 1 });
        this.applyHexToState(lightHex);
      }
    } else if (e.target.id === `${id}-customColor_2`) {
      if (selectedColor === 2) {
        this.setState({ selectedColor: -1 });
      } else {
        this.setState({ selectedColor: 2 });
        this.applyHexToState(darkHex);
      }
    } else if (e.target.id === `${id}-customColor_3`) {
      if (selectedColor === 3) {
        this.setState({ selectedColor: -1 });
      } else {
        this.setState({ selectedColor: 3 });
        this.applyHexToState(blackHex);
      }
    }
  };

  hexChange = e => {
    this.setState({ currentCustomHex: e.target.value });
  };

  onColorComponentChange = e => {
    const { currentR, currentG, currentB } = this.state;
    const min = 0;
    const max = 31;
    const value = Math.max(min, Math.min(max, e.currentTarget.value));

    if (e.target.id === "colorR") {
      this.setState({ currentR: value || "" });
      this.setCurrentColor(value, currentG, currentB);
    } else if (e.target.id === "colorG") {
      this.setState({ currentG: value || "" });
      this.setCurrentColor(currentR, value, currentB);
    } else if (e.target.id === "colorB") {
      this.setState({ currentB: value || "" });
      this.setCurrentColor(currentR, currentG, value);
    }
  };

  handleHexConvertClick = () => {
    const { currentCustomHex } = this.state;
    const hex = currentCustomHex.replace("#", "");

    if (hex.length == 6) {
      hex = GBCHexToClosestHex(hex);
      const result = this.applyHexToState(hex);
      this.setCurrentColor(result.r, result.g, result.b);
      this.setState({ currentCustomHex: "" });
    } else {
      // Show error?
    }
  };

  onRestoreDefault = () => {
    const { editPalette, paletteId } = this.props;
    this.setState(
      {
        selectedPalette: -1,
        currentR: 0,
        currentG: 0,
        currentB: 0,           
        whiteHex: DEFAULT_WHITE,
        lightHex: DEFAULT_LIGHT,
        darkHex: DEFAULT_DARK,
        blackHex: DEFAULT_BLACK,
        currentCustomHex: ""        
      },
      () => {
        editPalette(paletteId, {
          colors: [
            DEFAULT_WHITE, 
            DEFAULT_LIGHT, 
            DEFAULT_DARK, 
            DEFAULT_BLACK
          ]
        });
      }
    );
  };

  decimalToHexString = number => {
    const ret = number.toString(16).toUpperCase();
    return ret.length === 1 ? `0${  ret}` : ret;
  }

  hexToDecimal = str => {
    return parseInt(`0x${  str}`);
  }

  applyHexToState(hex) {
    let r = this.hexToDecimal(hex.substring(0, 2)) / 8;
    let g = this.hexToDecimal(hex.substring(2, 4)) / 8;
    let b = this.hexToDecimal(hex.substring(4)) / 8;

    if (r > 31) r = 31;
    if (g > 31) g = 31;
    if (b > 31) b = 31;

    this.setState({
      currentR: Math.floor(r),
      currentG: Math.floor(g),
      currentB: Math.floor(b)
    });

    return {
      r,
      g,
      b
    };
  };

  render() {
    const { id, palette } = this.props;
    const { currentR, currentG, currentB, currentCustomHex, selectedColor } = this.state;

    return (
      <div className="CustomPalettePicker">
        <div className="CustomPalettePicker__Columns">
          <div className="CustomPalettePicker__Column">
            <div className="CustomPalettePicker__Colors">
              <div className="CustomPalettePicker__Legend">
                {l10n("FIELD_ORIGINAL")}
                <br />
                {l10n("FIELD_CUSTOM")}
              </div>

              <label htmlFor={`${id}-customColor_0`} title={l10n("FIELD_COLOR1_NAME")}>
                <input
                  id={`${id}-customColor_0`}
                  type="checkbox"
                  onChange={this.onColorSelect}
                  checked={selectedColor === 0}
                />
                <div
                  className="CustomPalettePicker__Button CustomPalettePicker__Button--Left"
                  style={{
                    backgroundImage: `linear-gradient(#${hexToGBCHex(DEFAULT_WHITE)} 48.5%, var(--input-border-color) 49.5%, #${hexToGBCHex(palette.colors[0])} 50%)`
                  }}
                >
                  &nbsp;
                </div>
              </label>
              <label htmlFor={`${id}-customColor_1`} title={l10n("FIELD_COLOR2_NAME")}>
                <input
                  id={`${id}-customColor_1`}
                  type="checkbox"
                  onChange={this.onColorSelect}
                  checked={selectedColor === 1}
                />
                <div
                  className="CustomPalettePicker__Button CustomPalettePicker__Button--Middle"
                  style={{
                    backgroundImage: `linear-gradient(#${hexToGBCHex(DEFAULT_LIGHT)} 48.9%, var(--input-border-color) 49.5%, #${hexToGBCHex(palette.colors[1])
                    } 50%)`
                  }}
                >
                  &nbsp;
                </div>
              </label>
              <label htmlFor={`${id}-customColor_2`} title={l10n("FIELD_COLOR3_NAME")}>
                <input
                  id={`${id}-customColor_2`}
                  type="checkbox"
                  onChange={this.onColorSelect}
                  checked={selectedColor === 2}
                />
                <div
                  className="CustomPalettePicker__Button CustomPalettePicker__Button--Middle"
                  style={{
                    backgroundImage: `linear-gradient(#${hexToGBCHex(DEFAULT_DARK)} 48.9%, var(--input-border-color) 49.5%, #${hexToGBCHex(palette.colors[2])} 50%)`
                  }}
                >
                  &nbsp;
                </div>
              </label>
              <label htmlFor={`${id}-customColor_3`} title={l10n("FIELD_COLOR4_NAME")}>
                <input
                  id={`${id}-customColor_3`}
                  type="checkbox"
                  onChange={this.onColorSelect}
                  checked={selectedColor === 3}
                />
                <div
                  className="CustomPalettePicker__Button CustomPalettePicker__Button--Right"
                  style={{
                    backgroundImage: `linear-gradient(#${hexToGBCHex(DEFAULT_BLACK)} 48.9%, var(--input-border-color) 49.5%, #${hexToGBCHex(palette.colors[3])} 50%)`
                  }}
                >
                  &nbsp;
                </div>
              </label>
            </div>
          </div>

          { selectedColor === -1 ? '' :
          <div
            id="CustomPaletteEdit"
            className="CustomPalettePicker__Column"
          >
            <FormField thirdWidth>
              <label htmlFor="colorR">
                {l10n("FIELD_CUSTOM_RED")}
                <small> (0-31)</small>
                <input
                  id="colorR"
                  type="number"
                  value={currentR}
                  min={0}
                  max={31}
                  placeholder={0}
                  onChange={this.onColorComponentChange}
                />
              </label>
            </FormField>

            <FormField thirdWidth>
              <label htmlFor="colorG">
                {l10n("FIELD_CUSTOM_GREEN")}
                <small> (0-31)</small>
                <input
                  id="colorG"
                  type="number"
                  value={currentG}
                  min={0}
                  max={31}
                  placeholder={0}
                  onChange={this.onColorComponentChange}
                />
              </label>
            </FormField>

            <FormField thirdWidth>
              <label htmlFor="colorB">
                {l10n("FIELD_CUSTOM_BLUE")}
                <small> (0-31)</small>
                <input
                  id="colorB"
                  type="number"
                  value={currentB}
                  min={0}
                  max={31}
                  placeholder={0}
                  onChange={this.onColorComponentChange}
                />
              </label>
            </FormField>

            <FormField halfWidth>
              <label htmlFor="colorHex">
                <input
                  id="colorHex"
                  type="text"
                  maxLength="7"
                  placeholder="#000000"
                  value={currentCustomHex}
                  onChange={this.hexChange.bind()}
                />
              </label>
            </FormField>

            <FormField halfWidth>
              <button
                id="btnConvertHex"
                type="button"
                className="Button"
                style={{ width: "100%" }}
                onClick={this.handleHexConvertClick}
              >
                {l10n("FIELD_CUSTOM_HEX")}
              </button>
            </FormField>
          </div>
          }
        </div>
        <div style={{ marginTop: 30 }}>
          <Button onClick={this.onRestoreDefault}>
            {l10n("FIELD_RESTORE_DEFAULT")}
          </Button>
        </div>
      </div>
    );
  }
}

CustomPalettePicker.propTypes = {
  id: PropTypes.string.isRequired,
  palette: PaletteShape,
  editPalette: PropTypes.func.isRequired
};

CustomPalettePicker.defaultProps = {
  palette: {
    id: "",
    colors: []
  }
};

function mapStateToProps(state, props) {
  const { paletteId } = props;
  const palette = getPalettesLookup(state)[paletteId];
  return {
    palette
  };
}

const mapDispatchToProps = {
  editPalette: actions.editPalette
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomPalettePicker);
