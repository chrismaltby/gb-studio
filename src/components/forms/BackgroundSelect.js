import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { BackgroundShape } from "../../reducers/stateShape";

class BackgroundSelect extends Component {
  render() {
    const { backgrounds, id, value, onChange } = this.props;
    const current = backgrounds.find(b => b.id === value);
    return (
      <select id={id} value={value} onChange={onChange}>
        {!current && <option value="" />}
        {backgrounds.map(background => (
          <option key={background.id} value={background.id}>
            {background.name}
          </option>
        ))}
      </select>
    );
  }
}

BackgroundSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  backgrounds: PropTypes.arrayOf(BackgroundShape).isRequired
};

BackgroundSelect.defaultProps = {
  id: undefined,
  value: ""
};

function mapStateToProps(state) {
  return {
    backgrounds:
      (state.project.present && state.project.present.backgrounds) || []
  };
}

export default connect(mapStateToProps)(BackgroundSelect);
