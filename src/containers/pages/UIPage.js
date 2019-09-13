import React, { Component } from "react";
import PropTypes from "prop-types";
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
    const { files, id, openHelp } = this.props;
    const { query } = this.state;

    const filesList = query
      ? files.filter(f => {
          return f.name.toUpperCase().indexOf(query.toUpperCase()) > -1;
        })
      : files;

    const file = filesList.find(f => f.id === id) || filesList[0];

    return (
      <div>
        {file && <ImageViewer file={file} />}
        <FilesSidebar
          files={filesList}
          selectedFile={file}
          query={query}
          onSearch={this.onSearch}
          onAdd={() => {
            openHelp("ui-elements");
          }}
        />
      </div>
    );
  }
}

UIPage.propTypes = {
  id: PropTypes.string,
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      filename: PropTypes.string.isRequired,
      _v: PropTypes.number.isRequired
    })
  ).isRequired,
  openHelp: PropTypes.func.isRequired
};

UIPage.defaultProps = {
  id: ""
};

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
