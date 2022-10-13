module.exports = {
  extends: ["universe/native", "universe/shared/typescript-analysis"],
  ignorePatterns: [
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
  overrides: [
    // Typescript
    {
      files: ["*.ts", "*.tsx", "*.d.ts"],
      parserOptions: {
        project: "./tsconfig.eslint.json",
      },
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
  // React Native Vision Camera
  rules: {
    "react-hooks/exhaustive-deps": [
      "warn",
      {
        additionalHooks: "(useFrameProcessor)",
      },
    ],
  },
};
