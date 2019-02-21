import React, { Component } from "react";
import { connect } from "react-redux";
import FilesSidebar from "../../components/images/FilesSidebar";
import ImageViewer from "../../components/images/ImageViewer";
import SpriteHelpModal from "../../components/images/SpriteHelpModal";

class SpritesSection extends Component {
  constructor() {
    super();
    this.state = {
      displayHelp: false
    };
  }

  onAdd = () => {
    this.setState({ displayHelp: true });
  };

  onCloseHelp = () => {
    this.setState({ displayHelp: false });
  };

  render() {
    const { spriteSheets } = this.props;
    const { displayHelp } = this.state;

    return (
      <div>
        <FilesSidebar files={spriteSheets} onAdd={this.onAdd} />
        <ImageViewer />
        {displayHelp && <SpriteHelpModal onClose={this.onCloseHelp} />}
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

export default connect(mapStateToProps)(SpritesSection);
