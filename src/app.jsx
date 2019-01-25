import React, { Component } from "react";
import { connect } from "react-redux";
import cx from "classnames";
import World from "./components/World";
// import Navbar from "./components/Navbar";
import AppToolbar from "./containers/AppToolbar";
import ToolsSidebar from "./components/ToolsSidebar";
import StatusBar from "./components/StatusBar";
import EditorSidebar from "./components/EditorSidebar";
import ImagesSection from "./components/ImagesSection";
import SpritesSection from "./components/SpritesSection";
import OverviewPage from "./containers/pages/OverviewPage";

class App extends Component {
  constructor() {
    super();
    this.state = {
      blur: false
    };
  }

  componentWillMount() {
    window.addEventListener("blur", this.onBlur);
    window.addEventListener("focus", this.onFocus);
  }

  onBlur = () => {
    console.log("ON BLUR");
    this.setState({ blur: true });
  };

  onFocus = () => {
    this.setState({ blur: false });
  };

  render() {
    const { section } = this.props;
    const { blur } = this.state;
    return (
      <div className={cx("App", { "App--Blur": blur })}>
        <AppToolbar />
        <div className="App__Content">
          {section === "overview" && <OverviewPage />}
          {section === "world" && (
            <div className="WorldEditor">
              <World />
              <ToolsSidebar />
              <EditorSidebar />
              <StatusBar />
            </div>
          )}
          {section === "backgrounds" && <ImagesSection />}
          {section === "sprites" && <SpritesSection />}
        </div>
      </div>
    );

    // return (
    //   <div className="App">
    //     {section === "editor" && (
    //       <div>
    //         <World />
    //         <ToolsSidebar />
    //         <EditorSidebar />
    //         <StatusBar />
    //       </div>
    //     )}
    //     {section === "images" && <ImagesSection />}
    //     {section === "spriteSheets" && <SpritesSection />}
    //     <Navbar />
    //   </div>
    // );
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
