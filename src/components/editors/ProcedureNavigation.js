import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { ProcedureShape } from "../../reducers/stateShape";
import * as actions from "../../actions";
import { getProcedures } from "../../reducers/entitiesReducer";

class ProcedureNavigation extends Component {
  render() {
    const { procedures, selectProcedure } = this.props;

    return (
      procedures.length > 0 && (
        <ul>
          {procedures.map(
            (procedure, index) =>
              procedure && (
                <li
                  key={procedure.id}
                  onClick={() => {
                    selectProcedure(procedure.id);
                  }}
                >
                  {procedure.name || `Custom Event ${index + 1}`}
                </li>
              )
          )}
        </ul>
      )
    );
  }
}

ProcedureNavigation.propTypes = {
  procedures: PropTypes.arrayOf(ProcedureShape).isRequired,
  selectProcedure: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const procedures = getProcedures(state);
  return { procedures };
}

const mapDispatchToProps = {
  selectProcedure: actions.selectProcedure
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProcedureNavigation);
