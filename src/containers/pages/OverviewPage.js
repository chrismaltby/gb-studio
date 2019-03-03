import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import Button from "../../components/library/Button";
import PageHeader from "../../components/library/PageHeader";
import PageContent from "../../components/library/PageContent";
import { PencilIcon } from "../../components/library/Icons";

class OverviewPage extends Component {
  constructor() {
    super();
    this.state = {
      editingName: false,
      updatedName: "Untitled GB Game"
    };
  }

  setSection = section => e => {
    this.props.setSection(section);
  };

  onStartEdit = () => {
    this.setState({
      editingName: true,
      updatedName: this.props.name
    });
  };

  onEditName = e => {
    this.setState({
      updatedName: e.currentTarget.value
    });
  };

  onEnter = e => {
    if (e.key === "Enter") {
      this.onFinishedEdit();
      return;
    }
  };

  onFinishedEdit = () => {
    this.props.editProject({
      name: this.state.updatedName
    });
    this.setState({
      editingName: false,
      updatedName: ""
    });
  };

  render() {
    const { name = "", numScenes = 0, numSprites = 0 } = this.props;
    const { editingName, updatedName } = this.state;
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden"
        }}
      >
        <PageHeader>
          {editingName ? (
            <input
              type="text"
              value={updatedName}
              onChange={this.onEditName}
              onKeyDown={this.onEnter}
              onBlur={this.onFinishedEdit}
              autoFocus
              style={{
                width: "100%",
                backgroundColor: "var(--input-bg-color)",
                border: "1px solid var(--input-border-color)",
                color: "var(--input-text-color)",
                fontSize: "2em",
                fontWeight: "bold",
                padding: 5,
                marginLeft: -6,
                marginTop: -6,
                marginBottom: -1
              }}
            />
          ) : (
            <h1>
              {name}{" "}
              <Button small transparent onClick={this.onStartEdit}>
                <PencilIcon />
              </Button>
            </h1>
          )}
          <p>
            {numScenes} {numScenes === 1 ? "Scene" : "Scenes"}
          </p>
          <p>
            {numSprites} {numSprites === 1 ? "Sprite" : "Sprites"}
          </p>
        </PageHeader>
        <PageContent>
          <Button
            style={{
              float: "left",
              width: 200,
              height: 150,
              marginRight: 20,
              marginBottom: 20
            }}
            onClick={this.setSection("world")}
          >
            Create Your World
          </Button>
          <Button
            style={{
              float: "left",
              width: 200,
              height: 150,
              marginRight: 20,
              marginBottom: 20
            }}
            onClick={this.setSection("sprites")}
          >
            Manage Sprites
          </Button>
          <Button
            style={{
              float: "left",
              width: 200,
              height: 150,
              marginRight: 20,
              marginBottom: 20
            }}
            onClick={this.setSection("backgrounds")}
          >
            Manage Backgrounds
          </Button>
          <Button
            style={{
              float: "left",
              width: 200,
              height: 150,
              marginRight: 20,
              marginBottom: 20
            }}
            onClick={this.setSection("script")}
          >
            Script Review
          </Button>
          <Button
            style={{
              float: "left",
              width: 200,
              height: 150,
              marginRight: 20,
              marginBottom: 20
            }}
            onClick={this.setSection("build")}
          >
            Build &amp; Run
          </Button>
        </PageContent>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    name: state.project.present && state.project.present.name,
    numScenes:
      state.project.present &&
      state.project.present.scenes &&
      state.project.present.scenes.length,
    numSprites:
      state.project.present &&
      state.project.present.spriteSheets &&
      state.project.present.spriteSheets.length
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
