import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import store from "./store/configureStore";
import App from "./components/app/App";
import AppContainerDnD from "./components/app/AppContainerDnD";
import "./lib/electron/handleFullScreen";
import "./lib/helpers/handleTheme";
import "./styles/App.css";
import "./initProject";

const render = () => {
  ReactDOM.render(
    <Provider store={store}>
      <AppContainerDnD>
        <App />
      </AppContainerDnD>
    </Provider>,
    document.getElementById("App")
  );
};

render();

if (module.hot) {
  module.hot.accept(render);
}
