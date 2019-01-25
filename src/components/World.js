import React, { Component } from "react";
import { connect } from "react-redux";
import Map from "./Map";
import Connections from "./Connections";
import * as actions from "../actions";

class World extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false,
      hoverX: 0,
      hoverY: 0
    };
  }

  onMouseMove = e => {
    const boundingRect = e.currentTarget.getBoundingClientRect();
    const x = e.pageX + e.currentTarget.scrollLeft - 128;
    const y = e.pageY + e.currentTarget.scrollTop - boundingRect.y - 128;
    this.setState({
      hover: true,
      hoverX: x,
      hoverY: y
    });
  };

  onAddMap = e => {
    const { hoverX, hoverY } = this.state;
    this.props.addMap(hoverX, hoverY);
    this.props.setTool("select");
  };

  render() {
    const { maps, tool, showConnections } = this.props;
    const { hover, hoverX, hoverY } = this.state;

    console.log({ maps });

    if (!maps) {
      return <div />;
    }

    const width =
      Math.max.apply(null, maps.map(map => 40 + map.x + map.width * 8)) + 400;
    const height =
      Math.max.apply(null, maps.map(map => 40 + map.y + map.height * 8)) + 100;

    return (
      <div className="World" onMouseMove={this.onMouseMove}>
        <div
          className="World__Grid"
          style={{ width, height }}
          onClick={() => this.props.selectWorld()}
        />
        <div className="World__Content">
          {maps.map(map => (
            <div>
              MAP
              {false && <Map key={map.id} id={map.id} map={map} />}
            </div>
          ))}
          {showConnections && <Connections maps={maps} />}
          {tool === "map" && hover && (
            <div
              className="World__NewMap"
              onClick={this.onAddMap}
              style={{
                left: hoverX,
                top: hoverY
              }}
            />
          )}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    tool: state.tools.selected,
    maps: state.project && state.project.scenes,
    showConnections: state.project.showConnections
  };
}

const mapDispatchToProps = {
  addMap: actions.addMap,
  setTool: actions.setTool,
  selectWorld: actions.selectWorld
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(World);
