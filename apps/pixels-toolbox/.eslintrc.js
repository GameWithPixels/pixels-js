module.exports = {
  extends: ["universe/native", "universe/shared/typescript-analysis"],
  ignorePatterns: ["/android/"],
  overrides: [
    {
      files: ["*.ts", "*.tsx", "*.d.ts"],
      parserOptions: {
        project: "./tsconfig.json",
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
