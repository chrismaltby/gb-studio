import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { ProcedureShape } from "../../reducers/stateShape";
import { SidebarHeading } from "./Sidebar";
import * as actions from "../../actions";
import l10n from "../../lib/helpers/l10n";

class ProcedureNavigation extends Component {
  render() {
    const { procedures, selectProcedure } = this.props;

    const proceduresArr = Object.values(procedures);

    return (
      (proceduresArr.length > 0) && (
        <div>
          <SidebarHeading title={l10n("SIDEBAR_CUSTOM_EVENTS")} />
          <ul>
            {proceduresArr.map((procedure, index) => (
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
            ))}
          </ul>
        </div>
      )
    );
  }
}

ProcedureNavigation.propTypes = {
  procedures: PropTypes.objectOf(ProcedureShape).isRequired,
  selectProcedure: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const procedures = state.entities.present.entities.procedures;
  return { procedures };
}

const mapDispatchToProps = {
  selectProcedure: actions.selectProcedure,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProcedureNavigation);
