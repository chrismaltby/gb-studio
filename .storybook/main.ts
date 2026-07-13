import type { StorybookConfig } from "@storybook/react-webpack5";
import { createRequire } from "node:module";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";

const require = createRequire(import.meta.url);

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-docs",
    "@storybook/addon-themes",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  webpackFinal: async (config) => {
    if (config?.resolve) {
      config.resolve.plugins = [new TsconfigPathsPlugin()];
      config.resolve.extensions = [
        ...(config.resolve.extensions || []),
        ".ts",
        ".tsx",
      ];
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        path: require.resolve("path-browserify"),
      };
    }
    if (config?.module) {
      config.module.rules = [
        ...(config.module.rules || []),
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: require.resolve("ts-loader"),
              options: {
                transpileOnly: true,
              },
            },
          ],
        },
      ];
    }
    return config;
  },
};
export default config;
