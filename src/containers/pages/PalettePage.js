/* eslint-disable jsx-a11y/label-has-for */
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import l10n from "../../lib/helpers/l10n";
import PageHeader from "../../components/library/PageHeader";
import PageContent from "../../components/library/PageContent";
import CustomPalettePicker from "../../components/forms/CustomPalettePicker";
import { PaletteShape } from "../../store/stateShape";
import PaletteSidebar from "../../components/assets/PaletteSidebar";
import castEventValue from "../../lib/helpers/castEventValue";
import Button from "../../components/library/Button";
import { paletteSelectors } from "../../store/features/entities/entitiesState";
import entitiesActions from "../../store/features/entities/entitiesActions";

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
    const palette = this.getCurrentPalette();
    if (!palette.name) {
      this.onEdit("name")("Palette");
    }
    this.setState({
      edit: false,
    });
  };

  checkForFinishEdit = (e) => {
    if (e.key === "Enter") {
      this.onFinishEdit();
    }
  };

  onEdit = (key) => (e) => {
    const { editPalette } = this.props;
    const palette = this.getCurrentPalette();
    editPalette({
      paletteId: palette.id,
      changes: {
        [key]: castEventValue(e),
      },
    });
  };

  onReset = () => {
    const { editPalette } = this.props;
    const palette = this.getCurrentPalette();
    editPalette({
      paletteId: palette.id,
      changes: {
        colors: palette.defaultColors || [],
      },
    });
  };

  onRemove = () => {
    const { removePalette } = this.props;
    const palette = this.getCurrentPalette();
    removePalette({ paletteId: palette.id });
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
          width: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
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
              {!palette.defaultColors && !edit && (
                <Button key="edit" onClick={this.onStartEdit} small transparent>
                  {l10n("FIELD_RENAME")}
                </Button>
              )}
            </h1>
          ) : (
            <h1>No palette selected</h1>
          )}
        </PageHeader>
        <PageContent>
          <section>
            {palette && palette.id && (
              <div key={palette.id} style={{ paddingRight: sidebarWidth }}>
                <CustomPalettePicker id={palette.id} paletteId={palette.id} />
                <div style={{ marginTop: 30 }}>
                  {palette.defaultColors ? (
                    <Button onClick={this.onReset}>Reset Palette</Button>
                  ) : (
                    <Button onClick={this.onRemove}>Remove Palette</Button>
                  )}
                </div>
              </div>
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
  const { filesSidebarWidth: sidebarWidth } = state.editor;
  const palettesLookup = paletteSelectors.selectEntities(state);
  const palettes = paletteSelectors.selectAll(state);
  const { id } = state.navigation;

  return {
    palettes,
    palettesLookup,
    sidebarWidth,
    id,
  };
}

const mapDispatchToProps = {
  editPalette: entitiesActions.editPalette,
  addPalette: entitiesActions.addPalette,
  removePalette: entitiesActions.removePalette,
};

export default connect(mapStateToProps, mapDispatchToProps)(PalettePage);
