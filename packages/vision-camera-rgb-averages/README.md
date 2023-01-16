# vision-camera-rgb-averages

Vision Camera Frame Processor computing RGB averages

Find the latest published version on [NPM](
    https://www.npmjs.com/package/@systemic-games/vision-camera-rgb-averages
).

## Installation

```sh
npm install vision-camera-rgb-averages
```

Note: this package has a dependency on [`react-native-vision-camera`](
  https://github.com/mrousavy/react-native-vision-camera
).

Use version 2.13.0 for React Native < 0.66, see this [issue](
    https://github.com/mrousavy/react-native-vision-camera/issues/957
).

## Usage

```js
import { useCallback, useRef, } from "react";
import { runOnJS } from "react-native-reanimated";
import {
  Camera,
  useCameraDevices,
  useFrameProcessor,
} from "react-native-vision-camera";
import {
  getImageRgbAverages,
  ImageRgbAverages,
} from "@systemic-games/vision-camera-rgb-averages";

function App() {
  const devices = useCameraDevices("wide-angle-camera");
  const cameraRef = useRef<Camera>(null);

  // Simply log the R, G, B values
  const processRgbAverages = useCallback((rgbAverages: ImageRgbAverages) => {
    console.log(rgbAverages);
  }, []);

  // Get the average R, G and B for each image captured by the camera
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      try {
        const result = getImageRgbAverages(frame, {
          subSamplingX: 4,
          subSamplingY: 2,
        });
        runOnJS(processRgbAverages)(result);
      } catch (error) {
        console.error(
          `Exception in frame processor "getImageRgbAverages": ${error}`
        );
      }
    },
    [processRgbAverages]
  );

  // Note: before rendering the camera component, ask for camera permissions
  //       and check that the camera device is valid.
  // See https://github.com/mrousavy/react-native-vision-camera for more info.
  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={cameraRef}
        device={devices.back}
        isActive
        frameProcessor={frameProcessor}
      />
    </View>
  );
}
```

## Development workflow

To get started with the project, run `yarn` in the root directory to install the required dependencies for each package:

```sh
yarn
```

> While it's possible to use [`npm`](https://github.com/npm/cli), the tooling is built around [`yarn`](https://classic.yarnpkg.com/), so you'll have an easier time if you use `yarn` for development.

While developing, you can run the [example app](/example/) to test your changes. Any changes you make in your library's JavaScript code will be reflected in the example app without a rebuild. If you change any native code, then you'll need to rebuild the example app.

To start Metro:

```sh
yarn example start
```

To run the example app on Android:

```sh
yarn example android
```

To run the example app on iOS:

```sh
yarn example ios
```

Make sure your code passes TypeScript and ESLint. Run the following to verify:

```sh
yarn typescript
yarn lint
```

To fix formatting errors, run the following:

```sh
yarn lint --fix
```

Remember to add tests for your change if possible. Run the unit tests by:

```sh
yarn test
```

To edit the Objective-C files, open `example/ios/VisionCameraRgbAveragesExample.xcworkspace` in XCode and find the source files at `Pods > Development Pods > vision-camera-rgb-averages`.

To edit the Java files, open `example/android` in Android studio and find the source files at `vision-camera-rgb-averages` under `Android`.

### Commit message convention

We follow the [conventional commits specification](https://www.conventionalcommits.org/en) for our commit messages:

- `fix`: bug fixes, e.g. fix crash due to deprecated method.
- `feat`: new features, e.g. add new method to the module.
- `refactor`: code refactor, e.g. migrate from class components to hooks.
- `docs`: changes into documentation, e.g. add usage example for the module..
- `test`: adding or updating tests, e.g. add integration tests using detox.
- `chore`: tooling changes, e.g. change CI config.

Our pre-commit hooks verify that your commit message matches this format when committing.

### Publishing to npm

We use [release-it](https://github.com/release-it/release-it) to make it easier to publish new versions. It handles common tasks like bumping version based on semver, creating tags and releases etc.

To publish new versions, run the following:

```sh
yarn release
```

### Scripts

The `package.json` file contains various scripts for common tasks:

- `yarn bootstrap`: setup project by installing all dependencies and pods.
- `yarn typescript`: type-check files with TypeScript.
- `yarn lint`: lint files with ESLint.
- `yarn test`: run unit tests with Jest.
- `yarn example start`: start the Metro server for the example app.
- `yarn example android`: run the example app on Android.
- `yarn example ios`: run the example app on iOS.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
