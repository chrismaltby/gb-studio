import React, { Component } from "react";
import { connect } from "react-redux";
import FilesSidebar from "../../components/assets/FilesSidebar";
import MusicViewer from "../../components/assets/MusicViewer";
import * as actions from "../../actions";

class MusicPage extends Component {
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
        <MusicViewer file={file} />
        <FilesSidebar
          files={filesList}
          selectedFile={file}
          query={query}
          onSearch={this.onSearch}
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
)(MusicPage);
