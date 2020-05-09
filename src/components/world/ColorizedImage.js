import React, { Component } from "react";
import ColorizedImageWorker from "./ColorizedImage.worker";

const workerPool = [
  new ColorizedImageWorker(),
  new ColorizedImageWorker(),
  new ColorizedImageWorker(),
  new ColorizedImageWorker(),
  new ColorizedImageWorker(),
  new ColorizedImageWorker(),
  new ColorizedImageWorker(),
  new ColorizedImageWorker()  
];

class ColorizedImage extends Component {
  constructor(props) {
    super(props);
    this.canvas = React.createRef();
    this.image = null;
  }

  componentDidMount() {
    const { src } = this.props;
    this.draw(src);
  }

  componentWillReceiveProps(nextProps) {
    const { src } = nextProps;
    if (src !== this.props.src) {
      this.draw(src);
    }
  }

  draw = (src) => {
    const { tiles } = this.props;

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
        const worker = workerPool[Math.floor(workerPool.length * Math.random())];
        var offscreen = this.canvas.current.transferControlToOffscreen();
        worker.postMessage({canvas: offscreen, src, palettes, tiles }, [offscreen]);
    }
  };

  render() {
    const { width, height } = this.props;
    return <canvas ref={this.canvas} width={width} height={height} />;
  }
}

export default ColorizedImage;
