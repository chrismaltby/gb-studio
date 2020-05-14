import React, { Component } from "react";
import World from "../../components/world/World";
import ToolPicker from "../../components/world/ToolPicker";
import BrushToolbar from "../../components/world/BrushToolbar";
import EditorSidebar from "../../components/editors/EditorSidebar";
import StatusBar from "../../components/world/StatusBar";

class WorldPage extends Component {
  render() {
    return (
      <div>
        <World />
        <BrushToolbar />
        <ToolPicker />
        <EditorSidebar />
        <StatusBar />
      </div>
    );
  }
}

export default WorldPage;
