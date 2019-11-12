import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import cx from "classnames";
import * as actions from "../../actions";

const SidebarTabs = ({ values, value, onChange, buttons }) => (
  <div className="SidebarTabs">
    <div className="SidebarTabs__Container">
      {Object.keys(values).map((key, index) => (
        <div
          key={key}
          className={cx("SidebarTabs__Tab", {
            "SidebarTabs__Tab--Active": value ? key === value : index === 0
          })}
          onClick={() => onChange(key)}
        >
          {values[key]}
        </div>
      ))}
    </div>
    <div className="SidebarTabs__FluidSpacer" />
    {buttons}
  </div>
);

SidebarTabs.propTypes = {
  value: PropTypes.string,
  values: PropTypes.objectOf(PropTypes.string).isRequired,
  onChange: PropTypes.func,
  buttons: PropTypes.node
};

SidebarTabs.defaultProps = {
  buttons: null,
  value: null,
  onChange: () => {}
};

const SidebarHeading = ({ title, buttons }) => (
  <div className="SidebarHeading">
    {title}
    <div className="SidebarHeading__FluidSpacer" />
    {buttons}
  </div>
);

SidebarHeading.propTypes = {
  title: PropTypes.string,
  buttons: PropTypes.node
};

SidebarHeading.defaultProps = {
  title: "",
  buttons: null
};

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
      dragging: true
    });
  };

  onMouseUp = () => {
    const { dragging } = this.state;
    if (dragging) {
      this.setState({
        dragging: false
      });
    }
  };

  onMouseMove = event => {
    const { resizeWorldSidebar } = this.props;
    const { dragging } = this.state;
    if (dragging) {
      resizeWorldSidebar(window.innerWidth - event.pageX);
    }
  };

  render() {
    const { width, children, onMouseDown } = this.props;
    return (
      <div
        className={cx("Sidebar", {
          "Sidebar--Open": true,
          "Sidebar--TwoColumn": width >= 500
        })}
        onMouseDown={onMouseDown}
      >
        <div
          ref={this.dragHandler}
          className="Sidebar__DragHandle"
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
        />
        <div style={{ width }} className="Sidebar__Content">
          {children}
        </div>
      </div>
    );
  }
}

Sidebar.propTypes = {
  width: PropTypes.number.isRequired,
  resizeWorldSidebar: PropTypes.func.isRequired,
  children: PropTypes.node,
  onMouseDown: PropTypes.func
};

Sidebar.defaultProps = {
  children: null,
  onMouseDown: undefined
};

function mapStateToProps(state) {
  const { worldSidebarWidth: width } = state.settings;
  return {
    width
  };
}

const mapDispatchToProps = {
  resizeWorldSidebar: actions.resizeWorldSidebar
};

export default connect(mapStateToProps, mapDispatchToProps)(Sidebar);

export { SidebarColumn, SidebarHeading, SidebarTabs };
