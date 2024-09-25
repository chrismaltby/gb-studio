import React, { useState } from "react";
import ThemeProvider from "ui/theme/ThemeProvider";
import GlobalStyle from "ui/globalStyle";
import PluginsManagerPlugins from "components/plugins/PluginManagerPlugins";
import PluginsManagerRepos from "components/plugins/PluginManagerRepos";

type PluginManagerSection = "plugins" | "repos";

const PluginsManager = () => {
  const [section, setSection] = useState<PluginManagerSection>("repos");
  return (
    <ThemeProvider>
      <GlobalStyle />
      {section === "plugins" && (
        <PluginsManagerPlugins onManageRepos={() => setSection("repos")} />
      )}
      {section === "repos" && (
        <PluginsManagerRepos onClose={() => setSection("plugins")} />
      )}
    </ThemeProvider>
  );
};

export default PluginsManager;
