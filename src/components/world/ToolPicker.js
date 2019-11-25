import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { connect } from "react-redux";
import { SelectIcon, BrickIcon, EraserIcon, PlusIcon } from "../library/Icons";
import { Menu, MenuItem, MenuOverlay } from "../library/Menu";
import l10n from "../../lib/helpers/l10n";
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
    if (e.code === "KeyT") {
      this.setTool("triggers")(e);
    } else if (e.code === "KeyA") {
      this.setTool("actors")(e);
    } else if (e.code === "KeyC") {
      this.setTool("collisions")(e);
    } else if (e.code === "KeyS") {
      this.setTool("scene")(e);
    } else if (e.code === "KeyE") {
      this.setTool("eraser")(e);
    } else if (e.code === "KeyV") {
      this.setTool("select")(e);
    } else if (e.code === "Escape") {
      if (this.isAddSelected()) {
        this.setTool("select")(e);
      }
    }
  };

  isAddSelected = () => {
    const { selected } = this.props;
    return ["actors", "triggers", "scene"].indexOf(selected) > -1;
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
    const { setTool } = this.props;
    setTool(id);
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
            "ToolPicker__Item--Selected": selected === "select"
          })}
          title={`${l10n("TOOL_SELECT_LABEL")} (v)`}
        >
          <SelectIcon />
        </div>
        <div
          onClick={this.openAdd}
          className={cx("ToolPicker__Item", {
            "ToolPicker__Item--Selected": this.isAddSelected()
          })}
          title={`${l10n("TOOL_ADD_LABEL")}`}
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
              <MenuItem
                onClick={this.setTool("actors")}
                title={`${l10n("TOOL_ADD_ACTOR_LABEL")} (a)`}
              >
                {l10n("ACTOR")}
              </MenuItem>
              <MenuItem
                onClick={this.setTool("triggers")}
                title={`${l10n("TOOL_ADD_TRIGGER_LABEL")} (t)`}
              >
                {l10n("TRIGGER")}
              </MenuItem>
              <MenuItem
                onClick={this.setTool("scene")}
                title={`${l10n("TOOL_ADD_SCENE_LABEL")} (s)`}
              >
                {l10n("SCENE")}
              </MenuItem>
            </Menu>
          )}
        </div>
        <div
          onClick={this.setTool("eraser")}
          className={cx("ToolPicker__Item", {
            "ToolPicker__Item--Selected": selected === "eraser"
          })}
          title={`${l10n("TOOL_ERASER_LABEL")} (e)`}
        >
          <EraserIcon />
        </div>
        <div
          onClick={this.setTool("collisions")}
          className={cx("ToolPicker__Item", {
            "ToolPicker__Item--Selected": selected === "collisions"
          })}
          title={`${l10n("TOOL_COLLISIONS_LABEL")} (c)`}
        >
          <BrickIcon />
        </div>
      </div>
    );
  }
}

ToolPicker.propTypes = {
  selected: PropTypes.oneOf([
    "triggers",
    "actors",
    "collisions",
    "scene",
    "eraser",
    "select"
  ]).isRequired,
  setTool: PropTypes.func.isRequired
};

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
