import React, { Component } from "react";
import { connect } from "react-redux";

class ImageViewer extends Component {
  render() {
    const { section, worldId, image } = this.props;
    return (
      <div className="ImageViewer">
        <div className="ImageViewer__Content">
          {image &&
            <div className="ImageViewer__Image">
              <img
                alt=""
                src={`${process.env
                  .REACT_APP_API_ENDPOINT}/assets/${worldId}/${section}/${image}`}
              />
            </div>}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { id, section } = state.navigation;
  const files =
    section === "images" ? state.world.images : state.world.spriteSheets;
  const image = files.find(file => file.id === id);
  return {
    section,
    worldId: state.world.id,
    image: image && image.filename
  };
}

export default connect(mapStateToProps)(ImageViewer);
