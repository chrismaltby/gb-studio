/* eslint-disable jsx-a11y/label-has-for */
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import l10n from "../../lib/helpers/l10n";
import PageHeader from "../../components/library/PageHeader";
import PageContent from "../../components/library/PageContent";
import CustomPalettePicker from "../../components/forms/CustomPalettePicker";
import {
  getPalettesLookup,
  getPalettes,
} from "../../reducers/entitiesReducer";
import { PaletteShape } from "../../reducers/stateShape";
import { FormField } from "../../components/library/Forms";
import * as actions from "../../actions";
import PaletteSidebar from "../../components/assets/PaletteSidebar";
import castEventValue from "../../lib/helpers/castEventValue";
import Button from "../../components/library/Button";

class PalettePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      query: "",
      edit: false,
    };
  }

  onSearch = (query) => {
    this.setState({
      query,
    });
  };

  onStartEdit = (e) => {
    this.setState({
      edit: true,
    });
  };

  onFinishEdit = (e) => {
    this.setState({
      edit: false,
    });    
  }

  checkForFinishEdit = (e) => {
    if(e.key === "Enter") {
      this.setState({
        edit: false,
      });        
    }
  }

  onEdit = (key) => (e) => {
    const { editPalette } = this.props;
    const palette = this.getCurrentPalette();
    editPalette(palette.id, {
      [key]: castEventValue(e),
    });
  };

  onRemove = () => {
    const { removePalette } = this.props;
    const palette = this.getCurrentPalette();
    removePalette(palette.id);
  };

  getFilteredList = () => {
    const { palettes } = this.props;
    const { query } = this.state;

    return query
      ? palettes.filter((f) => {
          return f.name.toUpperCase().indexOf(query.toUpperCase()) > -1;
        })
      : palettes;
  };

  getCurrentPalette = () => {
    const { id } = this.props;
    const palettesList = this.getFilteredList();
    return palettesList.find((f) => f.id === id) || palettesList[0];
  };

  render() {
    const { addPalette, sidebarWidth } = this.props;
    const { edit } = this.state;

    const palettesList = this.getFilteredList();
    const palette = this.getCurrentPalette();

    return (
      <div
        style={{
          position: "fixed",
          left: "0px",
          top: "38px",
          bottom: "0px",
          overflow: "auto",
          right: sidebarWidth,
        }}
      >
        <PageHeader>
          {palette ? (
            <h1>
              {edit ? (
                <input
                  maxLength="25"
                  value={palette.name}
                  onChange={this.onEdit("name")}
                  onKeyDown={this.checkForFinishEdit}
                  onBlur={this.onFinishEdit}
                  autoFocus
                />
              ) : (
                palette.name
              )}{" "}
              {!edit && (
                <Button key="edit" onClick={this.onStartEdit} small transparent>
                  {l10n("FIELD_RENAME")}
                </Button>
              )}
            </h1>
          ): <h1>No palette selected</h1>}
        </PageHeader>
        <PageContent>
          <section>
            {palette && palette.id && (
              <FormField key={palette.id}>
                <CustomPalettePicker id={palette.id} paletteId={palette.id} />
                <Button onClick={this.onRemove}>Remove Palette</Button>
              </FormField>
            )}
          </section>
        </PageContent>
        <PaletteSidebar
          palettes={palettesList}
          selectedPalette={palette}
          onSearch={this.onSearch}
          onAdd={addPalette}
        />
      </div>
    );
  }
}

PalettePage.propTypes = {
  id: PropTypes.string,
  palettes: PropTypes.arrayOf(PaletteShape).isRequired,
  sidebarWidth: PropTypes.number,
  editPalette: PropTypes.func.isRequired,
  addPalette: PropTypes.func.isRequired,
  removePalette: PropTypes.func.isRequired,
};

PalettePage.defaultProps = {
  id: "",
  sidebarWidth: 300,
};

function mapStateToProps(state) {
  const { filesSidebarWidth: sidebarWidth } = state.settings;
  const palettesLookup = getPalettesLookup(state);
  const palettes = getPalettes(state);
  const { id } = state.navigation;

  return {
    palettes,
    palettesLookup,
    sidebarWidth,
    id,
  };
}

const mapDispatchToProps = {
  editPalette: actions.editPalette,
  addPalette: actions.addPalette,
  removePalette: actions.removePalette,
};

export default connect(mapStateToProps, mapDispatchToProps)(PalettePage);
