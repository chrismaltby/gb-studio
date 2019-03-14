import React, { Component } from "react";
import { connect } from "react-redux";
import Button from "../library/Button";

class ImageViewer extends Component {
  onOpen = () => {
    const { projectRoot, file, folder } = this.props;
    this.props.openFolder(`${projectRoot}/assets/${folder}/${file.filename}`);
  };

  render() {
    const { projectRoot, file, folder, zoomRatio } = this.props;
    return (
      <div className="ImageViewer">
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
          <div className="ImageViewer__Edit">
            <Button onClick={this.onOpen}>Edit</Button>
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
    zoomRatio: (zoom || 100) / 100
  };
}

const mapDispatchToProps = {
  openFolder: actions.openFolder
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ImageViewer);
