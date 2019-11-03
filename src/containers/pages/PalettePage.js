/* eslint-disable jsx-a11y/label-has-for */
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import l10n from "../../lib/helpers/l10n";
import PageHeader from "../../components/library/PageHeader";
import PageContent from "../../components/library/PageContent";
import CustomPalettePicker from "../../components/forms/CustomPalettePicker";
import { getPalettesLookup, getPaletteIds } from "../../reducers/entitiesReducer";
import { ProjectShape, PaletteShape } from "../../reducers/stateShape";
import { FormField } from "../../components/library/Forms";
import * as actions from "../../actions";
import PaletteSidebar from "../../components/assets/PaletteSidebar";
import castEventValue from "../../lib/helpers/castEventValue";
import Button from "../../components/library/Button";

class PalettePage extends Component {
  onEdit = key => e => {
    const { editPalette, palette } = this.props;
    editPalette(palette.id, {
      [key]: castEventValue(e)
    });
  };

  onRemove = () => {
    const { removePalette, palette } = this.props;
    removePalette(palette.id);
  }

  render() {
    const { project, palette, addPalette } = this.props;
    const sidebarWidth = 300;

    if (!project || !project.scenes) {
      return <div />;
    }

    return (
      <div
        style={{
          position: "fixed",
          left: "0px",
          top: "38px",
          bottom: "0px",
          overflow: "auto",
          right: sidebarWidth
        }}
      >
        <PageHeader>
          <h1>{l10n("PALETTES_EDITOR")}</h1>
        </PageHeader>
        <PageContent>
          <section>
            {palette && palette.id ? (
              <FormField key={palette.id}>
                <input 
                  maxLength="25"
                  value={palette.name} 
                  onChange={this.onEdit("name")}
                />
                <CustomPalettePicker 
                  id={palette.id}
                  paletteId={palette.id}
                />
                <Button onClick={this.onRemove}>Remove Palette</Button>
              </FormField>
            ) : "No palette selected"}
          </section>
        </PageContent>
        <PaletteSidebar 
          selectedPalette={palette}
          onAdd={addPalette}
          width={sidebarWidth}
        />
      </div>
    );
  }
}

PalettePage.propTypes = {
  project: ProjectShape.isRequired,
  palette: PaletteShape,
  editPalette: PropTypes.func.isRequired,
  addPalette: PropTypes.func.isRequired,
  removePalette: PropTypes.func.isRequired
};

PalettePage.defaultProps = {
  palette: {
    id: "",
    colors: []
  },
}

function mapStateToProps(state) {
  const project = state.entities.present.result;
  const { worldSidebarWidth: sidebarWidth } = state.settings;
  const palettesLookup = getPalettesLookup(state);
  const paletteIds = getPaletteIds(state);
  const { id } = state.navigation;
  const palette = palettesLookup[id] || palettesLookup[paletteIds[0]];

  return {
    project,
    palette,
    palettesLookup,
    sidebarWidth
  };
}

const mapDispatchToProps = {
  editPalette: actions.editPalette,
  addPalette: actions.addPalette,
  removePalette: actions.removePalette
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PalettePage);
