import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import debounce from "lodash/debounce";
import { assetFilename } from "../../lib/helpers/gbstudio";
// eslint-disable-next-line import/no-unresolved
import SpriteSheetCanasWorker from "./SpriteSheetCanvas.worker";
import { DMG_PALETTE } from "../../consts";
import { PaletteShape } from "../../reducers/stateShape";
import { spriteSheetSelectors } from "../../store/features/entities/entitiesSlice";

const workerPool = [];
for(let i=0; i<navigator.hardwareConcurrency; i++) {
  workerPool.push(new SpriteSheetCanasWorker())
}

let id = 0;

const SPRITE_SIZE = 16;

class SpriteSheetCanvas extends Component {
  constructor(props) {
    super(props);
    this.canvas = React.createRef();
    this.image = null;
    this.offscreen = false;
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCtx = this.offscreenCanvas.getContext("bitmaprenderer");    
    this.id = id++;
    this.worker = workerPool[Math.floor(workerPool.length * Math.random())];    
    this.debouncedDraw = debounce(this.draw, 16);
  }

  componentDidMount() {
    this.debouncedDraw();
    this.worker.addEventListener("message", this.onWorkerComplete);
  }

  shouldComponentUpdate(nextProps) {
    const { direction, frame, spriteSheet, palette } = this.props;
    return (
      nextProps.direction !== direction ||
      nextProps.frame !== frame ||
      spriteSheet !== nextProps.spriteSheet || 
      palette !== nextProps.palette
    );
  }

  componentDidUpdate(prevProps) {
    const { direction, frame, palette } = prevProps;
    const {
      projectRoot,
      spriteSheet,
      direction: nextDirection,
      frame: nextFrame,
      palette: nextPalette
    } = this.props;
    const newSrc = this.imageSrc(projectRoot, spriteSheet);
    if (
      newSrc !== this.src ||
      direction !== nextDirection ||
      frame !== nextFrame ||
      palette !== nextPalette
    ) {
      this.debouncedDraw();
    }
  }

  componentWillUnmount() {
    this.worker.removeEventListener("message", this.onWorkerComplete);
  }

  draw = () => {
    const { projectRoot, spriteSheet = {}, direction = "down", frame, palette } = this.props;
    if (this.canvas && this.canvas.current && spriteSheet) {
      this.worker.postMessage({
        src: this.imageSrc(projectRoot, spriteSheet),
        width: SPRITE_SIZE,
        height: SPRITE_SIZE,
        id: this.id,
        numFrames: spriteSheet.numFrames,
        type: spriteSheet.type,
        direction,
        frame,
        palette: palette.colors
      });
    }
  };

  onWorkerComplete = (e, a, b) => {
    if (this.offscreenCanvas && this.offscreenCtx && e.data.id === this.id) {
      const ctx = this.canvas.current.getContext("2d");
      this.offscreenCtx.transferFromImageBitmap(e.data.canvasImage);
      ctx.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
      ctx.drawImage(this.offscreenCanvas, 0, 0);
    }
  };

  imageSrc = (projectRoot, spriteSheet) => {
    return (
      spriteSheet &&
      `file://${assetFilename(projectRoot, "sprites", spriteSheet)}?_v=${
        spriteSheet._v
      }`
    );
  };

  render() {
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
  }),
  palette: PaletteShape
};

SpriteSheetCanvas.defaultProps = {
  direction: "down",
  frame: 0,
  spriteSheet: null,
  palette: DMG_PALETTE
};

function mapStateToProps(state, props) {
  const spriteSheet = spriteSheetSelectors.selectById(state.project.present.entities, props.spriteSheetId);
  return {
    spriteSheet,
    projectRoot: state.document && state.document.root
  };
}

export default connect(mapStateToProps)(SpriteSheetCanvas);
