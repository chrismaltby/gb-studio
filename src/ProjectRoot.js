import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import store from "./store/configureStore";
import App from "./components/app/App";
import AppContainerDnD from "./components/app/AppContainerDnD";
import ThemeProvider from "./components/ui/theme/ThemeProvider";
import "./lib/electron/handleFullScreen";
import "./lib/helpers/handleTheme";
import "./styles/App.css";
import "./initProject";

const render = () => {
  ReactDOM.render(
    <Provider store={store}>
      <ThemeProvider>
        <AppContainerDnD>
          <App />
        </AppContainerDnD>
      </ThemeProvider>
    </Provider>,
    document.getElementById("App")
  );
};

render();

if (module.hot) {
  module.hot.accept(render);
}
