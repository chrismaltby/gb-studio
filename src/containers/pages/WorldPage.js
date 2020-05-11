import React, { Component } from "react";
import World from "../../components/world/World";
import ToolPicker from "../../components/world/ToolPicker";
import PalettePicker from "../../components/world/PalettePicker";
import EditorSidebar from "../../components/editors/EditorSidebar";
import StatusBar from "../../components/world/StatusBar";

class WorldPage extends Component {
  render() {
    return (
      <div>
        <World />
        <PalettePicker />
        <ToolPicker />
        <EditorSidebar />
        <StatusBar />
      </div>
    );
  }
}

export default WorldPage;
