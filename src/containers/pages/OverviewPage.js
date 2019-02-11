import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";

class OverviewPage extends Component {
  setSection = section => e => {
    this.props.setSection(section);
  };

  render() {
    const { name = "", numScenes = 0, numSprites = 0 } = this.props;
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          //   background: "purple",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden"
        }}
      >
        <div style={{ padding: 40 }}>
          <h1 style={{ margin: 0 }}>{name}</h1>
          <p>
            {numScenes} {numScenes === 1 ? "Scene" : "Scenes"}
          </p>
          <p style={{ marginBottom: 0 }}>
            {numSprites} {numSprites === 1 ? "Sprite" : "Sprites"}
          </p>
        </div>
        <div
          style={{
            width: "100%",
            flexGrow: 1,
            background: "var(--sidebar-bg-color)",
            padding: 40
          }}
        >
          <div
            style={{
              float: "left",
              background: "#ccc",
              width: 200,
              height: 150,
              marginRight: 20,
              marginBottom: 20,
              borderRadius: 4,
              display: "flex",
              justifyContent: "center",
              alignItems: " center",
              fontSize: 13,
              background:
                "linear-gradient(to bottom, #fefdfe 0%, #f1f1f1 100%)",
              border: "1px solid #dfdede",
              boxShadow: "0px 1px #c5c5c5",
              padding: "0px 8px"
            }}
            onClick={this.setSection("world")}
          >
            Create Your World
          </div>
          <div
            style={{
              float: "left",
              background: "#ccc",
              width: 200,
              height: 150,
              marginRight: 20,
              marginBottom: 20,
              borderRadius: 4,
              display: "flex",
              justifyContent: "center",
              alignItems: " center",
              fontSize: 13,
              background:
                "linear-gradient(to bottom, #fefdfe 0%, #f1f1f1 100%)",
              border: "1px solid #dfdede",
              boxShadow: "0px 1px #c5c5c5",
              padding: "0px 8px"
            }}
            onClick={this.setSection("sprites")}
          >
            Manage Sprites
          </div>
          <div
            style={{
              float: "left",
              background: "#ccc",
              width: 200,
              height: 150,
              marginRight: 20,
              marginBottom: 20,
              borderRadius: 4,
              display: "flex",
              justifyContent: "center",
              alignItems: " center",
              fontSize: 13,
              background:
                "linear-gradient(to bottom, #fefdfe 0%, #f1f1f1 100%)",
              border: "1px solid #dfdede",
              boxShadow: "0px 1px #c5c5c5",
              padding: "0px 8px"
            }}
            onClick={this.setSection("backgrounds")}
          >
            Manage Backgrounds
          </div>
          <div
            style={{
              float: "left",
              background: "#ccc",
              width: 200,
              height: 150,
              marginRight: 20,
              marginBottom: 20,
              borderRadius: 4,
              display: "flex",
              justifyContent: "center",
              alignItems: " center",

              fontSize: 13,
              background:
                "linear-gradient(to bottom, #fefdfe 0%, #f1f1f1 100%)",
              border: "1px solid #dfdede",
              boxShadow: "0px 1px #c5c5c5",
              padding: "0px 8px"
            }}
            onClick={this.setSection("script")}
          >
            Script Review
          </div>
          <div
            style={{
              float: "left",
              background: "#ccc",
              width: 200,
              height: 150,
              marginRight: 20,
              marginBottom: 20,
              borderRadius: 4,
              display: "flex",
              justifyContent: "center",
              alignItems: " center",

              fontSize: 13,
              background:
                "linear-gradient(to bottom, #fefdfe 0%, #f1f1f1 100%)",
              border: "1px solid #dfdede",
              boxShadow: "0px 1px #c5c5c5",
              padding: "0px 8px"
            }}
            onClick={this.setSection("build")}
          >
            Build &amp; Run
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  console.log(state.project);
  return {
    name: state.project && state.project.name,
    numScenes:
      state.project && state.project.scenes && state.project.scenes.length,
    numSprites:
      state.project &&
      state.project.spriteSheets &&
      state.project.spriteSheets.length
  };
}

const mapDispatchToProps = {
  editProject: actions.editProject,
  setSection: actions.setSection
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(OverviewPage);
