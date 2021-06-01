import React from "react";
import ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";
import Preferences from "components/app/Preferences";
import initElectronL10n from "lib/helpers/initElectronL10n";
import "lib/helpers/handleTheme";
import "../../styles/App.css";

initElectronL10n();

const render = () => {
  ReactDOM.render(
    <AppContainer>
      <Preferences />
    </AppContainer>,
    document.getElementById("App")
  );
};

render();

if (module.hot) {
  module.hot.accept(render);
}
