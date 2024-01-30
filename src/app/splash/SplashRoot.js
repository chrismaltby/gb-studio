import React from "react";
import ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";
import Splash from "components/app/Splash";
import { initL10N } from "renderer/lib/l10n";
import { initTheme } from "renderer/lib/theme";

window.addEventListener("error", (error) => {
  if (error.message.indexOf("dead code elimination") > -1) {
    return true;
  }
  error.stopPropagation();
  error.preventDefault();
  document.body.innerHTML = `<div class="GlobalError">
    <div class="GlobalError__Content">
      <h2>${error.message}</h2>
      <p>
        ${error.filename}L:${error.lineno}C:${error.colno}
      </p>     
      <div class="GlobalError__StackTrace">
        ${
          error.error &&
          error.error.stack &&
          error.error.stack
            .split("\n")
            .map((line) => `<div>${line}</div>`)
            .join("")
        }
      </div>
    </div>       
    </div>
  </div>`;
  return false;
});

const render = () => {
  ReactDOM.render(
    <AppContainer>
      <Splash />
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
