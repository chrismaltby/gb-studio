import React, { Component } from "react";
import cx from "classnames";
import { SelectIcon, BrickIcon, EraserIcon, PlusIcon } from "../library/Icons";
import { Menu, MenuItem, MenuOverlay } from "../library/Menu";
import { connect } from "react-redux";
import * as actions from "../../actions";

class ToolPicker extends Component {
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
    if (e.ctrlKey || e.shiftKey || e.metaKey) {
      return;
    }
    if (e.key === "t") {
      this.setTool("triggers")(e);
    } else if (e.key === "a") {
      this.setTool("actors")(e);
    } else if (e.key === "c") {
      this.setTool("collisions")(e);
    } else if (e.key === "s") {
      this.setTool("scene")(e);
    } else if (e.key === "e") {
      this.setTool("eraser")(e);
    } else if (e.key === "v") {
      this.setTool("select")(e);
    }
  };

  openAdd = () => {
    this.setState({
      add: true
    });
  };

  closeAdd = e => {
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
      <div className="ToolPicker">
        <div
          onClick={this.setTool("select")}
          className={cx("ToolPicker__Item", {
            "ToolPicker__Item--Selected": "select" === selected
          })}
          title="Select (v)"
        >
          <SelectIcon />
        </div>
        <div
          onClick={this.openAdd}
          className={cx("ToolPicker__Item", {
            "ToolPicker__Item--Selected":
              ["actors", "triggers", "map"].indexOf(selected) > -1
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
              <MenuItem onClick={this.setTool("actors")} title="Add Actor (a)">
                Actor
              </MenuItem>
              <MenuItem
                onClick={this.setTool("triggers")}
                title="Add Trigger (t)"
              >
                Trigger
              </MenuItem>
              <MenuItem onClick={this.setTool("scene")} title="Add Scene (s)">
                Scene
              </MenuItem>
            </Menu>
          )}
        </div>
        <div
          onClick={this.setTool("eraser")}
          className={cx("ToolPicker__Item", {
            "ToolPicker__Item--Selected": "eraser" === selected
          })}
          title="Eraser (e)"
        >
          <EraserIcon />
        </div>
        <div
          onClick={this.setTool("collisions")}
          className={cx("ToolPicker__Item", {
            "ToolPicker__Item--Selected": "collisions" === selected
          })}
          title="Collisions (c)"
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
)(ToolPicker);
