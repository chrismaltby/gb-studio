import React, { Component } from "react";
import { connect } from "react-redux";
import FilesSidebar from "../../components/images/FilesSidebar";
import ImageViewer from "../../components/images/ImageViewer";

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
    images: state.project.present && state.project.present.images ? state.project.present.images : []
  };
}

export default connect(mapStateToProps)(ImagesSection);
