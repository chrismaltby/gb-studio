import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import FilesSidebar from "../../components/assets/FilesSidebar";
import MusicViewer from "../../components/assets/MusicViewer";
import { musicSelectors } from "../../store/features/entities/entitiesState";
import electronActions from "../../store/features/electron/electronActions";

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
        {file && <MusicViewer file={file} />}
        <FilesSidebar
          files={filesList}
          selectedFile={file}
          query={query}
          onSearch={this.onSearch}
          onAdd={() => {
            openHelp("music");
          }}
        />
      </div>
    );
  }
}

MusicPage.propTypes = {
  id: PropTypes.string,
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      settings: PropTypes.shape({
        disableSpeedConversion: PropTypes.bool,
      }),
    })
  ).isRequired,
  openHelp: PropTypes.func.isRequired
};

MusicPage.defaultProps = {
  id: ""
};

function mapStateToProps(state) {
  const { id } = state.navigation;
  const files = musicSelectors.selectAll(state);
  return {
    files,
    id
  };
}

const mapDispatchToProps = {
  openHelp: electronActions.openHelp
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MusicPage);
