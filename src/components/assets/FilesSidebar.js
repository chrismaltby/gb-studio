import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import cx from "classnames";
import Button from "../library/Button";
import { HelpIcon } from "ui/icons/Icons";
import l10n from "lib/helpers/l10n";
import { groupBy } from "lib/helpers/array";
import editorActions from "store/features/editor/editorActions";
import navigationActions from "store/features/navigation/navigationActions";
import { clampSidebarWidth } from "lib/helpers/window/sidebar";

const groupByPlugin = groupBy("plugin");

class FilesSidebar extends Component {
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
    const { selectedFile, setNavigationId } = this.props;
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
    const { files, onAdd, query, width } = this.props;

    const groupedFiles = groupByPlugin(files);

    return (
      <div className="FilesSidebarWrapper">
        <div
          ref={this.dragHandler}
          className="FilesSidebarDragHandle"
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
        />
        <div className="FilesSidebar" style={{ width }}>
          <div className="FilesSidebar__Search">
            <input
              autoFocus
              placeholder={l10n("ASSET_SEARCH")}
              onChange={this.onSearch}
              value={query}
            />
            {onAdd && (
              <Button onClick={onAdd} title={l10n("MENU_DOCUMENTATION")}>
                <HelpIcon />
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

FilesSidebar.propTypes = {
  resizeFilesSidebar: PropTypes.func.isRequired,
  setNavigationId: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  width: PropTypes.number,
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedFile: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }),
  onAdd: PropTypes.func,
  query: PropTypes.string.isRequired,
};

FilesSidebar.defaultProps = {
  width: 300,
  selectedFile: {
    id: "",
    name: "",
  },
  onAdd: undefined,
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

export default connect(mapStateToProps, mapDispatchToProps)(FilesSidebar);
