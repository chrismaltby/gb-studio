import React, { Component } from "react";
import { connect } from "react-redux";

class ImageSelect extends Component {
  render() {
    const { images, dispatch, ...rest } = this.props;
    return (
      <select {...rest}>
        <option>None</option>
        {images.map(image => (
          <option key={image.id} value={image.id}>
            {image.name}
          </option>
        ))}
      </select>
    );
  }
}

function mapStateToProps(state) {
  return {
    images: (state.project.present && state.project.present.images) || []
  };
}

export default connect(mapStateToProps)(ImageSelect);
