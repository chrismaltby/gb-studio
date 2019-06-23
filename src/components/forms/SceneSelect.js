import React, { Component } from "react";
import PropTypes from "prop-types";
import Select, { components } from "react-select";
import { connect } from "react-redux";
import { SceneShape, BackgroundShape } from "../../reducers/stateShape";
import { assetFilename } from "../../lib/helpers/gbstudio";

const DropdownIndicator = ({
  scenesLookup,
  backgroundsLookup,
  projectRoot,
  value
}) => props => {
  return (
    <components.DropdownIndicator {...props}>
      {value &&
        scenesLookup[value] &&
        backgroundsLookup[scenesLookup[value].backgroundId] && (
          <div
            className="Thumbnail"
            style={{
              backgroundImage: `url("${assetFilename(
                projectRoot,
                "backgrounds",
                backgroundsLookup[scenesLookup[value].backgroundId]
              )}?_v=${backgroundsLookup[scenesLookup[value].backgroundId]._v}")`
            }}
          />
        )}
    </components.DropdownIndicator>
  );
};

const Option = ({ scenesLookup, backgroundsLookup, projectRoot }) => props => {
  // eslint-disable-next-line react/prop-types
  const { value, label } = props;
  return (
    <components.Option {...props}>
      <div style={{ display: "flex" }}>
        <div style={{ flexGrow: 1 }}>{label}</div>
        {scenesLookup[value] &&
          backgroundsLookup[scenesLookup[value].backgroundId] && (
            <div
              className="Thumbnail"
              style={{
                backgroundImage: `url("${assetFilename(
                  projectRoot,
                  "backgrounds",
                  backgroundsLookup[scenesLookup[value].backgroundId]
                )}?_v=${
                  backgroundsLookup[scenesLookup[value].backgroundId]._v
                }")`
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
      backgroundsLookup,
      scenesLookup,
      projectRoot
    } = this.props;
    const current = scenes.find(m => m.id === value);

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
      backgroundsLookup,
      scenesLookup,
      projectRoot,
      value
    });
    const MyOption = Option({ backgroundsLookup, scenesLookup, projectRoot });

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
  scenesLookup: PropTypes.objectOf(SceneShape).isRequired,
  backgroundsLookup: PropTypes.objectOf(BackgroundShape).isRequired,
  projectRoot: PropTypes.string.isRequired
};

SceneSelect.defaultProps = {
  id: undefined,
  value: "",
  allowNone: false
};

function mapStateToProps(state) {
  const scenes = state.entities.present.result.scenes.map(sceneId => {
    return state.entities.present.entities.scenes[sceneId];
  });
  const backgroundsLookup = state.entities.present.entities.backgrounds;
  const scenesLookup = state.entities.present.entities.scenes;

  return {
    backgroundsLookup,
    scenesLookup,
    scenes,
    projectRoot: state.document && state.document.root
  };
}

export default connect(mapStateToProps)(SceneSelect);
