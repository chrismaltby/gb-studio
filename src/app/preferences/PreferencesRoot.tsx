import React from "react";
import ReactDOM from "react-dom";
import Preferences from "components/app/Preferences";
import initRendererL10N from "renderer/lib/lang/initRendererL10N";
import { initTheme } from "renderer/lib/theme";

const render = () => {
  ReactDOM.render(<Preferences />, document.getElementById("App"));
};

(async () => {
  await initRendererL10N();
  await initTheme();
  render();
})();

if (module.hot) {
  module.hot.accept(render);
}
