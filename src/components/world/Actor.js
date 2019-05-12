import React, { Component } from "react";
import cx from "classnames";
import SpriteSheetCanvas from "./SpriteSheetCanvas";

class Actor extends Component {
  render() {
    const { x, y, actor = {}, selected } = this.props;
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

export default Actor;
