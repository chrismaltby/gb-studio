import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import cx from "classnames";
import { PlusIcon } from "../library/Icons";
import Button from "../library/Button";
import * as actions from "../../actions";
import l10n from "../../lib/helpers/l10n";
import { PaletteShape } from "../../reducers/stateShape";
import { getPalettes } from "../../reducers/entitiesReducer";
import PaletteBlock from "../library/PaletteBlock";

class PaletteSidebar extends Component {
  render() {
    const { onAdd, width, palettes, selectedPalette, setNavigationId } = this.props;

    return (
      <div className="PaletteSidebarWrapper">
        <div className="PaletteSidebar" style={{ width }}>
          <div className="PaletteSidebar__Title SidebarHeading">
            Palettes
            <div className="SidebarHeading__FluidSpacer" />
            {onAdd && (
              <Button onClick={onAdd} title={l10n("ASSET_ADD")}>
                <PlusIcon />
              </Button>
            )}
          </div>
          {palettes.map(palette => (
            palette.id && (
              <div 
                key={palette.id} 
                onClick={() => setNavigationId(palette.id)}
                className={cx("PaletteSidebar__ListItem", {
                  "PaletteSidebar__ListItem--Active": palette.id === selectedPalette.id
                })}
              >
                <div style={{flex: 1, lineHeight: 1.5}}>{palette.name}</div>
                <PaletteBlock colors={palette.colors} size={19} />
              </div>)
          ))}
        </div>
      </div>
    );
  }
}

PaletteSidebar.propTypes = {
  setNavigationId: PropTypes.func.isRequired,
  width: PropTypes.number,
  selectedPalette: PaletteShape.isRequired,
  palettes: PropTypes.arrayOf(PaletteShape).isRequired,
  onAdd: PropTypes.func.isRequired,
};

PaletteSidebar.defaultProps = {
  width: 300
};

function mapStateToProps(state) {
  const { PaletteSidebarWidth: width } = state.settings;
  const palettes = getPalettes(state);
  return {
    width,
    palettes
  };
}

const mapDispatchToProps = {
  setNavigationId: actions.setNavigationId,
  resizePaletteSidebar: actions.resizePaletteSidebar
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PaletteSidebar);
