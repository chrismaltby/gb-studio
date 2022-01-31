import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Solver from "3x3-equation-solver";
import cx from "classnames";
import l10n from "lib/helpers/l10n";
import { FormField } from "../library/Forms";
import ColorSlider from "./ColorSlider";
import { paletteSelectors } from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import { Button } from "ui/buttons/Button";
import { clipboard } from "store/features/clipboard/clipboardHelpers";

const DEFAULT_WHITE = "E8F8E0";
const DEFAULT_LIGHT = "B0F088";
const DEFAULT_DARK = "509878";
const DEFAULT_BLACK = "202850";

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
  return rgbToGBCHex(r, g, b).toUpperCase();
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

const HSVtoRGB = (h, s, v) => {
  let r;
  let g;
  let b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: {
      r = v;
      g = t;
      b = p;
      break;
    }
    case 1: {
      r = q;
      g = v;
      b = p;
      break;
    }
    case 2: {
      r = p;
      g = v;
      b = t;
      break;
    }
    case 3: {
      r = p;
      g = q;
      b = v;
      break;
    }
    case 4: {
      r = t;
      g = p;
      b = v;
      break;
    }
    case 5: {
      r = v;
      g = p;
      b = q;
      break;
    }
    default:
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
};

const RGBtoHSV = (r, g, b) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h;
  const s = max === 0 ? 0 : d / max;
  const v = max / 255;

  switch (max) {
    case min:
      h = 0;
      break;
    case r:
      h = g - b + d * (g < b ? 6 : 0);
      h /= 6 * d;
      break;
    case g:
      h = b - r + d * 2;
      h /= 6 * d;
      break;
    case b:
      h = r - g + d * 4;
      h /= 6 * d;
      break;
    default:
  }

  return {
    h,
    s,
    v,
  };
};

class CustomPalettePicker extends Component {
  constructor(props) {
    super(props);

    const { palette } = this.props;

    this.state = {
      selectedColor: -1,
      colorR: 0,
      colorG: 0,
      colorB: 0,
      colorH: 0,
      colorS: 0,
      colorV: 0,
      whiteHex: palette.colors[0] || DEFAULT_WHITE,
      lightHex: palette.colors[1] || DEFAULT_LIGHT,
      darkHex: palette.colors[2] || DEFAULT_DARK,
      blackHex: palette.colors[3] || DEFAULT_BLACK,
      currentCustomHex: "",
    };
  }

  componentDidMount() {
    this.onColorSelect(0)();
    window.addEventListener("copy", this.onCopy);
    window.addEventListener("paste", this.onPaste);
  }

  componentWillUnmount() {
    window.removeEventListener("copy", this.onCopy);
    window.removeEventListener("paste", this.onPaste);
  }

  componentDidUpdate(prevProps) {
    const { palette } = this.props;
    if (palette.id !== prevProps.palette.id) {
      this.setState(
        {
          selectedColor: -1,
          colorR: 0,
          colorG: 0,
          colorB: 0,
          colorH: 0,
          colorS: 0,
          colorV: 0,
          whiteHex: palette.colors[0] || DEFAULT_WHITE,
          lightHex: palette.colors[1] || DEFAULT_LIGHT,
          darkHex: palette.colors[2] || DEFAULT_DARK,
          blackHex: palette.colors[3] || DEFAULT_BLACK,
          currentCustomHex: "",
        },
        () => {
          this.onColorSelect(0)();
        }
      );
    }
  }

  onCopy = (e) => {
    if (e.target.nodeName !== "BODY" && e.target.value.length > 0) {
      return;
    }
    const { palette } = this.props;
    const { selectedColor } = this.state;
    e.preventDefault();
    clipboard.writeText(palette.colors[selectedColor]);
  };

  onPaste = (e) => {
    if (e.target.nodeName !== "BODY") {
      return;
    }
    e.preventDefault();
    try {
      const clipboardData = clipboard.readText();
      const hexString = clipboardData.replace(/[^A-Fa-f0-9]*/g, "");
      if (hexString.length === 6) {
        this.updateCurrentColor(hexString);
      }
    } catch (err) {
      // Clipboard isn't pastable, just ignore it
    }
  };

