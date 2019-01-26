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
    this.scrollRef = React.createRef();
  }

  // componentDidUpdate(prevProps) {
  //   if (this.props.zoom !== prevProps.zoom) {
  //     this.onZoomChange(prevProps.zoom, this.props.zoom);
  //   }
  // }

  onMouseMove = e => {
    const { zoomRatio } = this.props;
    const boundingRect = e.currentTarget.getBoundingClientRect();
    const x = e.pageX + e.currentTarget.scrollLeft - 0;
    const y = e.pageY + e.currentTarget.scrollTop - boundingRect.y - 0;
    this.setState({
      hover: true,
      hoverX: x / zoomRatio - 128,
      hoverY: y / zoomRatio - 128
    });
  };

  onAddMap = e => {
    const { hoverX, hoverY } = this.state;
    this.props.addMap(hoverX, hoverY);
    this.props.setTool("select");
  };

  // onZoomChange = (prevZoom, newZoom) => {

  //   const prevRatio = prevZoom / 100;
  //   const newRatio = newZoom / 100;
  //   const scrollEl = this.scrollRef.current;
  //   const scrollWidth = newZoom * (scrollEl.clientWidth / prevRatio);
  //   const scrollHeight = newZoom * (scrollEl.clientHeight / prevRatio);
  //   const scrollLeft = scrollEl.scrollLeft;
  //   const scrollTop = scrollEl.scrollTop;
  //   const centerX = scrollEl.scrollWidth;
  //   const centerY = scrollEl.scrollHeight;
  //   const oldScreenWidthRatio = scrollEl.clientWidth / scrollEl.scrollWidth;
  //   const oldScreenHeightRatio = scrollEl.clientHeight / scrollEl.scrollHeight;
  //   scrollEl.scrollTo({
  //     top: 0,
  //     left: 0
  //     behavior: "smooth"
  //   });

  // };

  render() {
    const { maps, tool, showConnections, zoomRatio } = this.props;
    const { hover, hoverX, hoverY } = this.state;

    if (!maps) {
      return <div />;
    }

    // const mapsWidth =
    //   zoomRatio * Math.max.apply(null, maps.map(map => map.x + map.width * 8));
    // const mapsHeight =
    //   Math.max.apply(null, maps.map(map => 40 + map.y + map.height * 8)) + 100;

    const mapsWidth =
      Math.max.apply(null, maps.map(map => map.x + map.width * 8)) + 100;
    const mapsHeight =
      Math.max.apply(null, maps.map(map => 20 + map.y + map.height * 8)) + 100;

    const width = Math.max((window.innerWidth - 300) / zoomRatio, mapsWidth);
    const height = Math.max((window.innerHeight - 35) / zoomRatio, mapsHeight);

    return (
      <div
        ref={this.scrollRef}
        className="World"
        onMouseMove={this.onMouseMove}
      >
        <div
          className="World__Content"
          style={{ transform: `scale(${zoomRatio})` }}
        >
          <div
            className="World__Grid"
            style={{ width, height }}
            onClick={this.props.selectWorld}
          />
          {maps.map(map => (
            <div key={map.id}>
              <Map id={map.id} map={map} />
            </div>
          ))}
          {showConnections && <Connections maps={maps} zoomRatio={zoomRatio} />}
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
    zoomRatio:
      ((state.project &&
        state.project.settings &&
        state.project.settings.zoom) ||
        100) / 100,
    showConnections:
      state.project.settings && state.project.settings.showConnections
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
