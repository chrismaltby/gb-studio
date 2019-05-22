import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import SpriteSheetCanvas from "./SpriteSheetCanvas";

class Actor extends Component {
  render() {
    const { x, y, actor, selected } = this.props;
    return (
      <div
        className={cx("Actor", { "Actor--Selected": selected })}
        style={{
          top: y * 8,
          left: x * 8
        }}
      >
        <SpriteSheetCanvas
          spriteSheetId={actor.spriteSheetId}
          direction={actor.direction}
          frame={actor.movementType === "static" && actor.frame}
        />
      </div>
    );
  }
}

Actor.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  actor: PropTypes.shape({
    spriteSheetId: PropTypes.string,
    direction: PropTypes.string,
    movementType: PropTypes.string,
    frame: PropTypes.number
  }),
  selected: PropTypes.bool
};

Actor.defaultProps = {
  actor: {},
  selected: false
};

export default Actor;
