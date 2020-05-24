import React, { Component } from "react";
import PropTypes from "prop-types";
import Select, { components } from "react-select";
import { connect } from "react-redux";
import { assetFilename } from "../../lib/helpers/gbstudio";
import {
  getScenesLookup,
  getBackgroundsLookup,
  getSceneIds,
} from "../../reducers/entitiesReducer";

const DropdownIndicator = ({ filename, ...props }) => {
  return (
    <components.DropdownIndicator {...props}>
      {filename && (
        <div
          className="Thumbnail"
          style={{
            backgroundImage: `url("file://${filename}")`,
          }}
        />
      )}
    </components.DropdownIndicator>
  );
};

DropdownIndicator.propTypes = {
  filename: PropTypes.string.isRequired,
};

const DropdownIndicatorWithData = (value) =>
  connect((state) => {
    const projectRoot = state.document && state.document.root;
    const scenesLookup = getScenesLookup(state);
    const backgroundsLookup = getBackgroundsLookup(state);
    const filename =
      scenesLookup[value] &&
      backgroundsLookup[scenesLookup[value].backgroundId] &&
      `${assetFilename(
        projectRoot,
        "backgrounds",
        backgroundsLookup[scenesLookup[value].backgroundId]
      )}?_v=${backgroundsLookup[scenesLookup[value].backgroundId]._v}`;
    return {
      filename,
    };
  })(DropdownIndicator);

const Option = ({ label, value, filename, ...props }) => {
  console.log("RENDER Option ")

  return (
    <components.Option {...props}>
      <div style={{ display: "flex" }}>
        <div style={{ flexGrow: 1 }}>{label}</div>
        {filename && (
          <div
            className="Thumbnail"
            style={{
              backgroundImage: `url("file://${filename}")`,
            }}
          />
        )}
      </div>
    </components.Option>
  );
};

Option.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  filename: PropTypes.string.isRequired
};

const OptionWithData = connect((state, ownProps) => {
  const projectRoot = state.document && state.document.root;
  const scenesLookup = getScenesLookup(state);
  const backgroundsLookup = getBackgroundsLookup(state);
  const { value, label: sceneIndex } = ownProps;
  const scene = scenesLookup[value];
  const label = scene.name || `Scene ${sceneIndex + 1}`;
  const filename =
    scenesLookup[value] &&
    backgroundsLookup[scenesLookup[value].backgroundId] &&
    `${assetFilename(
      projectRoot,
      "backgrounds",
      backgroundsLookup[scenesLookup[value].backgroundId]
    )}?_v=${backgroundsLookup[scenesLookup[value].backgroundId]._v}`;
  return {
    label,
    filename,
  };
})(Option);

class SceneSelect extends Component {
  render() {
    const { sceneIds, id, label, value, onChange } = this.props;

    const options = sceneIds.map((sceneId, sceneIndex) => ({
      value: sceneId,
      label: sceneIndex,
    }));

    return (
      <Select
        id={id}
        className="ReactSelectContainer"
        classNamePrefix="ReactSelect"
        options={options}
        value={{ label }}
        onChange={(data) => {
          onChange(data.value);
        }}
        components={{
          DropdownIndicator: DropdownIndicatorWithData(value),
          Option: OptionWithData,
        }}
      />
    );
  }
}

SceneSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  sceneIds: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
};

SceneSelect.defaultProps = {
  id: undefined,
  value: "",
};

function mapStateToProps(state, ownProps) {
  const scenesLookup = getScenesLookup(state);
  const sceneIds = getSceneIds(state);
  const sceneIndex = sceneIds.indexOf(ownProps.value);
  const scene = scenesLookup[ownProps.value];
  const label = scene ? scene.name || `Scene ${sceneIndex + 1}` : "";

  return {
    sceneIds,
    label,
  };
}

export default connect(mapStateToProps)(SceneSelect);
