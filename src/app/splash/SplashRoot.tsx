import React from "react";
import { createRoot } from "react-dom/client";
import Splash from "components/app/Splash";
import initRendererL10N from "renderer/lib/lang/initRendererL10N";
import { initTheme } from "renderer/lib/theme";
import "renderer/lib/globalErrorHandling";

(async () => {
  await initRendererL10N();
  await initTheme();

  const root = createRoot(document.getElementById("App") as HTMLElement);
  root.render(
    <React.StrictMode>
      <Splash />
    </React.StrictMode>
  );
})();
