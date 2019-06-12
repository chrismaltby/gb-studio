import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select, { components } from "react-select";
import SpriteSheetCanvas from "../world/SpriteSheetCanvas";
import l10n from "../../lib/helpers/l10n";
import { SpriteShape } from "../../reducers/stateShape";
import { groupBy } from "../../lib/helpers/array";

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

const DropdownIndicator = (value, direction, frame) => props => {
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

const Option = (direction, frame) => props => {
  // eslint-disable-next-line react/prop-types
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

  render() {
    const { spriteSheets, id, value, onChange, direction, frame } = this.props;

    const current = spriteSheets.find(s => s.id === value);
    const groupedSpriteSheets = groupByPlugin(spriteSheets);

    const options = Object.keys(groupedSpriteSheets).reduce((memo, plugin) => {
      buildOptions(memo, plugin, groupedSpriteSheets[plugin]);
      return memo;
    }, []);

    const MyDropdownIndicator = DropdownIndicator(value, direction, frame);
    const MyOption = Option(direction, frame);

    return (
      <Select
        id={id}
        className="ReactSelectContainer"
        classNamePrefix="ReactSelect"
        options={options}
        value={{ label: current ? current.name : "", value }}
        onChange={data => {
          onChange(data.value);
        }}
        components={{
          DropdownIndicator: MyDropdownIndicator,
          Option: MyOption
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
  const spriteSheets = state.project.present.spriteSheets || [];
  return {
    spriteSheets
  };
}

export default connect(mapStateToProps)(SpriteSheetSelect);
