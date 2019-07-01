import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select, { components } from "react-select";
import { BackgroundShape } from "../../reducers/stateShape";
import { groupBy } from "../../lib/helpers/array";
import { assetFilename } from "../../lib/helpers/gbstudio";
import {
  getBackgrounds,
  getBackgroundsLookup
} from "../../reducers/entitiesReducer";

const groupByPlugin = groupBy("plugin");

class BackgroundSelect extends Component {
  renderDropdownIndicator = props => {
    const { backgroundsLookup, projectRoot, value } = this.props;
    return (
      <components.DropdownIndicator {...props}>
        {value && backgroundsLookup[value] && (
          <div
            className="Thumbnail"
            style={{
              backgroundImage: `url("${assetFilename(
                projectRoot,
                "backgrounds",
                backgroundsLookup[value]
              )}?_v=${backgroundsLookup[value]._v}")`
            }}
          />
        )}
      </components.DropdownIndicator>
    );
  };

  renderOption = props => {
    const { value, label } = props;
    const { backgroundsLookup, projectRoot } = this.props;
    return (
      <components.Option {...props}>
        <div style={{ display: "flex" }}>
          <div style={{ flexGrow: 1 }}>{label}</div>
          <div
            className="Thumbnail"
            style={{
              backgroundImage: `url("${assetFilename(
                projectRoot,
                "backgrounds",
                backgroundsLookup[value]
              )}?_v=${backgroundsLookup[value]._v}")`
            }}
          />
        </div>
      </components.Option>
    );
  };

  render() {
    const { backgrounds, id, value, onChange } = this.props;
    const current = backgrounds.find(b => b.id === value);
    const groupedBackgrounds = groupByPlugin(backgrounds);

    const options = Object.keys(groupedBackgrounds)
      .sort()
      .reduce((memo, plugin) => {
        if (!plugin) {
          return [].concat(
            memo,
            groupedBackgrounds[plugin].map(background => {
              return {
                label: background.name,
                value: background.id
              };
            })
          );
        }
        memo.push({
          label: plugin,
          options: groupedBackgrounds[plugin].map(background => {
            return {
              label: background.name,
              value: background.id
            };
          })
        });
        return memo;
      }, []);

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
          DropdownIndicator: this.renderDropdownIndicator,
          Option: this.renderOption
        }}
      />
    );
  }
}

BackgroundSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  backgrounds: PropTypes.arrayOf(BackgroundShape).isRequired,
  backgroundsLookup: PropTypes.objectOf(BackgroundShape).isRequired,
  projectRoot: PropTypes.string.isRequired
};

BackgroundSelect.defaultProps = {
  id: undefined,
  value: ""
};

function mapStateToProps(state) {
  const backgrounds = getBackgrounds(state);
  const backgroundsLookup = getBackgroundsLookup(state);
  return {
    backgrounds,
    backgroundsLookup,
    projectRoot: state.document.root
  };
}

export default connect(mapStateToProps)(BackgroundSelect);
