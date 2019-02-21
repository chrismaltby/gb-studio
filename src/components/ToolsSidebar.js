import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../actions";
import cx from "classnames";
import { SelectIcon, BrickIcon, EraserIcon, PlusIcon } from "./library/Icons";
import { Menu, MenuItem, MenuOverlay } from "./library/Menu";

class ToolsSidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      add: false
    };
  }

  componentDidMount() {
    window.addEventListener("keydown", this.onKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
  }

  onKeyDown = e => {
    if (e.target.nodeName !== "BODY") {
      return;
    }
    if (e.key === "t") {
      this.setTool("triggers")(e);
    } else if (e.key === "a") {
      this.setTool("actors")(e);
    } else if (e.key === "c") {
      this.setTool("collisions")(e);
    } else if (e.key === "m") {
      this.setTool("map")(e);
    } else if (e.key === "e") {
      this.setTool("eraser")(e);
    } else if (e.key === "s") {
      this.setTool("select")(e);
    }
  };

  openAdd = () => {
    this.setState({
      add: true
    });
  };

  closeAdd = (e) => {
    e.stopPropagation();
    this.setState({
      add: false
    });
  };

  setTool = id => e => {
    e.stopPropagation();
    this.props.setTool(id);
    this.setState({
      add: false
    });
  };

  render() {
    const { add } = this.state;
    const { selected } = this.props;
    return (
      <div className="ToolsSidebar">
        <div
          onClick={this.setTool("select")}
          className={cx("ToolsSidebar__Item", {
            "ToolsSidebar__Item--Selected": "select" === selected
          })}
        >
          <SelectIcon />
        </div>
        <div
          onClick={this.openAdd}
          className={cx("ToolsSidebar__Item", {
            "ToolsSidebar__Item--Selected":
              ["actor", "triggers", "map"].indexOf(selected) > -1
          })}
        >
          <PlusIcon />
          {add && <MenuOverlay onClick={this.closeAdd} />}
          {add && (
            <Menu
              style={{
                left: 30,
                top: 5
              }}
            >
              <MenuItem onClick={this.setTool("actor")}>Actor</MenuItem>
              <MenuItem onClick={this.setTool("triggers")}>Trigger</MenuItem>
              <MenuItem onClick={this.setTool("scene")}>Scene</MenuItem>
            </Menu>
          )}
        </div>
        <div
          onClick={this.setTool("eraser")}
          className={cx("ToolsSidebar__Item", {
            "ToolsSidebar__Item--Selected": "eraser" === selected
          })}
        >
          <EraserIcon />
        </div>
        <div
          onClick={this.setTool("collisions")}
          className={cx("ToolsSidebar__Item", {
            "ToolsSidebar__Item--Selected": "collisions" === selected
          })}
        >
          <BrickIcon />
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    selected: state.tools.selected
  };
}

const mapDispatchToProps = {
  setTool: actions.setTool
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ToolsSidebar);
