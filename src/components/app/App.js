import React, { Component } from "react";
import { connect } from "react-redux";
import cx from "classnames";
import AppToolbar from "../../containers/AppToolbar";
import BackgroundsPage from "../../containers/pages/BackgroundsPage";
import SpritesPage from "../../containers/pages/SpritesPage";
import OverviewPage from "../../containers/pages/OverviewPage";
import ScriptPage from "../../containers/pages/ScriptPage";
import BuildPage from "../../containers/pages/BuildPage";
import WorldPage from "../../containers/pages/WorldPage";

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
          {section === "backgrounds" && <BackgroundsPage />}
          {section === "sprites" && <SpritesPage />}
          {section === "script" && <ScriptPage />}
          {section === "build" && <BuildPage />}
        </div>
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
