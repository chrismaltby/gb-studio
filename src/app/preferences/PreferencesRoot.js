import React from "react";
import ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";
import Preferences from "components/app/Preferences";
import initElectronL10n from "lib/helpers/initElectronL10n";
import { initL10N } from "renderer/lib/l10n";
import { initTheme } from "renderer/lib/theme";
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

(async () => {
  await initL10N();
  await initTheme();
  render();
})();

if (module.hot) {
  module.hot.accept(render);
}
