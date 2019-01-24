import React, { Component } from "react";
import cx from "classnames";
import { connect } from "react-redux";
import * as actions from "../actions";
import Button from "./Button";
import "./Navbar.css";

class Navbar extends Component {
  render() {
    const { name, modified, section, setSection } = this.props;

    return (
      <div className="Navbar">
        <div className="Navbar__Name">
          {name}
        </div>
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
        ].map(item =>
          <div
            key={item.id}
            onClick={() => setSection(item.id)}
            className={cx("Navbar__Item", {
              "Navbar__Item--Active": item.id === section
            })}
          >
            {item.name}
          </div>
        )}

        <div className="Navbar__Spacer" />
        {modified &&
          <div className="Navbar__Save">
            <Button onClick={this.props.saveWorld}>Save</Button>
          </div>}
      </div>
    );
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

export default connect(mapStateToProps, mapDispatchToProps)(Navbar);
