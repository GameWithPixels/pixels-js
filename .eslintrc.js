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
    {
      files: ["*.ts", "*.tsx", "*.d.ts"],
      parserOptions: {
        project: "./tsconfig.eslint.json",
      },
    },
  ],
  rules: {
    "react-hooks/exhaustive-deps": [
      "warn",
      {
        additionalHooks: "(useFrameProcessor)",
      },
    ],
  },
};
