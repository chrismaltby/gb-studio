import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { directionToFrame, assetFilename } from "../../lib/helpers/gbstudio";

const imageCache = {};

const SPRITE_SIZE = 16;

class SpriteSheetCanvas extends Component {
  constructor(props) {
    super(props);
    this.canvas = React.createRef();
  }

  componentDidMount() {
    const { projectRoot, spriteSheet } = this.props;
    this.loadImage(projectRoot, spriteSheet);
    // console.log("new spritesheetcanvas");
  }

  componentWillReceiveProps(nextProps) {
    const { direction, frame } = this.props;
    const {
      projectRoot,
      spriteSheet,
      direction: nextDirection,
      frame: nextFrame
    } = nextProps;
    const newSrc = this.imageSrc(projectRoot, spriteSheet);
    if (
      newSrc !== this.src ||
      direction !== nextDirection ||
      frame !== nextFrame
    ) {
      this.loadImage(projectRoot, spriteSheet);
    }
  }

  shouldComponentUpdate(nextProps) {
    const { direction, frame, spriteSheet } = this.props;
    return (
      nextProps.direction !== direction ||
      nextProps.frame !== frame ||
      spriteSheet === nextProps.spriteSheet
    );
  }

  imageSrc = (projectRoot, spriteSheet) => {
    return (
      spriteSheet &&
      `${assetFilename(projectRoot, "sprites", spriteSheet)}?_v=${
        spriteSheet._v
      }`
    );
  };

  loadImage = (projectRoot, spriteSheet) => {
    if (!spriteSheet) {
      if (this.canvas.current) {
        this.canvas.current.width = this.canvas.current.width;
      }
    } else {
      this.src = this.imageSrc(projectRoot, spriteSheet);
      if (imageCache[this.src]) {
        this.img = imageCache[this.src];
        requestAnimationFrame(this.draw);
      } else {
        this.imgLoaded = false;
        this.img = new Image();
        this.img.crossOrigin = "anonymous";
        this.img.onload = this.draw;
        this.img.src = this.src;
      }
    }
  };

  draw = () => {
    const { spriteSheet = {}, direction = "down", frame } = this.props;
    this.imgLoaded = true;

    if (!imageCache[this.src]) {
      imageCache[this.src] = this.img;
    }

    if (this.canvas.current) {
      const ctx = this.canvas.current.getContext("2d");
      const tmpCanvas = document.createElement("canvas");
      const tmpCtx = tmpCanvas.getContext("2d");

      const directionFrame = directionToFrame(direction, spriteSheet.numFrames);
      const spriteOffset = directionFrame + (frame || 0);

      tmpCanvas.width = SPRITE_SIZE;
      tmpCanvas.height = SPRITE_SIZE;
      if (
        direction === "left" &&
        (spriteSheet.type === "actor" || spriteSheet.type === "actor_animated")
      ) {
        tmpCtx.translate(tmpCanvas.width, 0);
        tmpCtx.scale(-1, 1);
      }
      tmpCtx.drawImage(this.img, spriteOffset * -SPRITE_SIZE, 0);

      // console.log("spriteOffset", spriteOffset);

      // Remove background colour
      const imgData = tmpCtx.getImageData(0, 0, SPRITE_SIZE, SPRITE_SIZE);
      for (let i = 0; i < imgData.data.length; i += 4) {
        // Full green
        if (imgData.data[i + 1] === 255) {
          imgData.data[i + 3] = 0;
        }
      }

      ctx.putImageData(imgData, 0, 0);
    }
  };

  render() {
    // console.log("Render: SpriteSheetCanvas");
    return (
      <canvas ref={this.canvas} width={SPRITE_SIZE} height={SPRITE_SIZE} />
    );
  }
}

SpriteSheetCanvas.propTypes = {
  projectRoot: PropTypes.string.isRequired,
  direction: PropTypes.string,
  frame: PropTypes.number,
  spriteSheet: PropTypes.shape({
    filename: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    _v: PropTypes.number
  })
};

SpriteSheetCanvas.defaultProps = {
  direction: "down",
  frame: 0,
  spriteSheet: null
};

function mapStateToProps(state, props) {
  const spriteSheet =
    state.entities.present.entities.spriteSheets[props.spriteSheetId];
  return {
    spriteSheet,
    projectRoot: state.document && state.document.root
  };
}

export default connect(mapStateToProps)(SpriteSheetCanvas);
