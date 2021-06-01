import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import cx from "classnames";
import { PlusIcon } from "ui/icons/Icons";
import Button from "../library/Button";
import l10n from "lib/helpers/l10n";
import { PaletteShape } from "store/stateShape";
import PaletteBlock from "../library/PaletteBlock";
import editorActions from "store/features/editor/editorActions";
import navigationActions from "store/features/navigation/navigationActions";
import { clampSidebarWidth } from "lib/helpers/window/sidebar";

class PaletteSidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dragging: false,
    };
    this.dragHandler = React.createRef();
  }

  componentDidMount() {
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.onMouseUp);
  }

  componentWillUnmount() {
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);
  }

  onMouseDown = () => {
    this.setState({
      dragging: true,
    });
  };

  onMouseUp = () => {
    const { dragging } = this.state;
    if (dragging) {
      this.setState({
        dragging: false,
      });
    }
  };

  onMouseMove = (event) => {
    const { resizeFilesSidebar } = this.props;
    const { dragging } = this.state;
    if (dragging) {
      resizeFilesSidebar(clampSidebarWidth(window.innerWidth - event.pageX));
    }
  };

  onSearch = (e) => {
    const { onSearch } = this.props;
    onSearch(e.currentTarget.value);
  };

  renderFile = (file) => {
    const { selectedPalette, setNavigationId } = this.props;
    return (
      <div
        key={file.id}
        onClick={() => setNavigationId(file.id)}
        className={cx("FilesSidebar__ListItem", {
          "FilesSidebar__ListItem--Active": file.id === selectedPalette.id,
        })}
      >
        {file.name}
      </div>
    );
  };

  render() {
    const { onAdd, width, palettes, selectedPalette, setNavigationId, query } =
      this.props;

    const defaultPalettes = palettes.filter((p) => p.defaultColors);
    const customPalettes = palettes.filter((p) => !p.defaultColors);

    return (
      <div className="PaletteSidebarWrapper">
        <div
          ref={this.dragHandler}
          className="PaletteSidebarDragHandle"
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
        />
        <div className="PaletteSidebar" style={{ width }}>
          <div className="PaletteSidebar__Search">
            <input
              autoFocus
              placeholder={l10n("ASSET_SEARCH")}
              onChange={this.onSearch}
              value={query}
            />
            {onAdd && (
              <Button onClick={onAdd} title={l10n("ASSET_ADD")}>
                <PlusIcon />
              </Button>
            )}
          </div>
          {/* <div className="PaletteSidebar__Title SidebarHeading">
            Palettes
            <div className="SidebarHeading__FluidSpacer" />
            {onAdd && (
              <Button onClick={onAdd} title={l10n("ASSET_ADD")}>
                <PlusIcon />
              </Button>
            )}
          </div> */}

          {defaultPalettes.length > 0 && (
            <div className="PaletteSidebar__Group">
              <div className="PaletteSidebar__GroupHeading">
                {l10n("FIELD_DEFAULT")}
              </div>

              {defaultPalettes.map(
                (palette) =>
                  palette.id && (
                    <div
                      key={palette.id}
                      onClick={() => setNavigationId(palette.id)}
                      className={cx("PaletteSidebar__ListItem", {
                        "PaletteSidebar__ListItem--Default":
                          palette.defaultColors,
                        "PaletteSidebar__ListItem--Active":
                          palette.id === selectedPalette.id,
                      })}
                    >
                      <div style={{ flex: 1, lineHeight: 1.5 }}>
                        {palette.name}
                      </div>
                      <PaletteBlock colors={palette.colors} size={19} />
                    </div>
                  )
              )}
            </div>
          )}

          {customPalettes.length > 0 && (
            <div className="PaletteSidebar__Group">
              <div className="PaletteSidebar__GroupHeading">
                {l10n("FIELD_CUSTOM")}
              </div>

              {customPalettes.map(
                (palette) =>
                  palette.id && (
                    <div
                      key={palette.id}
                      onClick={() => setNavigationId(palette.id)}
                      className={cx("PaletteSidebar__ListItem", {
                        "PaletteSidebar__ListItem--Default":
                          palette.defaultColors,
                        "PaletteSidebar__ListItem--Active":
                          palette.id === selectedPalette.id,
                      })}
                    >
                      <div style={{ flex: 1, lineHeight: 1.5 }}>
                        {palette.name}
                      </div>
                      <PaletteBlock colors={palette.colors} size={19} />
                    </div>
                  )
              )}
            </div>
          )}
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
  width: 300,
};

function mapStateToProps(state) {
  const { filesSidebarWidth: width } = state.editor;
  return {
    width,
  };
}

const mapDispatchToProps = {
  setNavigationId: navigationActions.setNavigationId,
  resizeFilesSidebar: editorActions.resizeFilesSidebar,
};

export default connect(mapStateToProps, mapDispatchToProps)(PaletteSidebar);
