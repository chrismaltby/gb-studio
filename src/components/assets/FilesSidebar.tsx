import React, {ChangeEvent, Component} from "react";
import {connect} from "react-redux";
import cx from "classnames";
import Button from "../library/Button";
import {HelpIcon} from "ui/icons/Icons";
import l10n from "lib/helpers/l10n";
import {groupBy} from "lib/helpers/array";
import editorActions from "store/features/editor/editorActions";
import navigationActions from "store/features/navigation/navigationActions";
import {clampSidebarWidth} from "lib/helpers/window/sidebar";
import {RootState} from "store/configureStore";

const groupByPlugin = groupBy("plugin");

interface File {
  id: string;
  name: string;
  plugin?: string;
}

interface StateProps {
  resizeFilesSidebar: (width: number) => void;
  setNavigationId: (id: string) => void;
  onSearch: (query: string) => void;
  width: number;
  files: Array<File>;
  selectedFile: {
    id: string;
    name: string;
  };
  onAdd: () => void;
  query: string;
}

interface State {
  dragging: boolean;
}


class FilesSidebar extends Component<StateProps, State> {
  static defaultProps = {
    width: 300,
    selectedFile: {
      id: "",
      name: "",
    },
    onAdd: undefined,
  };
  private readonly dragHandler: React.RefObject<HTMLDivElement>;

  constructor(props: StateProps) {
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

  renderFile = (file: File) => {
    const {selectedFile, setNavigationId} = this.props;
    return (
      <div
        key={file.id}
        onClick={() => setNavigationId(file.id)}
        className={cx("FilesSidebar__ListItem", {
          "FilesSidebar__ListItem--Active": file.id === selectedFile.id,
        })}
      >
        {file.name}
      </div>
    );
  };

  render() {
    const {files, onAdd, query, width} = this.props;

    const groupedFiles = groupByPlugin(files);

    return (
      <div className="FilesSidebarWrapper">
        <div
          ref={this.dragHandler}
          className="FilesSidebarDragHandle"
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
        />
        <div className="FilesSidebar" style={{width}}>
          <div className="FilesSidebar__Search">
            <input
              autoFocus
              placeholder={l10n("ASSET_SEARCH")}
              onChange={this.onSearch}
              value={query}
            />
            {onAdd && (
              <Button onClick={onAdd} title={l10n("MENU_DOCUMENTATION")}>
                <HelpIcon/>
              </Button>
            )}
          </div>
          {Object.keys(groupedFiles)
            .sort()
            .map((plugin) => {
              if (!plugin) {
                return groupedFiles[plugin].map(this.renderFile);
              }
              return (
                <div className="FilesSidebar__Group" key={plugin}>
                  <div className="FilesSidebar__GroupHeading">{plugin}</div>
                  {groupedFiles[plugin].map(this.renderFile)}
                </div>
              );
            })}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state: RootState) {
  const {filesSidebarWidth: width} = state.editor;
  return {
    width,
  };
}

const mapDispatchToProps = {
  setNavigationId: navigationActions.setNavigationId,
  resizeFilesSidebar: editorActions.resizeFilesSidebar,
};

export default connect(mapStateToProps, mapDispatchToProps)(FilesSidebar);
