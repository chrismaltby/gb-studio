import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Alert, { AlertItem } from "../library/Alert";
import { checkBackgroundWarnings } from "../../store/features/warnings/warningsSlice";
import { backgroundSelectors } from "../../store/features/entities/entitiesSlice";

class BackgroundWarnings extends Component {
  componentDidMount() {
    const { checkBackgroundWarnings, id } = this.props;
    checkBackgroundWarnings(id);
  }

  componentDidUpdate(prevProps) {
    const { modifiedTimestamp, checkBackgroundWarnings, id } = this.props;
    if (id !== prevProps.id || modifiedTimestamp !== prevProps.modifiedTimestamp) {
      checkBackgroundWarnings(id);
    }
  }

  render() {
    const { warnings } = this.props;

    if (warnings.length === 0) {
      return null;
    }

    return (
      <Alert variant="warning">
        {warnings.map((warning) => (
          <AlertItem key={warning}>{warning}</AlertItem>
        ))}
      </Alert>
    );
  }
}

BackgroundWarnings.propTypes = {
  id: PropTypes.string.isRequired,
  warnings: PropTypes.arrayOf(PropTypes.string).isRequired,
  modifiedTimestamp: PropTypes.number,
  checkBackgroundWarnings: PropTypes.func.isRequired,
};

BackgroundWarnings.defaultProps = {
  modifiedTimestamp: 0
};

function mapStateToProps(state, props) {
  const backgroundsLookup = backgroundSelectors.selectEntities(state);
  const backgroundWarningsLookup = state.warnings.backgrounds;
  const savedWarnings = backgroundWarningsLookup[props.id];
  const warnings = savedWarnings ? savedWarnings.warnings : [];
  const background = backgroundsLookup[props.id];
  const modifiedTimestamp = background && background._v;
  return {
    warnings,
    modifiedTimestamp
  };
}

const mapDispatchToProps = {
  checkBackgroundWarnings,
};

export default connect(mapStateToProps, mapDispatchToProps)(BackgroundWarnings);
