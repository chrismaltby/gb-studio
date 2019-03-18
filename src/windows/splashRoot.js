import React from "react";
import ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";
const { systemPreferences } = require("electron").remote;

const render = () => {
  const Splash = require("../components/app/Splash").default;
  ReactDOM.render(
    <AppContainer>
      <Splash />
    </AppContainer>,
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
