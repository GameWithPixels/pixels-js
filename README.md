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

**Note:** This is equivalent to running `yarn install && yarn pk:all`.
It's the later command that builds all the packages.

### EAS Build

To start building a development build on EAS:
```sh
yarn px:eas-android --development
```

For other types of builds, replace `development` by the desired build type such as `preview`.

To publish an update on EAS:

```sh
yarn px:eas-update "A few words to describe the contents of the update"
```

**Note:**
- For the Toolbox, replace `px` by `tb`.
- Add the `--local` switch to build locally (not supported on Windows).

### Install A Build

To install a build on the emulator:
```sh
adb -e install app.apk
```

Use the -d flag to install on a physical device instead.

### Running A Dev Build

Developers have two options when working on the Pixels App or the Toolbox:
- Running the "regular" development build that replaces the production app.
- Running an alternate development build that has a different package name (or bundle identifier on iOS)
it doesn't replaces the production build on the device already installed on the device.

By default the Metro bundler will use the "normal" development build. However when the environment
variable `SYSTEMIC_PX_DEV` is set, it will switch to the alternate package name (bundle identifier).
For the Toolbox the environment variable `SYSTEMIC_TB_DEV` is used to make that switch.

To start a development server that connects to the "regular" development build:
```sh
yarn px start
```
Or to use the alternate development build:
```sh
yarn pxd start
```

Also, to build the app locally (without EAS), immediately deploy the build and connect to it:
```sh
yarn px android
```

On the next run you may skip rebuilding the app and directly start the development server.

**Note:** For the Toolbox, replace `px` by `tb`.

### Toolbox: Changing The Firmware Packages In The Toolbox

Here are the steps to update the DFU files that are being used by the validation screen (and which are
also selected by default in other screens):

1. Build a new bootloader + [firmware](https://github.com/GameWithPixels/DiceFirmware/) combo using
   the `publish` command.
2. Replace the bootloader and firmware DFU files in `apps\pixels-toolbox\assets\dfu\factory-dfu-files.zip`.
   > /!\ Be sure to only have one file for the bootloader and one for the firmware in this zip file!
3. Update the version number in `app.config.ts`
4. Run either `tb:eas-update "Description"` or `tb:eas-android preview` command.

**Note**: Other bootloader and firmware DFU files should be placed into
`apps\pixels-toolbox\assets\dfu\other-dfu-files.zip`.

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
