import React, { Component } from "react";
import { connect } from "react-redux";
import FilesSidebar from "./FilesSidebar";
import ImageViewer from "./ImageViewer";

class ImagesSection extends Component {
  render() {
    const { images } = this.props;
    return (
      <div>
        <FilesSidebar files={images} />
        <ImageViewer />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    images: state.world && state.world.images ? state.world.images : []
  };
}

export default connect(mapStateToProps)(ImagesSection);
