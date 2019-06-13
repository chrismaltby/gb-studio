import React, { Component } from "react";
import PropTypes from "prop-types";
import Select, { components } from "react-select";
import { connect } from "react-redux";
import { SceneShape, BackgroundShape } from "../../reducers/stateShape";
import { indexBy } from "../../lib/helpers/array";
import { assetFilename } from "../../lib/helpers/gbstudio";

const indexById = indexBy("id");

const DropdownIndicator = ({
  scenesById,
  backgroundsById,
  projectRoot,
  value
}) => props => {
  return (
    <components.DropdownIndicator {...props}>
      {value &&
        scenesById[value] &&
        backgroundsById[scenesById[value].backgroundId] && (
          <div
            className="Thumbnail"
            style={{
              backgroundImage: `url("${assetFilename(
                projectRoot,
                "backgrounds",
                backgroundsById[scenesById[value].backgroundId]
              )}?_v=${backgroundsById[scenesById[value].backgroundId]._v}")`
            }}
          />
        )}
    </components.DropdownIndicator>
  );
};

const Option = ({ scenesById, backgroundsById, projectRoot }) => props => {
  // eslint-disable-next-line react/prop-types
  const { value, label } = props;
  return (
    <components.Option {...props}>
      <div style={{ display: "flex" }}>
        <div style={{ flexGrow: 1 }}>{label}</div>
        {scenesById[value] && backgroundsById[scenesById[value].backgroundId] && (
          <div
            className="Thumbnail"
            style={{
              backgroundImage: `url("${assetFilename(
                projectRoot,
                "backgrounds",
                backgroundsById[scenesById[value].backgroundId]
              )}?_v=${backgroundsById[scenesById[value].backgroundId]._v}")`
            }}
          />
        )}
      </div>
    </components.Option>
  );
};

class SceneSelect extends Component {
  render() {
    const {
      allowNone,
      scenes,
      id,
      value,
      onChange,
      backgrounds,
      projectRoot
    } = this.props;
    const current = scenes.find(m => m.id === value);
    const backgroundsById = indexById(backgrounds);
    const scenesById = indexById(scenes);

    const options = [].concat(
      allowNone
        ? {
            value: "",
            label: "None"
          }
        : [],
      scenes.map((scene, index) => {
        return {
          value: scene.id,
          label: scene.name || `Scene ${index + 1}`
        };
      })
    );

    const MyDropdownIndicator = DropdownIndicator({
      backgroundsById,
      scenesById,
      projectRoot,
      value
    });
    const MyOption = Option({ backgroundsById, scenesById, projectRoot });

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

SceneSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  allowNone: PropTypes.bool,
  scenes: PropTypes.arrayOf(SceneShape).isRequired,
  backgrounds: PropTypes.arrayOf(BackgroundShape).isRequired,
  projectRoot: PropTypes.string.isRequired
};

SceneSelect.defaultProps = {
  id: undefined,
  value: "",
  allowNone: false
};

function mapStateToProps(state) {
  const backgrounds = state.project.present.backgrounds || [];
  const scenes = (state.project.present && state.project.present.scenes) || [];
  return {
    backgrounds,
    scenes,
    projectRoot: state.document && state.document.root
  };
}

export default connect(mapStateToProps)(SceneSelect);
