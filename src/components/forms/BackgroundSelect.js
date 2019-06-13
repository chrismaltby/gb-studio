import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select, { components } from "react-select";
import { BackgroundShape } from "../../reducers/stateShape";
import { groupBy, indexBy } from "../../lib/helpers/array";
import { assetFilename } from "../../lib/helpers/gbstudio";

const groupByPlugin = groupBy("plugin");
const indexById = indexBy("id");

const DropdownIndicator = ({
  backgroundsById,
  projectRoot,
  value
}) => props => {
  return (
    <components.DropdownIndicator {...props}>
      {value && backgroundsById[value] && (
        <div
          className="Thumbnail"
          style={{
            backgroundImage: `url("${assetFilename(
              projectRoot,
              "backgrounds",
              backgroundsById[value]
            )}?_v=${backgroundsById[value]._v}")`
          }}
        />
      )}
    </components.DropdownIndicator>
  );
};

const Option = ({ backgroundsById, projectRoot }) => props => {
  // eslint-disable-next-line react/prop-types
  const { value, label } = props;
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
              backgroundsById[value]
            )}?_v=${backgroundsById[value]._v}")`
          }}
        />
      </div>
    </components.Option>
  );
};

class BackgroundSelect extends Component {
  render() {
    const { backgrounds, id, value, onChange, projectRoot } = this.props;
    const current = backgrounds.find(b => b.id === value);
    const groupedBackgrounds = groupByPlugin(backgrounds);
    const backgroundsById = indexById(backgrounds);

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

    const MyDropdownIndicator = DropdownIndicator({
      backgroundsById,
      projectRoot,
      value
    });
    const MyOption = Option({ backgroundsById, projectRoot });

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

BackgroundSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  backgrounds: PropTypes.arrayOf(BackgroundShape).isRequired,
  projectRoot: PropTypes.string.isRequired
};

BackgroundSelect.defaultProps = {
  id: undefined,
  value: ""
};

function mapStateToProps(state) {
  const backgrounds = state.project.present.backgrounds || [];
  return {
    backgrounds,
    projectRoot: state.document && state.document.root
  };
}

export default connect(mapStateToProps)(BackgroundSelect);
