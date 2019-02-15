import React, { Component } from "react";
import World from "../../components/World";
import ToolsSidebar from "../../components/ToolsSidebar";
import EditorSidebar from "../editors/EditorSidebar";
import StatusBar from "../../components/StatusBar";

class WorldPage extends Component {
  render() {
    return (
      <div>
        <World />
        <ToolsSidebar />
        <EditorSidebar />
        <StatusBar />
      </div>
    );
  }
}

export default WorldPage;
