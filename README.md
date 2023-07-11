# pixels-js

Monorepo for Pixels Typescript/JavaScript libraries and apps.

This repository regroups all the TypeScript/JavaScript source code
for our web and React Native packages.

## Foreword

Pixels are full of LEDs, smarts and no larger than regular dice, they can be
customized to light up when and how you desire.
Check our [website](https://gamewithpixels.com/) for more information.

> **Warning**
> Before jumping into programming please make sure to read our Pixels developer's
> [guide](https://github.com/GameWithPixels/.github/blob/main/doc/DevelopersGuide.md).

Please open a [ticket](
    https://github.com/GameWithPixels/pixels-js/issues
) on GitHub if you're having any issue.

## Documentation

The packages documentation is generated from the source code with
[TypeDoc](https://typedoc.org/).
The latest version of the packages modules documentation is published [here](
    https://gamewithpixels.github.io/pixels-js/index.html
).

Each package is documented as a separate module, see the list below to get the links
to the main package's documentation.

## Packages

Here is a short list of the packages that we think will be the most useful for a developer
looking to develop a software that connects to Pixels dice:

- Pixels in a browser: [*@systemic-games/pixels-web-connect*](
    packages/pixels-web-connect
) - [NPM link](
    https://www.npmjs.com/package/@systemic-games/pixels-web-connect
) - [doc link](
    https://gamewithpixels.github.io/pixels-js/modules/_systemic_games_pixels_web_connect.html
)
- React hooks for Pixels: [*@systemic-games/pixels-react*](
    packages/pixels-react
) - [NPM link](
    https://www.npmjs.com/package/@systemic-games/pixels-react
) - [doc link](
    https://gamewithpixels.github.io/pixels-js/modules/_systemic_games_pixels_react.html
)
- Pixels Animations & Profiles manipulation: [*@systemic-games/pixels-edit-animation*](
    packages/pixels-edit-animation
) - [NPM link](
    https://www.npmjs.com/package/@systemic-games/pixels-edit-animation
) - [doc link](
    https://gamewithpixels.github.io/pixels-js/modules/_systemic_games_pixels_edit_animation.html
)
- Pixels on React Native package: [*@systemic-games/react-native-pixels-connect*](
    packages/react-native-pixels-connect
) - [NPM link](
    https://www.npmjs.com/package/@systemic-games/react-native-pixels-connect
) - [doc link](
    https://gamewithpixels.github.io/pixels-js/modules/_systemic_games_react_native_pixels_connect.html
)

For a complete list of available packages, head to the [packages](packages/) folder.

The rest of this readme will get you started on how to build the Pixels
packages and apps.
You probably don't need to read this unless your intention is to work on
those packages or apps.

## Development workflow

To get started with the project, run `yarn` in the root directory to install
the required dependencies and build each package:

```sh
yarn
```

*Note:* This is equivalent to running `yarn install && yarn pk:all`.
It's the later command that builds all the packages.

### EAS Builds

#### Development Builds

To make a development build using Expo [EAS](
    https://docs.expo.dev/eas/
) for iOS:
```sh
yarn px:eas-ios --development
```
Or for Android:
```sh
yarn px:eas-android --development
```
Or both at once:
```sh
yarn px:eas-all --development
```

*Notes:*
- For other build profiles, replace `development` by the required profile
  name such as `preview`.
- For the Toolbox, replace `px` by `tb`.

#### Preview Builds

At the moment "preview" builds are also referred as "production" builds.

There are two options to publish a production update:

##### Full Builds

It there was any change made to the native code then a full update must be
published.
```sh
yarn px:eas-all --preview
```

*Notes:*
- Add the `--local` switch to build locally (not supported on Windows).

##### Content Updates

EAS comes with a great update system that allow publishing incremental
updates to the application scripts and assets:
```sh
yarn px:eas-update "A few words to describe the contents of the update"
```

The update will be available for both iOS and Android preview builds.

### Install A Build

To install a build on an Android emulator:
```sh
adb -e install app.apk
```

Use the `-d` flag to install on a physical device instead.

See the Expo [documentation](
    https://docs.expo.dev/build-reference/simulators/
) to learn how to configure and install a build for iOS simulators using EAS.

### Running A Dev Build

Developers have two options when working on the Pixels app or the Toolbox:
- Build and install a development version of the "public" production app.
- Build and install a development version of the "alternate" app  which has
a different package name (or bundle identifier on iOS) so that it can be
installed alongside a build of the "public" app.

By default the Metro bundler will target the "public" app.
It will switch to the alternate package name (or bundle identifier) when the
environment variable `SYSTEMIC_PX_DEV` is set to 1

For the Toolbox the environment variable `SYSTEMIC_TB_DEV` is used.

To start a development server that connects to a development build of the
"public" app:
```sh
yarn px start
```

And to connect to a development build of the "alternate" app:
```sh
yarn pxd start
```

#### Building Locally

This command builds the Android "public" app locally (without EAS), deploys it and
then connects to it:
```sh
yarn px android
```
And for the "alternate" app:
```sh
yarn px android
```

On iOS you need to first generate the project files for XCode:
```sh
yarn px prebuild
```
And for the "alternate" app:
```sh
yarn pxd prebuild
```

And then build and run the project from XCode.

For the "alternate" app, be sure to run XCode with the dev environment variable set:
```sh
yarn px:setdev
```

On the next run you may skip rebuilding the app and directly start the development server
using the "start" command described previously.

*Note:* For the Toolbox, replace `px` by `tb`.

### Toolbox: Updating The Firmware Packages

Here are the steps to update the DFU files that are being used by the validation screen 
and which are also selected by default in other screens):

1. Build a new Bootloader + [Firmware](https://github.com/GameWithPixels/DiceFirmware/)
   combo using the `publish` command.
2. Replace the Bootloader and Firmware DFU files in `apps\pixels-toolbox\assets\dfu\factory-dfu-files.zip`.
   > /!\ Be sure to only have one file for the Bootloader and one for the Firmware in this zip file!
3. Update the version number in `app.config.ts`
4. Run either `tb:eas-update "Description"` or `tb:eas-android preview` command.

**Note**: Bootloader and Firmware DFU files not meant for production should be placed into
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

## Acknowledgements

Documentation generated with [TypeDoc](https://typedoc.org/).

Applications icon files generated with [EasyAppIcons](
    https://easyappicon.com/
).

TypeScript packages generated with [example-typescript-package](
    https://github.com/tomchen/example-typescript-package
).

React Native packages generated with [create-react-native-library](
    https://github.com/callstack/react-native-builder-bob
).

## License

MIT
