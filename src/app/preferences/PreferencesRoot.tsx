import React from "react";
import { createRoot } from "react-dom/client";
import Preferences from "components/app/Preferences";
import initRendererL10N from "renderer/lib/lang/initRendererL10N";
import { initTheme } from "renderer/lib/theme";

(async () => {
  await initRendererL10N();
  await initTheme();

  const root = createRoot(document.getElementById("App") as HTMLElement);
  root.render(
    <React.StrictMode>
      <Preferences />
    </React.StrictMode>,
  );
})();
