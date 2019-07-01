import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Button from "../library/Button";
import * as actions from "../../actions";
import l10n from "../../lib/helpers/l10n";
import { divisibleBy8 } from "../../lib/helpers/8bit";
import { zoomForSection, assetFilename } from "../../lib/helpers/gbstudio";

class ImageViewer extends Component {
  componentDidMount() {
    window.addEventListener("mousewheel", this.onMouseWheel);
  }

  componentWillUnmount() {
    window.removeEventListener("mousewheel", this.onMouseWheel);
  }

  onMouseWheel = e => {
    const { zoomIn, zoomOut, section } = this.props;
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.wheelDelta > 0) {
        zoomIn(section, e.deltaY * 0.5);
      } else {
        zoomOut(section, e.deltaY * 0.5);
      }
    }
  };

  onOpen = () => {
    const { projectRoot, file, folder, openFolder } = this.props;
    openFolder(`${projectRoot}/assets/${folder}/${file.filename}`);
  };

  getWarnings = () => {
    const { file, folder } = this.props;
    const warnings = [];
    if (file && folder === "backgrounds") {
      if (file.imageWidth < 160 || file.imageHeight < 144) {
        warnings.push(l10n("WARNING_BACKGROUND_TOO_SMALL"));
      }
      if (file.imageWidth > 256 || file.imageHeight > 256) {
        warnings.push(l10n("WARNING_BACKGROUND_TOO_LARGE"));
      }
      if (!divisibleBy8(file.imageWidth) || !divisibleBy8(file.imageHeight)) {
        warnings.push(l10n("WARNING_BACKGROUND_NOT_MULTIPLE_OF_8"));
      }
    }
    return warnings;
  };

  render() {
    const { projectRoot, file, folder, zoom, sidebarWidth } = this.props;
    const warnings = this.getWarnings();
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
                src={`${assetFilename(
                  projectRoot,
                  folder,
                  file
                )}?_v=${file._v || 0}`}
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
        {warnings.length > 0 && (
          <div className="ImageViewer__Warning">
            <ul>
              {warnings.map((warning, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
}

ImageViewer.propTypes = {
  projectRoot: PropTypes.string.isRequired,
  folder: PropTypes.string.isRequired,
  file: PropTypes.shape({
    id: PropTypes.string.isRequired,
    filename: PropTypes.string.isRequired
  }),
  section: PropTypes.string.isRequired,
  zoom: PropTypes.number.isRequired,
  sidebarWidth: PropTypes.number.isRequired,
  zoomIn: PropTypes.func.isRequired,
  zoomOut: PropTypes.func.isRequired,
  openFolder: PropTypes.func.isRequired
};

ImageViewer.defaultProps = {
  file: {}
};

function mapStateToProps(state) {
  const { section } = state.navigation;
  const folder = section;
  const zoom = zoomForSection(section, state.editor);
  const { filesSidebarWidth: sidebarWidth } = state.settings;
  return {
    projectRoot: state.document && state.document.root,
    folder,
    section,
    zoom: (zoom || 100) / 100,
    sidebarWidth
  };
}

const mapDispatchToProps = {
  openFolder: actions.openFolder,
  zoomIn: actions.zoomIn,
  zoomOut: actions.zoomOut
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ImageViewer);
