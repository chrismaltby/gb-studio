import React, { Component } from "react";
import { connect } from "react-redux";
import Alert, { AlertItem } from "../library/Alert";
import warningsActions from "store/features/warnings/warningsActions";
import { backgroundSelectors } from "store/features/entities/entitiesState";

class BackgroundWarnings extends Component {
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

// BackgroundWarnings.propTypes = {
//   id: PropTypes.string.isRequired,
//   warnings: PropTypes.arrayOf(PropTypes.string).isRequired,
//   modifiedTimestamp: PropTypes.number,
//   checkBackgroundWarnings: PropTypes.func.isRequired,
// };

BackgroundWarnings.defaultProps = {
  modifiedTimestamp: 0,
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
    modifiedTimestamp,
  };
}

const mapDispatchToProps = {
  checkBackgroundWarnings: warningsActions.checkBackgroundWarnings,
};

export default connect(mapStateToProps, mapDispatchToProps)(BackgroundWarnings);
