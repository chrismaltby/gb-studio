import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "store/configureStore";
import App from "components/app/App";
import AppContainerDnD from "components/app/AppContainerDnD";
import ThemeProvider from "ui/theme/ThemeProvider";
import GlobalStyle from "ui/globalStyle";
import { initTheme } from "renderer/lib/theme";
import { initFullScreenDetector } from "renderer/lib/handleFullScreen";
import initRendererL10N from "renderer/lib/lang/initRendererL10N";
import "./initProject";

(async () => {
  await initRendererL10N();
  await initTheme();
  await initFullScreenDetector();

  const root = createRoot(document.getElementById("App") as HTMLElement);
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <ThemeProvider>
          <GlobalStyle />
          <AppContainerDnD>
            <App />
          </AppContainerDnD>
        </ThemeProvider>
      </Provider>
    </React.StrictMode>
  );
})();
