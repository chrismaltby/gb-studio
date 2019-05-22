import React, { Component } from "react";
import { connect } from "react-redux";
import Button from "../library/Button";
import * as actions from "../../actions";
import l10n from "../../lib/helpers/l10n";
import { divisibleBy8 } from "../../lib/helpers/8bit";

class ImageViewer extends Component {
  componentDidMount() {
    window.addEventListener("mousewheel", this.onMouseWheel);
  }

  componentWillUnmount() {
    window.removeEventListener("mousewheel", this.onMouseWheel);
  }

  onMouseWheel = e => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (event.wheelDelta > 0) {
        this.props.zoomIn(this.props.section, event.deltaY * 0.5);
      } else {
        this.props.zoomOut(this.props.section, event.deltaY * 0.5);
      }
    }
  };

  onOpen = () => {
    const { projectRoot, file, folder } = this.props;
    this.props.openFolder(`${projectRoot}/assets/${folder}/${file.filename}`);
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
    const {
      projectRoot,
      file,
      folder,
      zoomRatio,
      editor,
      sidebarWidth
    } = this.props;
    const warnings = this.getWarnings();
    return (
      <div className="ImageViewer" style={{ right: sidebarWidth }}>
        <div className="ImageViewer__Content">
          {file && (
            <div
              className="ImageViewer__Image"
              style={{ transform: `scale(${zoomRatio})` }}
            >
              <img
                alt=""
                src={`${projectRoot}/assets/${folder}/${
                  file.filename
                }?v=${file._v || 0}`}
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
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { id, section } = state.navigation;
  const folder =
    section === "backgrounds"
      ? "backgrounds"
      : section === "sprites"
      ? "sprites"
      : "ui";
  const zoom =
    section === "backgrounds"
      ? state.editor.zoomImage
      : section === "sprites"
      ? state.editor.zoomSprite
      : state.editor.zoomUI;
  return {
    projectRoot: state.document && state.document.root,
    folder,
    section,
    zoomRatio: (zoom || 100) / 100,
    editor: state.editor,
    sidebarWidth: state.project.present.settings.sidebarWidth
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
