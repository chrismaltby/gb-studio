import React, { Component } from "react";
import World from "../../components/world/World";
import ToolPicker from "../../components/world/ToolPicker";
import EditorSidebar from "../../components/editors/EditorSidebar";
import StatusBar from "../../components/world/StatusBar";

class WorldPage extends Component {
  render() {
    return (
      <div>
        <World />
        <ToolPicker />
        <EditorSidebar />
        <StatusBar />
      </div>
    );
  }
}

export default WorldPage;
