import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select, { components } from "react-select";
import SpriteSheetCanvas from "../world/SpriteSheetCanvas";
import l10n from "../../lib/helpers/l10n";
import { SpriteShape } from "../../reducers/stateShape";
import { groupBy } from "../../lib/helpers/array";
import { getSpriteSheets } from "../../reducers/entitiesReducer";

const groupByPlugin = groupBy("plugin");

const type = t => s => s.type === t;

const buildOptions = (memo, plugin, spriteSheets) => {
  memo.push({
    label:
      l10n("FIELD_SPRITE_ANIMATED_ACTORS") + (plugin ? ` - ${plugin}` : ""),
    options: spriteSheets.filter(type("actor_animated")).map(spriteSheet => {
      return {
        value: spriteSheet.id,
        label: spriteSheet.name
      };
    })
  });
  memo.push({
    label: l10n("FIELD_SPRITE_ACTORS") + (plugin ? ` - ${plugin}` : ""),
    options: spriteSheets.filter(type("actor")).map(spriteSheet => {
      return {
        value: spriteSheet.id,
        label: spriteSheet.name
      };
    })
  });
  memo.push({
    label: l10n("FIELD_SPRITES") + (plugin ? ` - ${plugin}` : ""),
    options: spriteSheets
      .filter(s => s.type !== "actor_animated" && s.type !== "actor")
      .map(spriteSheet => {
        return {
          value: spriteSheet.id,
          label:
            spriteSheet.name +
            (spriteSheet.numFrames > 1
              ? ` (${spriteSheet.numFrames} ${l10n("FIELD_SPRITE_FRAMES")})`
              : ``)
        };
      })
  });
};

class SpriteSheetSelect extends Component {
  shouldComponentUpdate(nextProps) {
    const { value, direction, frame, spriteSheets } = this.props;
    return (
      nextProps.value !== value ||
      nextProps.direction !== direction ||
      nextProps.frame !== frame ||
      spriteSheets !== nextProps.spriteSheets
    );
  }

  renderDropdownIndicator = props => {
    const { value, direction, frame } = this.props;
    return (
      <components.DropdownIndicator {...props}>
        <SpriteSheetCanvas
          spriteSheetId={value}
          direction={direction}
          frame={frame}
        />
      </components.DropdownIndicator>
    );
  };

  renderOption = props => {
    const { direction, frame } = this.props;
    const { label, value } = props;
    return (
      <components.Option {...props}>
        <div style={{ display: "flex" }}>
          <div style={{ flexGrow: 1 }}>{label}</div>
          <SpriteSheetCanvas
            spriteSheetId={value}
            direction={direction}
            frame={frame}
          />
        </div>
      </components.Option>
    );
  };

  render() {
    const { spriteSheets, id, value, filter, optional, onChange } = this.props;

    const current = spriteSheets.find(s => s.id === value);
    const filteredSpriteSheets = spriteSheets.filter(filter || (() => true))
    const groupedSpriteSheets = groupByPlugin(filteredSpriteSheets);

    const options = Object.keys(groupedSpriteSheets)
      .sort()
      .reduce((memo, plugin) => {
        buildOptions(memo, plugin, groupedSpriteSheets[plugin]);
        return memo;
      }, optional ? [{ value: "", label : "None" }] : []);

    return (
      <Select
        id={id}
        className="ReactSelectContainer"
        classNamePrefix="ReactSelect"
        options={options}
        value={{ label: current ? current.name : "None", value }}
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

SpriteSheetSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  spriteSheets: PropTypes.arrayOf(SpriteShape).isRequired,
  direction: PropTypes.string,
  frame: PropTypes.number
};

SpriteSheetSelect.defaultProps = {
  id: undefined,
  value: "",
  frame: null,
  direction: null
};

function mapStateToProps(state) {
  const spriteSheets = getSpriteSheets(state);
  return {
    spriteSheets
  };
}

export default connect(mapStateToProps)(SpriteSheetSelect);
