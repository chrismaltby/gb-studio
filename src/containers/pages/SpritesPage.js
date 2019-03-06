import React, { Component } from "react";
import { connect } from "react-redux";
import FilesSidebar from "../../components/images/FilesSidebar";
import ImageViewer from "../../components/images/ImageViewer";
import * as actions from "../../actions";

class SpritesSection extends Component {
  render() {
    const { spriteSheets } = this.props;

    return (
      <div>
        <FilesSidebar
          files={spriteSheets}
          onAdd={() => {
            this.props.openHelp("sprites");
          }}
        />
        <ImageViewer />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    spriteSheets:
      state.project.present && state.project.present.spriteSheets
        ? state.project.present.spriteSheets
        : []
  };
}

const mapDispatchToProps = {
  openHelp: actions.openHelp
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SpritesSection);
