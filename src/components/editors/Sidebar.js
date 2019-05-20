import React, { Component } from "react";
import { connect } from "react-redux";
import cx from "classnames";
import * as actions from "../../actions";

const SidebarHeading = ({ title, buttons }) => (
  <div className="SidebarHeading">
    {title}
    <div className="SidebarHeading__FluidSpacer" />
    {buttons}
  </div>
);

const SidebarColumn = props => <div className="SidebarColumn" {...props} />;

class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.state = { dragging: false };
    this.dragHandler = React.createRef();
  }

  componentDidMount() {
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.onMouseUp);
  }

  componentWillUnmount() {
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);
  }

  onMouseDown = () => {
    this.setState({
      ...this.state,
      dragging: true
    });
  };

  onMouseUp = () => {
    if (this.state.dragging) {
      this.setState({
        ...this.state,
        dragging: false
      });
    }
  };

  onMouseMove = event => {
    if (this.state.dragging) {
      this.props.resizeSidebar(window.innerWidth - event.pageX);
    }
  };

  render() {
    const { editor, children } = this.props;
    const editorSidebarStyle = {
      width: editor.sidebarWidth,
      right: -editor.sidebarWidth
    };
    return (
      <div
        className={cx("Sidebar", {
          "Sidebar--Open": true,
          "Sidebar--TwoColumn": editor.sidebarWidth >= 600
        })}
      >
        <div
          ref={this.dragHandler}
          className="Sidebar__DragHandle"
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
        />
        <div style={editorSidebarStyle} className="Sidebar__Content">
          {children}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    editor: state.editor
  };
}

const mapDispatchToProps = {
  resizeSidebar: actions.resizeSidebar
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Sidebar);

export { SidebarColumn, SidebarHeading };
