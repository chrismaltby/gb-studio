import React, { Component } from "react";
import { connect } from "react-redux";
import World from "./components/World";
import Navbar from "./components/Navbar";
import ToolsSidebar from "./components/ToolsSidebar";
import StatusBar from "./components/StatusBar";
import EditorSidebar from "./components/EditorSidebar";
import ImagesSection from "./components/ImagesSection";
import SpritesSection from "./components/SpritesSection";

class App extends Component {
  render() {
    const { section } = this.props;
    return (
      <div className="App">
        {section === "editor" && (
          <div>
            <World />
            <ToolsSidebar />
            <EditorSidebar />
            <StatusBar />
          </div>
        )}
        {section === "images" && <ImagesSection />}
        {section === "spriteSheets" && <SpritesSection />}
        <Navbar />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    section: state.navigation.section
  };
}

export default connect(mapStateToProps)(App);

// import React from 'react';
// import ToolsSidebar from "./components/ToolsSidebar"

// export default class App extends React.Component {
//   render() {
//     return (<div>
//       <h2>Welcome to React!</h2>
//       <ToolsSidebar />
//     </div>);
//   }
// }
