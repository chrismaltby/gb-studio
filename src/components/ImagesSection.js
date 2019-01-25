import React, { Component } from "react";
import { connect } from "react-redux";
import FilesSidebar from "./FilesSidebar";
import ImageViewer from "./ImageViewer";

class ImagesSection extends Component {
  render() {
    const { images } = this.props;
    return (
      <div>
        <ImageViewer />
        <FilesSidebar files={images} />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    images: state.project && state.project.images ? state.project.images : []
  };
}

export default connect(mapStateToProps)(ImagesSection);
