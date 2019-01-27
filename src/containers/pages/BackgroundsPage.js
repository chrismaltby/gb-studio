import React, { Component } from "react";
import FilesSidebar from "../../components/FilesSidebar";
import ImageViewer from "../../components/ImageViewer";

class BackgroundsPage extends Component {
  render() {
    return (
      <div>
        <FilesSidebar />
        <ImageViewer />
      </div>
    );
  }
}

export default BackgroundsPage;
