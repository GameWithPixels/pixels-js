# pixels-js

Monorepo for Pixels Typescript/JavaScript libraries and apps.


See the different modules' export documentation [here](
    https://gamewithpixels.github.io/pixels-js/index.html
).

Documentation is generated with [TypeDoc](https://typedoc.org/).

## Apps

* `pixels-app` created with Expo 44 `expo init --template @native-base/expo-template-typescript`
* `pixels-toolbox` created with Expo 45 `expo init -t expo-template-blank-typescript`
* `react-native-pixels-components` created with [`create-react-native-library`](
    https://github.com/callstack/react-native-builder-bob
)
* `react-native-base-components` created with [`create-react-native-library`](
    https://github.com/callstack/react-native-builder-bob
)

## Development workflow

To get started with the project, run `yarn` in the root directory to install the required dependencies and build each package:

```sh
yarn
```

Note: this is equivalent to run `yarn install && yarn pk:all`.
It's the later command that builds all the packages.

### EAS Build

To start a development build on EAS:
```sh
yarn px:eas-android --development
```

Or locally (not supported on Windows):
```sh
yarn px:eas-android --development --local
```

For other types of builds, replace "development" by build type such as "preview" (without quotes).

**Note:** for the Toolbox, replace `px` by `tb`.

### Install A Build

To install a build on the emulator:
```sh
adb -e install app.apk
```

Use the -d flag to install on a physical device instead.

### Running A Dev Build

To start a development server that connects to a development version of app already installed:
```sh
yarn px start
```

Or to build locally without EAS and immediately deploy the build and connect to it:
```sh
yarn px android
```

On the next run you can avoid rebuilding the app and directly start the development server.

**Note:** for the Toolbox, replace `px` by `tb`.

### Making Updates

Code changes made in the "universal" packages (the pixels-* packages) are usually not immediately
picked up by the Metro packager, so you need to rebuild the modified package and restart the
development server:

```sh
cd packages/pixels-package-name
yarn build
cd ../..
yarn px start
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

### Commit message convention

We follow the [conventional commits specification](https://www.conventionalcommits.org/en) for our commit messages:

- `fix`: bug fixes, e.g. fix crash due to deprecated method.
- `feat`: new features, e.g. add new method to the module.
- `refactor`: code refactor, e.g. migrate from class components to hooks.
- `docs`: changes into documentation, e.g. add usage example for the module..
- `test`: adding or updating tests, e.g. add integration tests using detox.
- `chore`: tooling changes, e.g. change CI config.

Our pre-commit hooks verify that your commit message matches this format when committing.

### Publish

Build the Toolbox on EAS:
```sh
yarn tb:eas-android preview
```
