import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select, { components } from "react-select";
import { PaletteShape } from "../../store/stateShape";
import PaletteBlock from "../library/PaletteBlock.tsx";
import { paletteSelectors } from "../../store/features/entities/entitiesState";

export const DMG_PALETTE = {
    id: "dmg",
    name: "DMG (GB Default)",
    colors: [ "E8F8E0", "B0F088", "509878", "202850" ]
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
    const current = currentValue === DMG_PALETTE.id
      ? DMG_PALETTE
      : palettes.find((p) => p.id === currentValue)
      || palettes.find((p) => p.id === optionalDefaultPaletteId)
      || null;

    return (
      <components.DropdownIndicator {...props}>
        {current && value !== "keep" ? (
          <PaletteBlock colors={current.colors} size={16} />
        ) : (
          <div style={{width: 16, height: 16}} />
        )}
      </components.DropdownIndicator>
    );
  };

  renderOption = props => {
    const { palettes, optionalDefaultPaletteId } = this.props;
    const { value, label } = props;
    const currentValue = value === "" ? optionalDefaultPaletteId : value;
    const current = currentValue === DMG_PALETTE.id
      ? DMG_PALETTE
      : palettes.find((p) => p.id === currentValue)
      || palettes.find((p) => p.id === optionalDefaultPaletteId)
      || null;
    return (
      <components.Option {...props}>
        <div style={{ display: "flex" }}>
          <div style={{ flexGrow: 1 }}>{label}</div>
          {current && value !== "keep" ? (
            <PaletteBlock colors={current.colors} size={16} />
          ) : (
            <div style={{width: 16, height: 16}} />
          )}
        </div>
      </components.Option>
    );
  };


  render() {
    const { palettes, id, value, onChange, optional, optionalLabel, canKeep, keepLabel, prefix } = this.props;
    
    const optionalPalette = {
      id: "",
      name: optionalLabel
    };
    
    let current;
    if (value === "") {
      current = optionalPalette;
    } else if (value === "keep") {
      current = null;
    } else {
      current = palettes.find((p) => p.id === value) || DMG_PALETTE;
    }

    const currentIndex = value === "" && optional ? 0 : palettes.indexOf(current);

    let options = [];
    
    if (optional) {
      options = options.concat({
        value: "",
        label: optionalLabel
      });
    };

    if (canKeep) {
      options = options.concat({
        value: "keep",
        label: keepLabel
      })
    }
    
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

    let label;
    if (current) {
      label = current.name || `Palette ${currentIndex + 1}`;
    } else if (value === "keep") {
      label = keepLabel;
    } else {
      label = "None";
    }

    return (
      <Select
        id={id}
        className="ReactSelectContainer"
        classNamePrefix="ReactSelect"
        options={options}
        value={{ 
          label: prefix + label, 
          value 
        }}
        onChange={data => {
          onChange(data.value);
        }}
        components={{
          DropdownIndicator: this.renderDropdownIndicator,
          Option: this.renderOption
        }}
        menuPlacement="auto"
        blurInputOnSelect
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
  optionalLabel: PropTypes.string,
  canKeep: PropTypes.bool,
  keepLabel: PropTypes.string,
  prefix: PropTypes.string
};

PaletteSelect.defaultProps = {
  id: undefined,
  value: "",
  frame: null,
  direction: null,
  optional: false,
  optionalDefaultPaletteId: "dmg",
  optionalLabel: "None",
  canKeep: false,
  keepLabel: "Keep",
  prefix: "",
};

function mapStateToProps(state) {
  const palettes = paletteSelectors.selectAll(state);
  return {
    palettes
  };
}

export default connect(mapStateToProps)(PaletteSelect);
