import React, {ChangeEvent, Component} from "react";
import {connect} from "react-redux";
import cx from "classnames";
import {PlusIcon} from "ui/icons/Icons";
import Button from "../library/Button";
import l10n from "lib/helpers/l10n";
import PaletteBlock from "../library/PaletteBlock";
import editorActions from "store/features/editor/editorActions";
import navigationActions from "store/features/navigation/navigationActions";
import {clampSidebarWidth} from "lib/helpers/window/sidebar";
import {Palette} from "store/features/entities/entitiesTypes";
import {RootState} from "store/configureStore";

interface StateProps {
  width: number;
  selectedPalette: Palette;
  palettes: Palette[];
  query: string;
}

interface ActionProps {
  setNavigationId: (id: string) => void;
  resizeFilesSidebar: (width: number) => void;
  onSearch: (query: string) => void;
  onAdd: () => void;
}

type Props = StateProps & ActionProps;

interface State {
  dragging: boolean;
}

class PaletteSidebar extends Component<Props, State> {
  private dragHandler: React.RefObject<HTMLDivElement>;

  constructor(props: Props) {
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
    const {dragging} = this.state;
    if (dragging) {
      this.setState({
        dragging: false,
      });
    }
  };

  onMouseMove = (event: MouseEvent) => {
    const {resizeFilesSidebar} = this.props;
    const {dragging} = this.state;
    if (dragging) {
      resizeFilesSidebar(clampSidebarWidth(window.innerWidth - event.pageX));
    }
  };

  onSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const {onSearch} = this.props;
    onSearch(e.currentTarget.value);
  };

  render() {
    const {onAdd, width, palettes, selectedPalette, setNavigationId, query} =
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
        <div className="PaletteSidebar" style={{width}}>
          <div className="PaletteSidebar__Search">
            <input
              autoFocus
              placeholder={l10n("ASSET_SEARCH")}
              onChange={this.onSearch}
              value={query}
            />
            {onAdd && (
              <Button onClick={onAdd} title={l10n("ASSET_ADD")}>
                <PlusIcon/>
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
                      <div style={{flex: 1, lineHeight: 1.5}}>
                        {palette.name}
                      </div>
                      <PaletteBlock colors={palette.colors} size={19}/>
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
                      <div style={{flex: 1, lineHeight: 1.5}}>
                        {palette.name}
                      </div>
                      <PaletteBlock colors={palette.colors} size={19}/>
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

function mapStateToProps(state: RootState, ownProps: any): StateProps {
  const {filesSidebarWidth: width} = state.editor;
  return {
    width: width ?? 300,
    query: ownProps.query,
    palettes: ownProps.palettes,
    selectedPalette: ownProps.selectedPalette,
  };
}

const mapDispatchToProps = () => {
  return {
    setNavigationId: (id: string) => navigationActions.setNavigationId(id),
    resizeFilesSidebar: (size: number) => editorActions.resizeFilesSidebar(size),
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(PaletteSidebar);
