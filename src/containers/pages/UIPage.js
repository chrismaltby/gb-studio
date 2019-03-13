import React, { Component } from "react";
import { connect } from "react-redux";
import FilesSidebar from "../../components/images/FilesSidebar";
import ImageViewer from "../../components/images/ImageViewer";
import * as actions from "../../actions";

class ImagesSection extends Component {
  render() {
    const { images, image } = this.props;
    return (
      <div>
        <ImageViewer file={image} />
        <FilesSidebar files={images} />
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { id } = state.navigation;
  const projectRoot = state.document && state.document.root;
  const images = projectRoot
    ? [
        {
          id: "ui",
          name: "UI",
          filename: `ui.png`
        },
        {
          id: "emotes",
          name: "Emotes",
          filename: `emotes.png`
        }
      ]
    : [];
  const image = images.find(image => image.id === id) || images[0];
  return {
    images,
    image
  };
}

const mapDispatchToProps = {
  openHelp: actions.openHelp
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ImagesSection);
