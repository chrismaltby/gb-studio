import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import ScriptEditor from "../script/ScriptEditor";
import * as actions from "../../actions";
import { FormField } from "../library/Forms";
import l10n from "../../lib/helpers/l10n";
import Sidebar, { SidebarColumn, SidebarHeading } from "./Sidebar";
import castEventValue from "../../lib/helpers/castEventValue";
import { ProcedureShape } from "../../reducers/stateShape";
import { DropdownButton } from "../library/Button";
import { MenuItem } from "../library/Menu";

class ProcedureEditor extends Component {
  constructor() {
    super();
    this.state = {
    };
  }

  onEditVariableName = key => e => {
    const { editProcedure, procedure } = this.props;
    editProcedure(procedure.id, {
      variables: {
        ...procedure.variables,
        [key]: {
          ...procedure.variables[key],
          name: castEventValue(e)
        }
      }
    });
  };

  onEditActorName = key => e => {
    const { editProcedure, procedure } = this.props;
    editProcedure(procedure.id, {
      actors: {
        ...procedure.actors,
        [key]: {
          ...procedure.actors[key],
          name: castEventValue(e)
        }
      }
    });
  };

  onEdit = key => e => {
    const { editProcedure, procedure } = this.props;
    editProcedure(procedure.id, {
      [key]: castEventValue(e)
    });
  };

  onRemove = key => e => {
    const { removeProcedure, procedure } = this.props;
    removeProcedure(procedure.id);
  }
    
  render() {
    const { procedure, selectSidebar } = this.props;

    return (
      <Sidebar onMouseDown={selectSidebar}>
        <SidebarColumn>
          <div>
            <SidebarHeading
              title="Procedure"
              buttons={
                <DropdownButton
                  small
                  transparent
                  right
                  onMouseDown={this.readClipboard}
                >
                  <MenuItem onClick={this.onRemove()}>
                    {l10n("MENU_DELETE_SCRIPT")}
                  </MenuItem>
                </DropdownButton>
              }
            />
            <FormField>
              <label htmlFor="projectName">
                {l10n("FIELD_NAME")}
                <input
                  id="projectName"
                  value={procedure.name || ""}
                  placeholder="Procedure Name"
                  onChange={this.onEdit("name")}
                />
              </label>
            </FormField>
          </div>
          <div>
            <SidebarHeading
              title="Parameters"
            />
            <FormField>
              <label>
                {`Variables: ${Object.values(procedure.variables).length}/10`}
              </label>
            </FormField>
            {Object.values(procedure.variables)
              .map((variable, i) => {
                return (
                  <FormField>
                    <input
                      id={`variable[${i}]`}
                      key={variable.id}
                      value={variable.name}
                      placeholder="Variable Name"
                      onChange={this.onEditVariableName(variable.id)}
                    /> 
                  </FormField>     
                );
              }
            )}
            <FormField>
              <label>
                {`Actors: ${Object.values(procedure.actors).length}/10`}
              </label>
            </FormField>
            {Object.values(procedure.actors)
              .map((actor, i) => {
                return (
                  <FormField>
                    <input
                      id={`actor[${i}]`}
                      key={actor.id}
                      value={actor.name}
                      placeholder="Actor Name"
                      onChange={this.onEditActorName(actor.id)}
                    />    
                  </FormField>
                );
              }
            )}
          </div>
        </SidebarColumn>
        <SidebarColumn>
          <ScriptEditor
            value={procedure.script}
            title="Procedure Script"
            type="procedure"
            onChange={this.onEdit("script")}
          />
        </SidebarColumn>
      </Sidebar>
    );
  };
}

ProcedureEditor.propTypes = {
  procedure: ProcedureShape,
  editProcedure: PropTypes.func.isRequired,
  removeProcedure: PropTypes.func.isRequired,
  selectSidebar: PropTypes.func.isRequired,
};

ProcedureEditor.defaultProps = {
  procedure: null
}

function mapStateToProps(state, props) {
  const procedures = state.entities.present.entities.procedures;
  const procedure = procedures[props.id];
  return {
    procedure
  };
}

const mapDispatchToProps = {
  editProcedure: actions.editProcedure,
  removeProcedure: actions.removeProcedure,
  selectSidebar: actions.selectSidebar
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProcedureEditor);
  