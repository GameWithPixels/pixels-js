# pixels-js

Monorepo for Pixels Typescript/JavaScript libraries and apps.

## Setup

Initialize projects and build packages:
```sh
yarn
yarn pk:all
```

## Apps

Run the Pixels app:
```sh
yarn px start
```

*Note:* You may replace "start" by "android" or "ios" to target a specific platform.

Build and run the Toolbox:
```sh
yarn tb android
```

## Type checking and linting

```sh
yarn ts
yarn lint
```

For automatically fixing problems with ESLint:
```sh
yarn lint:fix
```

## Publish

Build the Toolbox on EAS:
```sh
yarn tb:eas-android preview
```

### Contents

* `pixels-app` created with Expo 44 `expo init --template @native-base/expo-template-typescript`
* `pixels-toolbox` created with Expo 45 `expo init -t expo-template-blank-typescript`
* `react-native-pixels-components` created with [`create-react-native-library`](
    https://github.com/callstack/react-native-builder-bob
)
* `react-native-base-components` created with [`create-react-native-library`](
    https://github.com/callstack/react-native-builder-bob
)

## Development workflow

To get started with the project, run `yarn` in the root directory to install the required dependencies for each package:

```sh
yarn
```

To run the Pixels app on Android:

```sh
yarn pixels:android
```

To run the Pixels app on iOS:

```sh
yarn pixels:ios
```

### Commit message convention

We follow the [conventional commits specification](https://www.conventionalcommits.org/en) for our commit messages:

- `fix`: bug fixes, e.g. fix crash due to deprecated method.
- `feat`: new features, e.g. add new method to the module.
- `refactor`: code refactor, e.g. migrate from class components to hooks.
- `docs`: changes into documentation, e.g. add usage example for the module..
- `test`: adding or updating tests, e.g. add integration tests using detox.
- `chore`: tooling changes, e.g. change CI config.

Our pre-commit hooks verify that your commit message matches this format when committing.
