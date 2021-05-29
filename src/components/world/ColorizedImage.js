import React, { Component } from "react";
import PropTypes from "prop-types";
import debounce from "lodash/debounce";
// eslint-disable-next-line import/no-unresolved
import ColorizedImageWorker from "./ColorizedImage.worker";
import { PaletteShape } from "store/stateShape";
import { DMG_PALETTE } from "../../consts";

const workerPool = [];
for (let i = 0; i < navigator.hardwareConcurrency; i++) {
  workerPool.push(new ColorizedImageWorker());
}

const dmgPalettes = [
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
];

let id = 0;

class ColorizedImage extends Component {
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

  componentDidUpdate(prevProps) {
    const { src, tiles, palettes } = this.props;
    if (
      src !== prevProps.src ||
      tiles !== prevProps.tiles ||
      palettes !== prevProps.palettes
    ) {
      this.debouncedDraw();
    }
  }

  componentWillUnmount() {
    this.worker.removeEventListener("message", this.onWorkerComplete);
  }

  draw = () => {
    const { src, tiles = [], width, height, palettes = [] } = this.props;

    if (this.canvas && this.canvas.current) {
      this.worker.postMessage({
        src,
        palettes: palettes.map((p) => p.colors),
        tiles,
        width,
        height,
        id: this.id,
      });
    }
  };

  onWorkerComplete = (e) => {
    if (this.offscreenCanvas && this.offscreenCtx && e.data.id === this.id) {
      const ctx = this.canvas.current.getContext("2d");
      this.offscreenCtx.transferFromImageBitmap(e.data.canvasImage);
      this.canvas.current.width = e.data.width;
      this.canvas.current.height = e.data.height;
      ctx.drawImage(this.offscreenCanvas, 0, 0);
    }
  };

  render() {
    const { width, height } = this.props;
    return <canvas ref={this.canvas} width={width} height={height} />;
  }
}

ColorizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  tiles: PropTypes.arrayOf(PropTypes.number),
  palettes: PropTypes.arrayOf(PaletteShape),
};

ColorizedImage.defaultProps = {
  tiles: [],
  palettes: dmgPalettes,
};

export default ColorizedImage;
