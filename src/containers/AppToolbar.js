import React, { Component } from "react";
import {
  Toolbar,
  ToolbarSpacer,
  ToolbarButton,
  ToolbarDropdownButton
} from "../components/Toolbar/Toolbar";
import { Menu, MenuItem } from "../components/Menu";
import { PlayIcon, DownloadIcon } from "../components/Icons";
import { connect } from "react-redux";
import * as actions from "../actions";

const sectionNames = {
  overview: "Overview",
  world: "Game World",
  sprites: "Sprites",
  backgrounds: "Backgrounds",
  tiles: "Tiles",
  script: "Script"
};

class AppToolbar extends Component {
  setSection = section => e => {
    this.props.setSection(section);
  };

  render() {
    const { name, modified, section = "overview" } = this.props;
    return (
      <Toolbar>
        <ToolbarDropdownButton
          title={sectionNames[section]}
          style={{ width: 130 }}
        >
          {Object.keys(sectionNames).map(key => (
            <MenuItem key={key} value={key} onClick={this.setSection(key)}>
              {sectionNames[key]}
            </MenuItem>
          ))}
        </ToolbarDropdownButton>
        <ToolbarSpacer />
        {name || "Untitled"}
        <ToolbarSpacer />
        <ToolbarButton>
          <PlayIcon />
        </ToolbarButton>
        <ToolbarButton>
          <DownloadIcon />
        </ToolbarButton>
      </Toolbar>
    );
  }
}

function mapStateToProps(state) {
  return {
    modified: state.modified,
    name: state.project && state.project.name,
    section: state.navigation.section
  };
}

const mapDispatchToProps = {
  saveWorld: actions.saveWorld,
  setSection: actions.setSection
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AppToolbar);
