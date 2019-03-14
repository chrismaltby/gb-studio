import React, { Component } from "react";
import { connect } from "react-redux";
import FilesSidebar from "../../components/images/FilesSidebar";
import ImageViewer from "../../components/images/ImageViewer";
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
  const files = projectRoot
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
