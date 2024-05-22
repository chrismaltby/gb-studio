import React from "react";
import ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";
import Splash from "components/app/Splash";
import initRendererL10N from "renderer/lib/lang/initRendererL10N";
import { initTheme } from "renderer/lib/theme";
import "renderer/lib/globalErrorHandling";

const render = () => {
  ReactDOM.render(
    <AppContainer>
      <Splash />
    </AppContainer>,
    document.getElementById("App")
  );
};

(async () => {
  await initRendererL10N();
  await initTheme();
  render();
})();

if (module.hot) {
  module.hot.accept(render);
}
