import React, { Component } from "react";
import {
  Toolbar,
  ToolbarSpacer,
  ToolbarButton
} from "../components/Toolbar/Toolbar";
import { PlayIcon, DownloadIcon } from "../components/Icons";
import { connect } from "react-redux";
import * as actions from "../actions";

class AppToolbar extends Component {
  render() {
    const { name, modified, section, setSection } = this.props;

    return (
      <Toolbar>
        <ToolbarButton>
          World Editor <small>▼</small>
        </ToolbarButton>
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

    /*

      <div className="AppToolbar">
        <div className="AppToolbar__Name">{name}</div>
        {[
          {
            id: "editor",
            name: "Editor"
          },
          {
            id: "images",
            name: "Images"
          },
          {
            id: "spriteSheets",
            name: "Sprites"
          }
        ].map(item => (
          <div
            key={item.id}
            onClick={() => setSection(item.id)}
            className={cx("AppToolbar__Item", {
              "AppToolbar__Item--Active": item.id === section
            })}
          >
            {item.name}
          </div>
        ))}

        <div className="AppToolbar__Spacer" />

        <ToolbarButton>
          <PlayIcon />
        </ToolbarButton>
        <ToolbarButton>
          <DownloadIcon />
        </ToolbarButton>

        {modified && (
          <div className="AppToolbar__Save">
            <Button onClick={this.props.saveWorld}>Save</Button>
          </div>
        )}
      </div>
    );
    */
  }
}

function mapStateToProps(state) {
  return {
    modified: state.modified,
    name: state.world && state.world.name,
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
