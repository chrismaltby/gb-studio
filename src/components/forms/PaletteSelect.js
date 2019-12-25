import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select, { components } from "react-select";
import { PaletteShape } from "../../reducers/stateShape";
import { getPalettes } from "../../reducers/entitiesReducer";

export const DMG_PALETTE = {
    id: "dmg",
    name: "DMG (GB Default)",
    colors: [ "E8F8E0", "B0F088", "509878", "202850" ]
};

const PaletteColors = ({ colors }) => (
  <div
    className="PaletteSelect__Preview"
    style={{ 
      backgroundImage: `
        linear-gradient(
          90deg, 
          #${colors[0]} 0%,
          #${colors[0]} 24.9%,
          #${colors[1]} 25.1%,
          #${colors[1]} 50%,
          #${colors[2]} 50%,
          #${colors[2]} 75%,
          #${colors[3]} 75%,
          #${colors[3]} 100%
        )`
    }} 
  />);

PaletteColors.propTypes = {
  colors: PropTypes.arrayOf(PropTypes.string).isRequired,
};

class PaletteSelect extends Component {
  shouldComponentUpdate(nextProps) {
    const { value, direction, frame, palettes } = this.props;
    return (
      nextProps.value !== value ||
      nextProps.direction !== direction ||
      nextProps.frame !== frame ||
      palettes !== nextProps.palettes
    );
  }

  renderDropdownIndicator = props => {
    const { palettes, value, optionalDefaultPaletteId } = this.props;
    const currentValue = value === "" ? optionalDefaultPaletteId : value;
    const current = palettes.find((p) => p.id === currentValue) || DMG_PALETTE;
    return (
      <components.DropdownIndicator {...props}>
        <PaletteColors colors={current.colors} />
      </components.DropdownIndicator>
    );
  };

  renderOption = props => {
    const { palettes, optionalDefaultPaletteId } = this.props;
    const { value, label } = props;
    const currentValue = value === "" ? optionalDefaultPaletteId : value;
    const current = palettes.find((p) => p.id === currentValue) || DMG_PALETTE;
    return (
      <components.Option {...props}>
        <div style={{ display: "flex" }}>
          <div style={{ flexGrow: 1 }}>{label}</div>
          <PaletteColors colors={current.colors} />
        </div>
      </components.Option>
    );
  };

  render() {
    const { palettes, id, value, onChange, optional, optionalLabel } = this.props;
    
    const optionalPalette = {
      id: "",
      name: optionalLabel
    };
    
    const current = value === "" ? optionalPalette : palettes.find((p) => p.id === value) || DMG_PALETTE;
    const currentIndex = value === "" && optional ? 0 : palettes.indexOf(current);
    let options = [];
    
    if (optional) {
      options = options.concat({
        value: "",
        label: optionalLabel
      });
    };
    
    options = options.concat(
      {
        value: DMG_PALETTE.id,
        label: DMG_PALETTE.name
      },
      palettes.map((p, index) => {
        return {
          value: p.id,
          label: p.name || `Palette ${index + 1}`
        };
      })
    );

    return (
      <Select
        id={id}
        className="ReactSelectContainer"
        classNamePrefix="ReactSelect"
        options={options}
        value={{ 
          label: current ? current.name || `Palette ${currentIndex + 1}` : "None", 
          value 
        }}
        onChange={data => {
          onChange(data.value);
        }}
        components={{
          DropdownIndicator: this.renderDropdownIndicator,
          Option: this.renderOption
        }}
      />
    );
  }
}

PaletteSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  palettes: PropTypes.arrayOf(PaletteShape).isRequired,
  direction: PropTypes.string,
  frame: PropTypes.number,
  optional: PropTypes.bool,
  optionalDefaultPaletteId: PropTypes.string,
  optionalLabel: PropTypes.string
};

PaletteSelect.defaultProps = {
  id: undefined,
  value: "",
  frame: null,
  direction: null,
  optional: false,
  optionalDefaultPaletteId: "dmg",
  optionalLabel: "None"
};

function mapStateToProps(state) {
  const palettes = getPalettes(state)
  return {
    palettes
  };
}

export default connect(mapStateToProps)(PaletteSelect);

export { PaletteColors };