import React, { Component } from "react";
import { connect } from "react-redux";
import cx from "classnames";
import AppToolbar from "./containers/AppToolbar";
import ImagesSection from "./components/ImagesSection";
import SpritesSection from "./components/SpritesSection";
import OverviewPage from "./containers/pages/OverviewPage";
import ScriptPage from "./containers/pages/ScriptPage";
import BuildPage from "./containers/pages/BuildPage";
import WorldPage from "./containers/pages/WorldPage";

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
          {section === "world" && <WorldPage />}
          {section === "backgrounds" && <ImagesSection />}
          {section === "sprites" && <SpritesSection />}
          {section === "script" && <ScriptPage />}
          {section === "build" && <BuildPage />}
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