  onColorSelect = (colorIndex) => (_e) => {
    const { whiteHex, lightHex, darkHex, blackHex } = this.state;
    let editHex;
    if (colorIndex === 0) {
      editHex = whiteHex;
    } else if (colorIndex === 1) {
      editHex = lightHex;
    } else if (colorIndex === 2) {
      editHex = darkHex;
    } else if (colorIndex === 3) {
      editHex = blackHex;
    }
    this.setState({
      selectedColor: colorIndex,
      currentCustomHex: "#" + hexToGBCHex(editHex).toLowerCase(),
    });
    this.applyHexToState(editHex);
  };

  onHexChange = (e) => {
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
      this.applyHexToState(hex);
    }
  };

  onChangeRGB = (channel) => (e) => {
    const newValue = e.currentTarget ? e.currentTarget.value : e;
    const value = clamp31(newValue);
    this.setState(
      { [channel]: value, currentCustomHex: "" },
      this.updateColorFromRGB
    );
  };

  onChangeHSV = (channel) => (e) => {
    const newValue = e.currentTarget ? e.currentTarget.value : e;
    const value =
      channel === "colorH" ? clamp(newValue, 0, 360) : clamp(newValue, 0, 100);
    this.setState(
      { [channel]: value, currentCustomHex: "" },
      this.updateColorFromHSV
    );
  };

  updateColorFromRGB = () => {
    const { colorR: r, colorG: g, colorB: b } = this.state;

    const hexString =
      decimalToHexString(r * 8) +
      decimalToHexString(g * 8) +
      decimalToHexString(b * 8);

    this.updateCurrentColor(hexString);

    const hsv = RGBtoHSV(r * 8, g * 8, b * 8);

    this.setState({
      colorH: Math.floor(hsv.h * 360),
      colorS: Math.floor(hsv.s * 100),
      colorV: Math.floor(hsv.v * 100),
    });
  };

  updateColorFromHSV = () => {
    const { colorH: h, colorS: s, colorV: v } = this.state;

    const rgb = HSVtoRGB(h / 360, s / 100, v / 100);

    let r = Math.round(rgb.r / 8);
    let g = Math.round(rgb.g / 8);
    let b = Math.round(rgb.b / 8);

    if (r > 31) r = 31;
    if (g > 31) g = 31;
    if (b > 31) b = 31;

    const hexString =
      decimalToHexString(r * 8) +
      decimalToHexString(g * 8) +
      decimalToHexString(b * 8);

    this.updateCurrentColor(hexString);

    this.setState({
      colorR: r,
      colorG: g,
      colorB: b,
    });
  };

  updateCurrentColor = (newHex) => {
    const { selectedColor, whiteHex, lightHex, darkHex, blackHex } = this.state;
    const { editPalette, paletteId } = this.props;
    if (selectedColor === 0) {
      this.setState({ whiteHex: newHex });
      editPalette({
        paletteId,
        changes: {
          colors: [newHex, lightHex, darkHex, blackHex],
        },
      });
    } else if (selectedColor === 1) {
      this.setState({ lightHex: newHex });
      editPalette({
        paletteId,
        changes: {
          colors: [whiteHex, newHex, darkHex, blackHex],
        },
      });
    } else if (selectedColor === 2) {
      this.setState({ darkHex: newHex });
      editPalette({
        paletteId,
        changes: {
          colors: [whiteHex, lightHex, newHex, blackHex],
        },
      });
    } else if (selectedColor === 3) {
      this.setState({ blackHex: newHex });
      editPalette({
        paletteId,
        changes: {
          colors: [whiteHex, lightHex, darkHex, newHex],
        },
      });
    }
  };

  onRestoreDefault = () => {
    const { editPalette, paletteId } = this.props;
    this.setState(
      {
        colorR: 0,
        colorG: 0,
        colorB: 0,
        whiteHex: DEFAULT_WHITE,
        lightHex: DEFAULT_LIGHT,
        darkHex: DEFAULT_DARK,
        blackHex: DEFAULT_BLACK,
        currentCustomHex: "",
      },
      () => {
        editPalette({
          paletteId,
          changes: {
            colors: [DEFAULT_WHITE, DEFAULT_LIGHT, DEFAULT_DARK, DEFAULT_BLACK],
          },
        });
      }
    );
  };

  applyHexToState(hex) {
    let r = hexToDecimal(hex.substring(0, 2)) / 8;
    let g = hexToDecimal(hex.substring(2, 4)) / 8;
    let b = hexToDecimal(hex.substring(4)) / 8;

    if (r > 31) r = 31;
    if (g > 31) g = 31;
    if (b > 31) b = 31;

    const hsv = RGBtoHSV(r * 8, g * 8, b * 8);

    this.setState(
      {
        colorR: Math.floor(r),
        colorG: Math.floor(g),
        colorB: Math.floor(b),
        colorH: Math.floor(hsv.h * 360),
        colorS: Math.floor(hsv.s * 100),
        colorV: Math.floor(hsv.v * 100),
      },
      this.updateColorFromRGB
    );
  }

  onReset = () => {
    const { editPalette, palette } = this.props;
    editPalette({
      paletteId: palette.id,
      changes: {
        colors: palette.defaultColors || [],
      },
    });
  };

  onRemove = () => {
    const { removePalette, palette } = this.props;
    removePalette({ paletteId: palette.id });
  };

  render() {
    const { palette } = this.props;
    const {
      colorR,
      colorG,
      colorB,
      colorH,
      colorS,
      colorV,
      currentCustomHex,
      selectedColor,
    } = this.state;

    const selectedHex = hexToGBCHex(palette.colors[selectedColor] || "ffffff");

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
            >
              {index === 0 && <span>{l10n("FIELD_COLOR_LIGHTEST")}</span>}
              {index === 3 && <span>{l10n("FIELD_COLOR_DARKEST")}</span>}
            </div>
          ))}
        </div>

        <FormField thirdWidth>
          <label htmlFor="colorR">
            {l10n("FIELD_CUSTOM_RED")}
            <small> (0-31)</small>
            <input
              id="colorR"
              type="number"
              value={colorR || ""}
              min={0}
              max={31}
              placeholder={0}
              onChange={this.onChangeRGB("colorR")}
            />
          </label>
          <ColorSlider
            value={(colorR || 0) / 31}
            onChange={(value) =>
              this.onChangeRGB("colorR")(Math.round(value * 31))
            }
            colorAtValue={(value) => {
              return `#${rgbToGBCHex(Math.round(value * 31), colorG, colorB)}`;
            }}
            handleColor={`#${selectedHex}`}
          />
        </FormField>

        <FormField thirdWidth>
          <label htmlFor="colorG">
            {l10n("FIELD_CUSTOM_GREEN")}
            <small> (0-31)</small>
            <input
              id="colorG"
              type="number"
              value={colorG || ""}
              min={0}
              max={31}
              placeholder={0}
              onChange={this.onChangeRGB("colorG")}
            />
          </label>
          <ColorSlider
            value={(colorG || 0) / 31}
            onChange={(value) =>
              this.onChangeRGB("colorG")(Math.round(value * 31))
            }
            colorAtValue={(value) => {
              return `#${rgbToGBCHex(colorR, Math.round(value * 31), colorB)}`;
            }}
            handleColor={`#${selectedHex}`}
          />
        </FormField>

        <FormField thirdWidth>
          <label htmlFor="colorB">
            {l10n("FIELD_CUSTOM_BLUE")}
            <small> (0-31)</small>
            <input
              id="colorB"
              type="number"
              value={colorB || ""}
              min={0}
              max={31}
              placeholder={0}
              onChange={this.onChangeRGB("colorB")}
            />
          </label>
          <ColorSlider
            value={(colorB || 0) / 31}
            onChange={(value) =>
              this.onChangeRGB("colorB")(Math.round(value * 31))
            }
            colorAtValue={(value) => {
              return `#${rgbToGBCHex(colorR, colorG, Math.round(value * 31))}`;
            }}
            handleColor={`#${selectedHex}`}
          />
        </FormField>

        <FormField thirdWidth>
          <label htmlFor="colorHue">
            {l10n("FIELD_HUE")}
            <small> (0-360)</small>
            <input
              id="colorHue"
              type="number"
              value={colorH || ""}
              min={0}
              max={360}
              placeholder={0}
              onChange={this.onChangeHSV("colorH")}
            />
          </label>
          <ColorSlider
            steps={60}
            value={(colorH || 0) / 360}
            onChange={(value) =>
              this.onChangeHSV("colorH")(Math.round(value * 360))
            }
            colorAtValue={(value) => {
              const rgb = HSVtoRGB(value, 1, 1);
              return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
            }}
            handleColor={`hsl(${colorH}, 100%, 50%)`}
          />
        </FormField>

        <FormField thirdWidth>
          <label htmlFor="colorSaturation">
            {l10n("FIELD_SATURATION")}
            <small> (0-100)</small>
            <input
              id="colorSaturation"
              type="number"
              value={colorS || ""}
              min={0}
              max={360}
              placeholder={0}
              onChange={this.onChangeHSV("colorS")}
            />
          </label>
          <ColorSlider
            value={(colorS || 0) / 100}
            onChange={(value) =>
              this.onChangeHSV("colorS")(Math.round(value * 100))
            }
            colorAtValue={(value) => {
              const rgb = HSVtoRGB(colorH / 360, value, colorV / 100);
              let r = Math.round(rgb.r / 8);
              let g = Math.round(rgb.g / 8);
              let b = Math.round(rgb.b / 8);
              if (r > 31) r = 31;
              if (g > 31) g = 31;
              if (b > 31) b = 31;
              return `#${rgbToGBCHex(r, g, b)}`;
            }}
            handleColor={`#${selectedHex}`}
          />
        </FormField>

        <FormField thirdWidth>
          <label htmlFor="colorBrightness">
            {l10n("FIELD_BRIGHTNESS")}
            <small> (0-100)</small>
            <input
              id="colorBrightness"
              type="number"
              value={colorV || ""}
              min={0}
              max={360}
              placeholder={0}
              onChange={this.onChangeHSV("colorV")}
            />
          </label>
          <ColorSlider
            value={(colorV || 0) / 100}
            onChange={(value) =>
              this.onChangeHSV("colorV")(Math.round(value * 100))
            }
            colorAtValue={(value) => {
              const rgb = HSVtoRGB(colorH / 360, colorS / 100, value);
              let r = Math.round(rgb.r / 8);
              let g = Math.round(rgb.g / 8);
              let b = Math.round(rgb.b / 8);
              if (r > 31) r = 31;
              if (g > 31) g = 31;
              if (b > 31) b = 31;
              return `#${rgbToGBCHex(r, g, b)}`;
            }}
            handleColor={`#${selectedHex}`}
          />
        </FormField>

        <FormField>
          <label htmlFor="colorHex">
            {l10n("FIELD_HEX_COLOR")}
            <small> ({l10n("FIELD_CLOSEST_MATCH")})</small>

            <input
              id="colorHex"
              className="Input--Large"
              type="text"
              maxLength="7"
              placeholder="#000000"
              value={currentCustomHex}
              onChange={this.onHexChange}
            />
          </label>
        </FormField>

        <div style={{ marginTop: 30 }}>
          {palette.defaultColors ? (
            <Button onClick={this.onReset}>
              {l10n("FIELD_RESET_PALETTE")}
            </Button>
          ) : (
            <Button onClick={this.onRemove}>
              {l10n("FIELD_REMOVE_PALETTE")}
            </Button>
          )}
        </div>
      </div>
    );
  }
}

CustomPalettePicker.propTypes = {
  paletteId: PropTypes.string.isRequired,
};

CustomPalettePicker.defaultProps = {
  palette: {
    id: "",
    colors: [],
  },
};

function mapStateToProps(state, props) {
  const { paletteId } = props;
  const palette = paletteSelectors.selectById(state, paletteId);
  return {
    palette,
  };
}

const mapDispatchToProps = {
  editPalette: entitiesActions.editPalette,
  removePalette: entitiesActions.removePalette,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomPalettePicker);
