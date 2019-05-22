import React from "react";
import ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";
import Splash from "../components/app/Splash";
import "../lib/electron/handleFullScreen";
import "../lib/helpers/handleTheme";

const render = () => {
  ReactDOM.render(
    <AppContainer>
      <Splash />
    </AppContainer>,
    document.getElementById("App")
  );
};

render();

if (module.hot) {
  module.hot.accept(render);
}
