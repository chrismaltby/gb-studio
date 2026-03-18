import { KnipConfig } from "knip";
import mdx from "knip/dist/compilers/mdx";

const config: KnipConfig = {
  compilers: {
    mdx: mdx.compiler,
  },
  entry: [
    "src/apps/gb-studio/main.{js,ts}",
    "src/apps/gb-studio/*/*Root.{js,jsx,ts,tsx}",
    "src/apps/gb-studio/*/preload.{js,ts}",
    "src/apps/gb-studio-cli/**/*.{js,ts}",
    "src/lib/forge/hooks/*.{js,ts}",
    "src/lib/events/**/*{js,ts}",
    "test/**/*{js,jsx,ts,tsx}",
    "src/apps/**/*webpack*.{js,ts}",
    "src/apps/gb-studio/forge.config.js",
    "src/stories/**/*{js,ts,mdx}",
  ],
  project: ["src/**/*.{js,ts,jsx,tsx}"],
  ignore: [
    "src/components/ui/hooks/use-trace-update.ts",
    "src/components/ui/icons/Icons.tsx",
  ],
  ignoreDependencies: [
    "@vercel/webpack-asset-relocator-loader",
    ".*-loader",
    "@electron-forge/maker-.*",
    "@electron-forge/plugin-.*",
    "@types/webpack-env",
    "babel-eslint",
    "eslint-plugin-react",
    "jest-environment-jsdom",
    "eslint-plugin-jsx-a11y",
    "eslint-plugin-import",
    "webpack",
  ],
  ignoreBinaries: ["webpack", "time", "flamebearer"],
  ignoreUnresolved: ["../helpers/l10n"],
};

export default config;
