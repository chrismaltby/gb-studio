import React from "react";
import ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";
import Preferences from "./components/app/Preferences";
import "./lib/helpers/handleTheme";
import "./styles/App.css";

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
