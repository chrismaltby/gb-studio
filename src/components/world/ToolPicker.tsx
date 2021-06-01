import React, { Component } from "react";
import cx from "classnames";
import { connect } from "react-redux";
import {
  SelectIcon,
  BrickIcon,
  EraserIcon,
  PlusIcon,
  PaintIcon,
} from "ui/icons/Icons";
import { Menu, MenuItem, MenuOverlay } from "../library/Menu";
import l10n from "lib/helpers/l10n";
import { Tool } from "store/features/editor/editorState";
import editorActions from "store/features/editor/editorActions";
import { RootState } from "store/configureStore";

type ToolPickerProps = {
  selected: Tool;
};

type ToolPickerState = {
  add: boolean;
};

interface ToolPickerActionProps {
  setTool: (args: { tool: Tool }) => void;
}

class ToolPicker extends Component<
  ToolPickerProps & ToolPickerActionProps,
  ToolPickerState
> {
  state = {
    add: false,
  };

  componentDidMount() {
    window.addEventListener("keydown", this.onKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
  }

  onKeyDown = (e: KeyboardEvent) => {
    if (e.target && (e.target as Node).nodeName !== "BODY") {
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
    } else if (e.code === "KeyZ") {
      this.setTool("colors")(e);
    } else if (e.code === "KeyS") {
      this.setTool("scene")(e);
    } else if (e.code === "KeyE") {
      this.setTool("eraser")(e);
    } else if (e.code === "KeyV") {
      this.setTool("select")(e);
    } else if (e.code === "Escape") {
      this.setTool("select")(e);
    }
  };

  isAddSelected = () => {
    const { selected } = this.props;
    return ["actors", "triggers", "scene"].indexOf(selected) > -1;
  };

  openAdd = () => {
    this.setState({
      add: true,
    });
  };

  closeAdd = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
    this.setState({
      add: false,
    });
  };

  setTool =
    (tool: Tool) =>
    (e: React.MouseEvent<HTMLDivElement, MouseEvent> | KeyboardEvent) => {
      e.stopPropagation();
      const { setTool } = this.props;
      setTool({ tool });
      this.setState({
        add: false,
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
            "ToolPicker__Item--Selected": selected === "select",
          })}
          title={`${l10n("TOOL_SELECT_LABEL")} (v)`}
        >
          <SelectIcon />
        </div>
        <div
          onClick={this.openAdd}
          className={cx("ToolPicker__Item", {
            "ToolPicker__Item--Selected": this.isAddSelected(),
          })}
          title={`${l10n("TOOL_ADD_LABEL")}`}
        >
          <PlusIcon />
          {add && <MenuOverlay onClick={this.closeAdd} />}
          {add && (
            <Menu
              style={{
                left: 30,
                top: 5,
              }}
              up={false}
              right={false}
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
            "ToolPicker__Item--Selected": selected === "eraser",
          })}
          title={`${l10n("TOOL_ERASER_LABEL")} (e)`}
        >
          <EraserIcon />
        </div>
        <div
          onClick={this.setTool("collisions")}
          className={cx("ToolPicker__Item", {
            "ToolPicker__Item--Selected": selected === "collisions",
          })}
          title={`${l10n("TOOL_COLLISIONS_LABEL")} (c)`}
        >
          <BrickIcon />
        </div>
        <div
          onClick={this.setTool("colors")}
          className={cx("ToolPicker__Item", {
            "ToolPicker__Item--Selected": selected === "colors",
          })}
          title={`${l10n("TOOL_COLORS_LABEL")} (z)`}
        >
          <PaintIcon />
        </div>
      </div>
    );
  }
}

function mapStateToProps(state: RootState): ToolPickerProps {
  return {
    selected: state.editor.tool,
  };
}

const mapDispatchToProps = {
  setTool: editorActions.setTool,
};

export default connect(mapStateToProps, mapDispatchToProps)(ToolPicker);
