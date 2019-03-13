import React, { Component } from "react";
import { connect } from "react-redux";
import FilesSidebar from "../../components/images/FilesSidebar";
import ImageViewer from "../../components/images/ImageViewer";
import * as actions from "../../actions";

class MusicSection extends Component {
  render() {
    const { files, file } = this.props;
    return (
      <div>
        <ImageViewer file={file} />
        <FilesSidebar
          files={files}
          onAdd={() => {
            this.props.openHelp("music");
          }}
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { id } = state.navigation;
  const files =
    state.project.present && state.project.present.music
      ? state.project.present.music
      : [];
  const file = files.find(file => file.id === id) || files[0];
  return {
    files,
    file
  };
}

const mapDispatchToProps = {
  openHelp: actions.openHelp
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MusicSection);
