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
import { createCacheFunction } from "../../lib/helpers/cache";
import { sceneSelectors, backgroundSelectors } from "../../store/features/entities/entitiesSlice";

const menuPortalEl = document.getElementById("MenuPortal");

const cachedObj = createCacheFunction();

const filterOption = ({ label }, string) => {
  return label.toUpperCase().indexOf(string.toUpperCase()) > -1;
};

const DropdownIndicator = ({ selectProps, ...props }) => {
  const filename = selectProps.value.filename;
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
  selectProps: PropTypes.shape({
    value: PropTypes.shape({
      filename: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

const Option = ({ label, value, data: { filename }, ...props }) => {
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
  data: PropTypes.shape({
    filename: PropTypes.string.isRequired,
  }).isRequired,
};

class SceneSelect extends Component {
  render() {
    const {
      options,
      selectedIndex,
      id,
      onChange,
    } = this.props;
    const selectedOption = options[selectedIndex] || {};
    return (
      <Select
        id={id}
        className="ReactSelectContainer"
        classNamePrefix="ReactSelect"
        options={options}
        value={selectedOption}
        onChange={(data) => {
          onChange(data.value);
        }}
        filterOption={filterOption}
        components={{
          DropdownIndicator,
          Option,
        }}
        menuPlacement="auto"
        menuPortalTarget={menuPortalEl}
        blurInputOnSelect
      />
    );
  }
}

const OptionShape = PropTypes.shape({
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  filename: PropTypes.string.isRequired,
});

SceneSelect.propTypes = {
  id: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(OptionShape.isRequired).isRequired,
  selectedIndex: PropTypes.number.isRequired,
};

SceneSelect.defaultProps = {
  id: undefined,
};

function mapStateToProps(state, ownProps) {
  const projectRoot = state.document && state.document.root;
  const scenesLookup = sceneSelectors.selectEntities(state.project.present.entities);
  const backgroundsLookup = backgroundSelectors.selectEntities(state.project.present.entities);
  const sceneIds = sceneSelectors.selectIds(state.project.present.entities);
  const selectedIndex = sceneIds.indexOf(ownProps.value);
  const options = cachedObj(
    sceneIds.map((sceneId, sceneIndex) => {
      const scene = scenesLookup[sceneId];
      const filename =
        scene &&
        backgroundsLookup[scene.backgroundId] &&
        `${assetFilename(
          projectRoot,
          "backgrounds",
          backgroundsLookup[scene.backgroundId]
        )}?_v=${backgroundsLookup[scene.backgroundId]._v}`;

      return {
        value: sceneId,
        label: scenesLookup[sceneId].name || `Scene ${sceneIndex + 1}`,
        filename,
      };
    })
  );
  return {
    options,
    selectedIndex,
  };
}

export default connect(mapStateToProps)(SceneSelect);
