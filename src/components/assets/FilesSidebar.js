import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import cx from "classnames";
import { PlusIcon } from "../library/Icons";
import Button from "../library/Button";
import * as actions from "../../actions";
import l10n from "../../lib/helpers/l10n";

class FilesSidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dragging: false
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
      dragging: true
    });
  };

  onMouseUp = () => {
    const { dragging } = this.state;
    if (dragging) {
      this.setState({
        dragging: false
      });
    }
  };

  onMouseMove = event => {
    const { resizeSidebar } = this.props;
    const { dragging } = this.state;
    if (dragging) {
      resizeSidebar(window.innerWidth - event.pageX);
    }
  };

  onSearch = e => {
    const { onSearch } = this.props;
    onSearch(e.currentTarget.value);
  };

  render() {
    const {
      files,
      selectedFile,
      setNavigationId,
      onAdd,
      query,
      width
    } = this.props;

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
              <Button onClick={onAdd} title={l10n("ASSET_ADD")}>
                <PlusIcon />
              </Button>
            )}
          </div>
          {files.map((file, index) => (
            <div
              key={file.id}
              onClick={() => setNavigationId(file.id)}
              className={cx("FilesSidebar__ListItem", {
                "FilesSidebar__ListItem--Active": file.id === selectedFile.id
              })}
            >
              {file.name}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

FilesSidebar.propTypes = {
  resizeSidebar: PropTypes.func.isRequired,
  setNavigationId: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  width: PropTypes.number,
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  selectedFile: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }),
  onAdd: PropTypes.func,
  query: PropTypes.string.isRequired
};

FilesSidebar.defaultProps = {
  width: 300,
  selectedFile: {},
  onAdd: undefined
};

function mapStateToProps(state) {
  return {
    width: state.project.present.settings.sidebarWidth
  };
}

const mapDispatchToProps = {
  setNavigationId: actions.setNavigationId,
  resizeSidebar: actions.resizeSidebar
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FilesSidebar);
