import React, { Component } from "react";
import { connect } from "react-redux";
import FilesSidebar from "../../components/assets/FilesSidebar";
import ImageViewer from "../../components/assets/ImageViewer";
import * as actions from "../../actions";

class UIPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      query: ""
    };
  }

  onSearch = query => {
    this.setState({
      query
    });
  };

  render() {
    const { files, id } = this.props;
    const { query } = this.state;

    const filesList = query
      ? files.filter(file => {
          return file.name.toUpperCase().indexOf(query.toUpperCase()) > -1;
        })
      : files;

    const file = filesList.find(file => file.id === id) || filesList[0];

    return (
      <div>
        <ImageViewer file={file} />
        <FilesSidebar
          files={filesList}
          selectedFile={file}
          query={query}
          onSearch={this.onSearch}
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { id } = state.navigation;
  const projectRoot = state.document && state.document.root;
  const uiVersion = state.editor.uiVersion;
  const files = projectRoot
    ? [
        {
          id: "ascii",
          name: "ASCII Extended",
          filename: `ascii.png`,
          _v: uiVersion
        },
        {
          id: "frame",
          name: "Window Frame",
          filename: `frame.png`,
          _v: uiVersion
        },
        {
          id: "cursor",
          name: "Cursor",
          filename: `cursor.png`,
          _v: uiVersion
        },
        {
          id: "emotes",
          name: "Emotes",
          filename: `emotes.png`,
          _v: uiVersion
        }
      ]
    : [];
  return {
    files,
    id
  };
}

const mapDispatchToProps = {
  openHelp: actions.openHelp
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UIPage);
