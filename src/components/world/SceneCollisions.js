import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  COLLISION_TOP,
  COLLISION_ALL,
  COLLISION_BOTTOM,
  COLLISION_LEFT,
  COLLISION_RIGHT,
  TILE_PROP_LADDER,
} from "../../consts";

const TILE_SIZE = 8;

class SceneCollisions extends Component {
  constructor(props) {
    super(props);
    this.canvas = React.createRef();
  }

  componentDidMount() {
    this.draw();
  }

  componentDidUpdate() {
    this.draw();
  }

  draw = () => {
    const { collisions, width, height } = this.props;
    if (this.canvas.current) {
      // eslint-disable-next-line no-self-assign
      this.canvas.current.width = this.canvas.current.width; // Clear canvas
      const ctx = this.canvas.current.getContext("2d");

      for (let yi = 0; yi < height; yi++) {
        for (let xi = 0; xi < width; xi++) {
          const collisionIndex = width * yi + xi;
          const tile = collisions[collisionIndex];
          if ((tile & COLLISION_ALL) === COLLISION_ALL) {
            ctx.fillStyle = "rgba(250,40,40,0.6)";
            ctx.fillRect(xi * TILE_SIZE, yi * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          } else if (tile !== 0) {
            if (tile & COLLISION_TOP) {
              ctx.fillStyle = "rgba(40,40,250,0.6)";
              ctx.fillRect(
                xi * TILE_SIZE,
                yi * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE * 0.4
              );
            }
            if (tile & COLLISION_BOTTOM) {
              ctx.fillStyle = "rgba(255,250,40,0.6)";
              ctx.fillRect(
                xi * TILE_SIZE,
                (yi + 0.6) * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE * 0.4
              );
            }
            if (tile & COLLISION_LEFT) {
              ctx.fillStyle = "rgba(250,40,250,0.6)";
              ctx.fillRect(
                xi * TILE_SIZE,
                yi * TILE_SIZE,
                TILE_SIZE * 0.4,
                TILE_SIZE
              );
            }
            if (tile & COLLISION_RIGHT) {
              ctx.fillStyle = "rgba(40,250,250,0.6)";
              ctx.fillRect(
                (xi + 0.6) * TILE_SIZE,
                yi * TILE_SIZE,
                TILE_SIZE * 0.4,
                TILE_SIZE
              );
            }
          }
          if (tile & TILE_PROP_LADDER) {
            ctx.fillStyle = "rgba(0,128,0,0.6)";
            ctx.fillRect(
              (xi + 0.0) * TILE_SIZE,
              yi * TILE_SIZE,
              TILE_SIZE * 0.2,
              TILE_SIZE
            );
            ctx.fillRect(
              (xi + 0.8) * TILE_SIZE,
              yi * TILE_SIZE,
              TILE_SIZE * 0.2,
              TILE_SIZE
            );
            ctx.fillRect(
              xi * TILE_SIZE,
              (yi + 0.4) * TILE_SIZE,
              TILE_SIZE,
              TILE_SIZE * 0.2
            );
          }
        }
      }
    }
  };

  render() {
    const { width, height } = this.props;
    return (
      <div className="SceneCollisions">
        <canvas
          ref={this.canvas}
          width={width * TILE_SIZE}
          height={height * TILE_SIZE}
        />
      </div>
    );
  }
}

SceneCollisions.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  collisions: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default SceneCollisions;
