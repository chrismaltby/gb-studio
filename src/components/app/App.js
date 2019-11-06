import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import cx from "classnames";
import GlobalError from "../library/GlobalError";
import AppToolbar from "../../containers/AppToolbar";
import BackgroundsPage from "../../containers/pages/BackgroundsPage";
import SpritesPage from "../../containers/pages/SpritesPage";
import DialoguePage from "../../containers/pages/DialoguePage";
import BuildPage from "../../containers/pages/BuildPage";
import WorldPage from "../../containers/pages/WorldPage";
import UIPage from "../../containers/pages/UIPage";
import MusicPage from "../../containers/pages/MusicPage";
import SettingsPage from "../../containers/pages/SettingsPage";
import l10n from "../../lib/helpers/l10n";
import { ErrorShape } from "../../reducers/stateShape";

class App extends Component {
  constructor() {
    super();
    this.state = {
      blur: false
    };
  }

  componentDidMount() {
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
    const { section, error } = this.props;
    const { blur } = this.state;

    if(error.visible) {
      return <GlobalError error={error} />
    }

    return (
      <div
        className={cx("App", {
          "App--Blur": blur,
          "App--RTL": l10n("RTL") === true
        })}
      >
        <AppToolbar />
        <div className="App__Content">
          {section === "world" && <WorldPage />}
          {section === "backgrounds" && <BackgroundsPage />}
          {section === "sprites" && <SpritesPage />}
          {section === "ui" && <UIPage />}
          {section === "music" && <MusicPage />}
          {section === "dialogue" && <DialoguePage />}
          {section === "build" && <BuildPage />}
          {section === "settings" && <SettingsPage />}
        </div>
      </div>
    );
  }
}

App.propTypes = {
  section: PropTypes.oneOf([
    "world",
    "backgrounds",
    "sprites",
    "ui",
    "music",
    "dialogue",
    "build",
    "settings"
  ]).isRequired,
  error: ErrorShape.isRequired
};

function mapStateToProps(state) {
  return {
    section: state.navigation.section,
    error: state.error
  };
}

export default connect(mapStateToProps)(App);
