import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { SceneShape } from "../../reducers/stateShape";

class SceneSelect extends Component {
  render() {
    const { allowNone, scenes, id, value, onChange } = this.props;
    const current = scenes.find(m => m.id === value);
    return (
      <select id={id} value={value} onChange={onChange}>
        {!current && !allowNone && <option value="" />}
        {allowNone && <option>None</option>}
        {scenes.map((scene, index) => (
          <option key={scene.id} value={scene.id}>
            {scene.name || `Scene ${index + 1}`}
          </option>
        ))}
      </select>
    );
  }
}

SceneSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  allowNone: PropTypes.bool,
  scenes: PropTypes.arrayOf(SceneShape).isRequired
};

SceneSelect.defaultProps = {
  id: undefined,
  value: "",
  allowNone: false
};

function mapStateToProps(state) {
  return {
    scenes: (state.project.present && state.project.present.scenes) || []
  };
}

export default connect(mapStateToProps)(SceneSelect);
