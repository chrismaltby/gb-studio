import { fixupConfigRules } from "@eslint/compat";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import restrictedBrowserGlobals from "confusing-browser-globals";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import storybook from "eslint-plugin-storybook";
import globals from "globals";
import prettier from "eslint-config-prettier";

const restrictedRendererImports = [
  {
    group: ["main/*"],
    message: "Can't use main/* imports within renderer!",
    allowTypeImports: true,
  },
  {
    group: ["lib/*"],
    message: "Can't use lib/* imports within renderer!",
    allowTypeImports: true,
  },
  {
    group: ["../*"],
    message: "Usage of relative parent imports is not allowed",
    allowTypeImports: true,
  },
  {
    group: ["renderer/components/*"],
    message: "Replace renderer/components/ with just components/",
  },
  {
    group: ["components/ui/*"],
    message: "Replace components/ui/ with just ui/",
  },
];

const restrictedMainImports = [
  {
    group: ["renderer/*"],
    message: "Can't use renderer/* imports within main process!",
    allowTypeImports: true,
  },
  {
    group: ["store/*"],
    message: "Can't use store/* imports within main process!",
    allowTypeImports: true,
  },
  {
    group: ["components/*"],
    message: "Can't use components/* imports within main process!",
    allowTypeImports: true,
  },
  {
    group: ["../*"],
    message: "Usage of relative parent imports is not allowed",
    allowTypeImports: true,
  },
];

const restrictedSharedImports = [
  {
    group: ["main/*"],
    message: "Can't use main/* imports within shared modules!",
    allowTypeImports: true,
  },
  {
    group: ["lib/*"],
    message: "Can't use lib/* imports within shared modules!",
    allowTypeImports: true,
  },
  {
    group: ["renderer/*"],
    message: "Can't use renderer/* imports within shared modules!",
    allowTypeImports: true,
  },
  {
    group: ["store/*"],
    message: "Can't use store/* imports within shared modules!",
    allowTypeImports: true,
  },
  {
    group: ["components/*"],
    message: "Can't use components/* imports within shared modules!",
    allowTypeImports: true,
  },
  {
    group: ["../*"],
    message: "Usage of relative parent imports is not allowed",
    allowTypeImports: true,
  },
];

export default [
  {
    ignores: [
      "src/lib/vendor/**",
      "src/renderer/lib/vendor/**",
      "src/lib/forge/hooks/**",
    ],
  },
  js.configs.recommended,
  ...typescriptEslint.configs["flat/recommended"],
  ...fixupConfigRules(importPlugin.flatConfigs.recommended),
  ...fixupConfigRules(importPlugin.flatConfigs.typescript),
  ...fixupConfigRules(react.configs.flat.recommended),
  ...fixupConfigRules(jsxA11y.flatConfigs.recommended),
  ...storybook.configs["flat/recommended"],
  {
    files: ["{src,test}/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      parser: typescriptParser,
      globals: {
        ...globals.browser,
        ...globals.node,
        __non_webpack_require__: "readonly",
        COMMITHASH: "readonly",
        VERSION: "readonly",
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
        },
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
          moduleDirectory: [
            "node_modules",
            "src",
            "src/components",
            "src/renderer",
            "appData",
            "./",
          ],
        },
      },
    },
    rules: {
      "import/no-named-as-default": "off",
      "import/extensions": "off",
      "import/no-anonymous-default-export": "warn",
      "import/no-extraneous-dependencies": "off",
      "import/no-unresolved": [
        "error",
        { ignore: ["electron", "#my-quickjs-variant"] },
      ],
      "import/no-webpack-loader-syntax": "error",
      "linebreak-style": "off",
      "react/prefer-stateless-function": "off",
      "react/display-name": "off",
      "react/jsx-filename-extension": "off",
      "react/jsx-wrap-multilines": "off",
      "prefer-destructuring": "off",
      "no-underscore-dangle": "off",
      "no-bitwise": "off",
      "no-plusplus": "off",
      "react/jsx-one-expression-per-line": "off",
      "react/jsx-key": "off",
      "react/no-children-prop": "off",
      "react/no-unescaped-entities": "off",
      "react/prop-types": "off",
      "jsx-a11y/no-autofocus": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/mouse-events-have-key-events": "off",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "jsx-a11y/no-noninteractive-tabindex": "off",
      "global-require": "warn",
      "import/no-dynamic-require": "warn",
      "no-alert": "warn",
      "no-await-in-loop": "off",
      "no-case-declarations": "off",
      "no-console": "off",
      "no-constant-binary-expression": "off",
      "no-constant-condition": "off",
      "no-control-regex": "error",
      "no-empty": "off",
      "no-eval": "warn",
      "no-implied-eval": "warn",
      "no-nested-ternary": "off",
      "no-new-func": "warn",
      "no-restricted-globals": ["error", ...restrictedBrowserGlobals],
      "no-restricted-properties": [
        "error",
        {
          object: "require",
          property: "ensure",
          message:
            "Please use import() instead. More info: https://facebook.github.io/create-react-app/docs/code-splitting",
        },
        {
          object: "System",
          property: "import",
          message:
            "Please use import() instead. More info: https://facebook.github.io/create-react-app/docs/code-splitting",
        },
      ],
      "no-self-compare": "warn",
      "no-template-curly-in-string": "warn",
      "no-useless-assignment": "off",
      "no-useless-concat": "warn",
      "no-useless-catch": "off",
      "preserve-caught-error": "off",
      "import/prefer-default-export": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-var-requires": "warn",
      "no-unused-expressions": "off",
      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
        },
      ],
      camelcase: [
        "error",
        {
          allow: [
            "UNSAFE_componentWillReceiveProps",
            "icon_path",
            "bug_link_text",
          ],
        },
      ],
      "no-use-before-define": "off",
      "@typescript-eslint/no-redeclare": "off",
      "@typescript-eslint/no-use-before-define": [
        "error",
        {
          functions: false,
          classes: true,
          variables: false,
          typedefs: true,
          ignoreTypeReferences: true,
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-unused-vars": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": [
        "warn",
        {
          additionalHooks: "useDebouncedCallback",
        },
      ],
    },
  },
  {
    files: ["src/lib/events/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@typescript-eslint/no-var-requires": "off",
    },
  },
  {
    files: ["test/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    files: ["eslint.config.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
        },
        node: {
          extensions: [".js", ".mjs"],
        },
      },
    },
    rules: {
      "import/no-named-as-default-member": "off",
    },
  },
  {
    files: [
      "src/renderer/**",
      "src/components/**",
      "src/store/**",
      "src/apps/gb-studio/*/**",
    ],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: restrictedRendererImports,
          paths: ["fs", "fs-extra", "electron-settings", "electron"],
        },
      ],
    },
  },
  {
    files: [
      "src/renderer/lib/api/setup.ts",
      "src/apps/gb-studio/**/preload.ts",
    ],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: ["fs", "fs-extra"],
        },
      ],
    },
  },
  {
    files: ["src/main/**", "src/lib/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: restrictedMainImports,
          paths: ["react", "react-dom"],
        },
      ],
    },
  },
  {
    files: ["src/shared/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: restrictedSharedImports,
          paths: ["react", "react-dom", "fs", "fs-extra", "electron-settings"],
        },
      ],
    },
  },
  prettier,
];
