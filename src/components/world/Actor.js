import React, { Component } from "react";
import { connect } from "react-redux";

class Actor extends Component {
  constructor(props) {
    super(props);
    this.canvas = React.createRef();
  }
  componentWillMount() {
    this.loadImage(this.props);
  }

  componentWillReceiveProps(nextProps) {
    const newSrc = this.imageSrc(nextProps);
    const newSprite = nextProps.sprite;
    if (
      newSrc !== this.src ||
      newSprite !== this.sprite ||
      this.props.direction === nextProps.direction
    ) {
      this.loadImage(nextProps);
    }
  }

  componentDidUpdate() {
    // console.log("UPDATE", this.canvas.current);
    // if (this.imgLoaded) {
    //   this.draw();
    // }
  }

  imageSrc = props => {
    return `${props.projectRoot}/assets/sprites/${props.spriteSheet &&
      props.spriteSheet.filename}`;
  };

  // 'url("/Users/cmaltby/Projects/Untitled%20GB%20Game/assets/maps/mabe_house.png")'
  // `url("${projectRoot}/assets/maps/${image}")`

  loadImage = props => {
    this.src = this.imageSrc(props);
    this.imgLoaded = false;
    this.img = new Image();
    this.img.crossOrigin = "anonymous";
    this.img.onload = this.draw;
    this.img.src = this.src;
    this.sprite = this.props.sprite;
  };

  draw = () => {
    const { spriteSheet = {}, actor } = this.props;
    const { direction = "down" } = actor;
    this.imgLoaded = true;

    if (this.canvas.current) {
      const ctx = this.canvas.current.getContext("2d");
      const tmpCanvas = document.createElement("canvas");
      const tmpCtx = tmpCanvas.getContext("2d");

      const directionOffset =
        direction === "up"
          ? 1
          : direction === "left" || direction === "right"
            ? 2
            : 0;

      const spriteOffset =
        spriteSheet.type === "static"
          ? 0
          : spriteSheet.type === "actor"
            ? directionOffset
            : spriteSheet.type === "actor_animated"
              ? directionOffset * 2
              : 0;

      tmpCanvas.width = tmpCanvas.height = 16;
      if (direction === "left" && spriteSheet.type !== "static") {
        tmpCtx.translate(tmpCanvas.width, 0);
        tmpCtx.scale(-1, 1);
      }
      tmpCtx.drawImage(this.img, spriteOffset * -16, 0);

      // Remove background colour
      let imgData = tmpCtx.getImageData(0, 0, 16, 16);

      for (let i = 0; i < imgData.data.length; i += 4) {
        if (imgData.data[i + 1] === 255) {
          // Full green
          imgData.data[i] = imgData.data[i + 1] = imgData.data[
            i + 2
          ] = imgData.data[i + 3] = 0;
        }
      }

      ctx.putImageData(imgData, 0, 0);
    }
  };

  render() {
    const { x, y } = this.props;
    return (
      <div
        className="Actor"
        style={{
          top: y * 8,
          left: x * 8
        }}
      >
        <canvas ref={this.canvas} width={16} height={16} />
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  const spriteSheet =
    props.actor &&
    state.project.present.spriteSheets.find(
      spriteSheet => spriteSheet.id === props.actor.spriteSheetId
    );
  return {
    projectRoot: state.document && state.document.root,
    spriteSheet
  };
}

export default connect(mapStateToProps)(Actor);
