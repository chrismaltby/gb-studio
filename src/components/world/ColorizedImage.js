import React, { Component } from "react";
import ColorizedImageWorker from "./ColorizedImage.worker";

const workerPool = [
  new ColorizedImageWorker(),
  new ColorizedImageWorker(),
  new ColorizedImageWorker(),
  new ColorizedImageWorker(),
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
  }

  componentDidMount() {
    this.draw();
    this.worker.addEventListener("message", this.onWorkerComplete);
  }

  componentWillUnmount() {
    this.worker.removeEventListener("message", this.onWorkerComplete);
  }

  componentDidUpdate(prevProps) {
    const { src, tiles } = this.props;
    if (src !== prevProps.src || tiles !== prevProps.tiles) {
      this.draw();
    }
  }

  draw = (src) => {
    const { src, tiles, width, height } = this.props;

    const palettes = [
      [
        [255, 0, 0],
        [0, 0, 255],
        [0, 255, 0],
        [255, 255, 255],
      ],
      [
        [255, 0, 255],
        [0, 255, 255],
        [255, 255, 0],
        [0, 255, 0],
      ],
    ];

    if (this.canvas && this.canvas.current) {
      this.worker.postMessage({
        src,
        palettes,
        tiles,
        width,
        height,
        id: this.id,
      });
    }
  };

  onWorkerComplete = (e, a, b) => {
    if (this.offscreenCanvas && this.offscreenCtx && e.data.id === this.id) {
      const ctx = this.canvas.current.getContext("2d");
      this.offscreenCtx.transferFromImageBitmap(e.data.canvasImage);
      ctx.drawImage(this.offscreenCanvas, 0, 0);
    }
  };

  render() {
    const { width, height } = this.props;
    return <canvas ref={this.canvas} width={width} height={height} />;
  }
}

export default ColorizedImage;
