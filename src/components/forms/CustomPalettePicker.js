import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import l10n from "../../lib/helpers/l10n";
import { FormField } from "../library/Forms";
import * as actions from "../../actions";
import Button from "../library/Button";
import Solver from "3x3-equation-solver";

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

    const { settings } = this.props;

    this.state = {
      selectedPalette: -1,
      currentR: 0,
      currentG: 0,
      currentB: 0,
      whiteHex: settings.customColorsWhite || DEFAULT_WHITE,
      lightHex: settings.customColorsLight || DEFAULT_LIGHT,
      darkHex: settings.customColorsDark || DEFAULT_DARK,
      blackHex: settings.customColorsBlack || DEFAULT_BLACK,
      currentCustomHex: ""
    };
  }

  paletteSelect = e => {
    if (e.target.id == "customColor_0") {
      if (this.state.selectedPalette == 0) {
        this.setState({ selectedPalette: -1 });
      } else {
        this.setState({ selectedPalette: 0 });
        this.applyHexToState(this.state.whiteHex);
      }
    } else if (e.target.id == "customColor_1") {
      if (this.state.selectedPalette == 1) {
        this.setState({ selectedPalette: -1 });
      } else {
        this.setState({ selectedPalette: 1 });
        this.applyHexToState(this.state.lightHex);
      }
    } else if (e.target.id == "customColor_2") {
      if (this.state.selectedPalette == 2) {
        this.setState({ selectedPalette: -1 });
      } else {
        this.setState({ selectedPalette: 2 });
        this.applyHexToState(this.state.darkHex);
      }
    } else if (e.target.id == "customColor_3") {
      if (this.state.selectedPalette == 3) {
        this.setState({ selectedPalette: -1 });
      } else {
        this.setState({ selectedPalette: 3 });
        this.applyHexToState(this.state.blackHex);
      }
    }
  };

  applyHexToState(hex) {
    var r = this.hexToDecimal(hex.substring(0, 2)) / 8;
    var g = this.hexToDecimal(hex.substring(2, 4)) / 8;
    var b = this.hexToDecimal(hex.substring(4)) / 8;

    if (r > 31) r = 31;
    if (g > 31) g = 31;
    if (b > 31) b = 31;

    this.setState({
      currentR: Math.floor(r),
      currentG: Math.floor(g),
      currentB: Math.floor(b)
    });

    return {
      r: r,
      g: g,
      b: b
    };
  }

  decimalToHexString(number) {
    var ret = number.toString(16).toUpperCase();
    return ret.length == 1 ? "0" + ret : ret;
  }

  hexToDecimal(str) {
    return parseInt("0x" + str);
  }

  setCurrentColor(r, g, b) {
    const { editProjectSettings } = this.props;

    const hexString =
      this.decimalToHexString(r * 8) +
      this.decimalToHexString(g * 8) +
      this.decimalToHexString(b * 8);

    if (this.state.selectedPalette == 0) {
      this.setState({ whiteHex: hexString });
      editProjectSettings({ customColorsWhite: hexString });
    } else if (this.state.selectedPalette == 1) {
      this.setState({ lightHex: hexString });
      editProjectSettings({ customColorsLight: hexString });
    } else if (this.state.selectedPalette == 2) {
      this.setState({ darkHex: hexString });
      editProjectSettings({ customColorsDark: hexString });
    } else if (this.state.selectedPalette == 3) {
      this.setState({ blackHex: hexString });
      editProjectSettings({ customColorsBlack: hexString });
    }
  }

  hexChange = e => {
    this.setState({ currentCustomHex: e.target.value });
  };

  colorChange = e => {
    const min = 0;
    const max = 31;
    const value = Math.max(min, Math.min(max, e.currentTarget.value));

    if (e.target.id === "colorR") {
      this.setState({ currentR: value || "" });
      this.setCurrentColor(value, this.state.currentG, this.state.currentB);
    } else if (e.target.id === "colorG") {
      this.setState({ currentG: value || "" });
      this.setCurrentColor(this.state.currentR, value, this.state.currentB);
    } else if (e.target.id === "colorB") {
      this.setState({ currentB: value || "" });
      this.setCurrentColor(this.state.currentR, this.state.currentG, value);
    }
  };

  handleHexConvertClick = e => {
    var hex = this.state.currentCustomHex.replace("#", "");

    if (hex.length == 6) {
      hex = GBCHexToClosestHex(hex);
      var result = this.applyHexToState(hex);
      this.setCurrentColor(result.r, result.g, result.b);
      this.setState({ currentCustomHex: "" });
    } else {
      // Show error?
    }
  };

  handleDefaultPaletteClick = e => {
    var result;

    if (this.state.selectedPalette == 0) {
      result = this.applyHexToState(DEFAULT_WHITE); // White
    } else if (this.state.selectedPalette == 1) {
      result = this.applyHexToState(DEFAULT_LIGHT); // Light Green
    } else if (this.state.selectedPalette == 2) {
      result = this.applyHexToState(DEFAULT_DARK); // Dark Green
    } else if (this.state.selectedPalette == 3) {
      result = this.applyHexToState(DEFAULT_BLACK); // Black
    }

    this.setCurrentColor(result.r, result.g, result.b);
  };

  onRestoreDefault = e => {
    const { editProjectSettings } = this.props;
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
        editProjectSettings({       
          customColorsWhite: DEFAULT_WHITE,
          customColorsLight: DEFAULT_LIGHT,
          customColorsDark: DEFAULT_DARK,
          customColorsBlack: DEFAULT_BLACK
        });
      }
    );
  };

  render() {
    const { settings } = this.props;

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

              <label htmlFor="customColor_0" title={l10n("FIELD_COLOR1_NAME")}>
                <input
                  id="customColor_0"
                  type="checkbox"
                  onChange={this.paletteSelect.bind()}
                  checked={this.state.selectedPalette === 0}
                />
                <div
                  className="CustomPalettePicker__Button CustomPalettePicker__Button--Left"
                  style={{
                    backgroundImage: `linear-gradient(#${hexToGBCHex(
                      DEFAULT_WHITE
                    )} 48.5%, var(--input-border-color) 49.5%, #${hexToGBCHex(
                      settings.customColorsWhite
                    )} 50%)`
                  }}
                >
                  &nbsp;
                </div>
              </label>
              <label htmlFor="customColor_1" title={l10n("FIELD_COLOR2_NAME")}>
                <input
                  id="customColor_1"
                  type="checkbox"
                  onChange={this.paletteSelect.bind()}
                  checked={this.state.selectedPalette === 1}
                />
                <div
                  className="CustomPalettePicker__Button CustomPalettePicker__Button--Middle"
                  style={{
                    backgroundImage: `linear-gradient(#${hexToGBCHex(
                      DEFAULT_LIGHT
                    )} 48.9%, var(--input-border-color) 49.5%, #${hexToGBCHex(
                      settings.customColorsLight
                    )} 50%)`
                  }}
                >
                  &nbsp;
                </div>
              </label>
              <label htmlFor="customColor_2" title={l10n("FIELD_COLOR3_NAME")}>
                <input
                  id="customColor_2"
                  type="checkbox"
                  onChange={this.paletteSelect.bind()}
                  checked={this.state.selectedPalette === 2}
                />
                <div
                  className="CustomPalettePicker__Button CustomPalettePicker__Button--Middle"
                  style={{
                    backgroundImage: `linear-gradient(#${hexToGBCHex(
                      DEFAULT_DARK
                    )} 48.9%, var(--input-border-color) 49.5%, #${hexToGBCHex(
                      settings.customColorsDark
                    )} 50%)`
                  }}
                >
                  &nbsp;
                </div>
              </label>
              <label htmlFor="customColor_3" title={l10n("FIELD_COLOR4_NAME")}>
                <input
                  id="customColor_3"
                  type="checkbox"
                  onChange={this.paletteSelect.bind()}
                  checked={this.state.selectedPalette === 3}
                />
                <div
                  className="CustomPalettePicker__Button CustomPalettePicker__Button--Right"
                  style={{
                    backgroundImage: `linear-gradient(#${hexToGBCHex(
                      DEFAULT_BLACK
                    )} 48.9%, var(--input-border-color) 49.5%, #${hexToGBCHex(
                      settings.customColorsBlack
                    )} 50%)`
                  }}
                >
                  &nbsp;
                </div>
              </label>
            </div>
          </div>

          <div
            id="CustomPaletteEdit"
            className="CustomPalettePicker__Column"
            style={this.state.selectedPalette == -1 ? { display: "none" } : {}}
          >
            <FormField thirdWidth>
              <label htmlFor="colorR">
                {l10n("FIELD_CUSTOM_RED")}
                <small> (0-31)</small>
                <input
                  id="colorR"
                  type="number"
                  value={this.state.currentR}
                  min={0}
                  max={31}
                  placeholder={0}
                  onChange={this.colorChange.bind()}
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
                  value={this.state.currentG}
                  min={0}
                  max={31}
                  placeholder={0}
                  onChange={this.colorChange.bind()}
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
                  value={this.state.currentB}
                  min={0}
                  max={31}
                  placeholder={0}
                  onChange={this.colorChange.bind()}
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
                  value={this.state.currentCustomHex}
                  onChange={this.hexChange.bind()}
                />
              </label>
            </FormField>

            <FormField halfWidth>
              <button
                id="btnConvertHex"
                className="Button"
                style={{ width: "100%" }}
                onClick={this.handleHexConvertClick}
              >
                {l10n("FIELD_CUSTOM_HEX")}
              </button>
            </FormField>
          </div>
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
  settings: PropTypes.shape({
    customColorsWhite: PropTypes.string,
    customColorsLight: PropTypes.string,
    customColorsDark: PropTypes.string,
    customColorsBlack: PropTypes.string
  }).isRequired,
  editProjectSettings: PropTypes.func.isRequired
};

CustomPalettePicker.defaultProps = {
  id: undefined
};

function mapStateToProps(state, props) {
  const project = state.entities.present.result;
  const { settings } = project;
  return {
    settings
  };
}

const mapDispatchToProps = {
  editProjectSettings: actions.editProjectSettings
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomPalettePicker);
