import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import FilesSidebar from "../../components/assets/FilesSidebar";
import ImageViewer from "../../components/assets/ImageViewer";
import * as actions from "../../actions";
import { getBackgrounds } from "../../reducers/entitiesReducer";

class ImagesPage extends Component {
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
            openHelp("backgrounds");
          }}
        />
      </div>
    );
  }
}

ImagesPage.propTypes = {
  id: PropTypes.string,
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  openHelp: PropTypes.func.isRequired
};

ImagesPage.defaultProps = {
  id: ""
};

function mapStateToProps(state) {
  const { id } = state.navigation;
  const files = getBackgrounds(state);
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
)(ImagesPage);
