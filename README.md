# pixels-js

Monorepo for Pixels Typescript/JavaScript libraries and apps.

If this is your first visit to the Pixels software documentation
you may want to head first to our documentation entry point [here](
    https://github.com/GameWithPixels
).

## Introduction

This repository regroups all the TypeScript/JavaScript source code
for our web and React Native packages.

The packages documentation is generated from the source code with
[TypeDoc](https://typedoc.org/).
The latest version of the packages modules documentation is published [here](
    https://gamewithpixels.github.io/pixels-js/index.html
).

In particular the following packages are available:
- Pixels in a browser: *@systemic-games/pixels-web-connect* - [NPM link](
    https://www.npmjs.com/package/@systemic-games/pixels-web-connect
) - [doc link](
    https://gamewithpixels.github.io/pixels-js/modules/_systemic_games_pixels_web_connect.html
)
- React hooks for Pixels: *@systemic-games/pixels-react* - [NPM link](
    https://www.npmjs.com/package/@systemic-games/pixels-react
) - [doc link](
    https://gamewithpixels.github.io/pixels-js/modules/_systemic_games_pixels_react.html
)
- Pixels Animations & Profiles manipulation: *@systemic-games/pixels-edit-animation* - [NPM link](
    https://www.npmjs.com/package/@systemic-games/pixels-edit-animation
) - [doc link](
    https://gamewithpixels.github.io/pixels-js/modules/_systemic_games_pixels_edit_animation.html
)
- Pixels on React Native package: *@systemic-games/react-native-pixels-connect* - [NPM link](
    https://www.npmjs.com/package/@systemic-games/react-native-pixels-connect
) - [doc link](
    https://gamewithpixels.github.io/pixels-js/modules/_systemic_games_react_native_pixels_connect.html
)

The rest of this readme will get you started on how to build the Pixels packages and apps.
You probably don't need to read this unless your intention is to work on those packages or apps.

## Development workflow

To get started with the project, run `yarn` in the root directory to install the required
dependencies and build each package:

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
