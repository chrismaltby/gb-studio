import { KnipConfig } from "knip";
import mdx from "knip/dist/compilers/mdx";

const config: KnipConfig = {
  compilers: {
    mdx: mdx.compiler,
  },
  entry: [
    "src/main.{js,ts}",
    "src/app/*/*Root.{js,jsx,ts,tsx}",
    "src/app/*/preload.{js,ts}",
    "src/bin/*.{js,ts}",
    "src/lib/forge/hooks/*.{js,ts}",
    "src/lib/events/**/*{js,ts}",
    "test/**/*{js,jsx,ts,tsx}",
    "webpack*.{js,ts}",
    "forge.config.js",
    "src/stories/**/*{js,ts,mdx}",
  ],
  project: ["src/**/*.{js,ts,jsx,tsx}"],
  ignore: [
    "src/components/ui/hooks/use-trace-update.ts",
    "src/components/ui/icons/Icons.tsx",
  ],
  ignoreDependencies: [
    "@vercel/webpack-asset-relocator-loader",
    "vm2",
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
