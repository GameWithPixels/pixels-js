module.exports = {
  extends: [
    "universe/native",
    "universe/web",
    "universe/shared/typescript-analysis",
  ],
  ignorePatterns: [
    "/docs/",
    "/apps/*/android/",
    "/apps/*/dist/",
    "/apps/*/ios/",
    "/packages/*/android/",
    "/packages/*/dist/",
    "/packages/*/ios/",
    "/packages/*/lib/",
  ],
  parserOptions: {
    parser: "@babel/eslint-parser",
  },
  plugins: ["jest"],
  overrides: [
    // Typescript
    {
      files: ["*.ts", "*.tsx", "*.d.ts"],
      parserOptions: {
        project: "./tsconfig.eslint.json",
      },
    },
    // JavaScript
    {
      files: ["*.js", "*.jsx"],
      rules: { "@typescript-eslint/no-unused-vars": "off" },
    },
    // Configuration files
    {
      files: [
        "*.config.js",
        "**/config/**/*.js",
        "**/scripts/**/*.js",
        "**/tools/**/*.js",
      ],
      env: {
        node: true,
      },
    },
  ],
  rules: {
    // Ignore unused variables and arguments starting with underscore
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    // For React Native Vision Camera
    "react-hooks/exhaustive-deps": [
      "warn",
      {
        additionalHooks: "(useFrameProcessor)",
      },
    ],
  },
};
