import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Button from "../library/Button";
import l10n from "lib/helpers/l10n";
import { zoomForSection, assetFilename } from "lib/helpers/gbstudio";
import BackgroundWarnings from "../world/BackgroundWarnings";
import editorActions from "store/features/editor/editorActions";
import electronActions from "store/features/electron/electronActions";

class ImageViewer extends Component {
  componentDidMount() {
    window.addEventListener("mousewheel", this.onMouseWheel);
  }

  componentWillUnmount() {
    window.removeEventListener("mousewheel", this.onMouseWheel);
  }

  onMouseWheel = (e) => {
    const { zoomIn, zoomOut, section } = this.props;
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.wheelDelta > 0) {
        zoomIn({ section, delta: e.deltaY * 0.5 });
      } else {
        zoomOut({ section, delta: e.deltaY * 0.5 });
      }
    }
  };

  onOpen = () => {
    const { projectRoot, file, folder, openFile } = this.props;
    openFile({
      filename: `${projectRoot}/assets/${folder}/${file.filename}`,
      type: "image",
    });
  };

  render() {
    const { projectRoot, file, folder, zoom, sidebarWidth } = this.props;
    return (
      <div className="ImageViewer" style={{ right: sidebarWidth }}>
        <div className="ImageViewer__Content">
          {file && (
            <div
              className="ImageViewer__Image"
              style={{ transform: `scale(${zoom})` }}
            >
              <img
                alt=""
                src={`file://${assetFilename(projectRoot, folder, file)}?_v=${
                  file._v || 0
                }`}
              />
            </div>
          )}
        </div>
        {file && (
          <div
            className="ImageViewer__Edit"
            style={{ right: sidebarWidth + 10 }}
          >
            <Button onClick={this.onOpen}>{l10n("ASSET_EDIT")}</Button>
          </div>
        )}
        {file && folder === "backgrounds" && (
          <div
            className="ImageViewer__Warning"
            style={{ right: sidebarWidth + 10 }}
          >
            <BackgroundWarnings id={file.id} />
          </div>
        )}
      </div>
    );
  }
}

ImageViewer.propTypes = {
  // projectRoot: PropTypes.string.isRequired,
  // folder: PropTypes.string.isRequired,
  file: PropTypes.shape({
    id: PropTypes.string.isRequired,
    filename: PropTypes.string.isRequired,
  }),
  // section: PropTypes.string.isRequired,
  // zoom: PropTypes.number.isRequired,
  // sidebarWidth: PropTypes.number.isRequired,
  // zoomIn: PropTypes.func.isRequired,
  // zoomOut: PropTypes.func.isRequired,
  // openFile: PropTypes.func.isRequired,
};

ImageViewer.defaultProps = {
  file: {},
};

function mapStateToProps(state, _ownProps) {
  const { section } = state.navigation;
  const folder = section;
  const zoom = zoomForSection(section, state.editor);
  const { filesSidebarWidth: sidebarWidth } = state.editor;
  return {
    projectRoot: state.document && state.document.root,
    folder,
    section,
    zoom: (zoom || 100) / 100,
    sidebarWidth,
  };
}

const mapDispatchToProps = {
  openFile: electronActions.openFile,
  zoomIn: editorActions.zoomIn,
  zoomOut: editorActions.zoomOut,
};

export default connect(mapStateToProps, mapDispatchToProps)(ImageViewer);
