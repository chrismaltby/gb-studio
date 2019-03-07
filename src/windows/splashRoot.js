import React from "react";
import ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";
import { Provider } from "react-redux";
import * as actions from "../actions";
import configureStore from "../store/configureStore";
const { systemPreferences } = require("electron").remote;

const store = configureStore();

console.log(store);

const render = () => {
  const Splash = require("../components/app/Splash").default;
  ReactDOM.render(
    <Provider store={store}>
      <AppContainer>
        <Splash />
      </AppContainer>
    </Provider>,
    document.getElementById("App")
  );
};

render();

systemPreferences.subscribeNotification(
  "AppleInterfaceThemeChangedNotification",
  function theThemeHasChanged() {
    updateMyAppTheme(systemPreferences.isDarkMode());
  }
);

function updateMyAppTheme(darkMode) {
  console.log("updateMyAppTheme", darkMode);
  const themeStyle = document.getElementById("theme");
  themeStyle.href = "../styles/" + (darkMode ? "theme-dark.css" : "theme.css");
}

updateMyAppTheme(systemPreferences.isDarkMode());

if (module.hot) {
  module.hot.accept(render);
}
