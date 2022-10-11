# Pixels Toolbox

## Running The App

### EAS

### Test Build

```sh
eas build -p android --profile preview
```

### Development Build

```sh
eas build -p android --profile development
```

Then run Metro on your local development machine:

```sh
yarn expo start --dev-client 
```

### Local Build

```sh
yarn expo run:android
```

## Package dependencies

This app was created with Expo 45 and then update to Expo 46.

### Dev Client

```sh
yarn expo install expo-dev-client
```

Add at the top of `index.js`:
```js
import "expo-dev-client";
```

### Vision Camera

```sh
yarn expo install react-native-reanimated
yarn expo install react-native-vision-camera
yarn expo prebuild
```

Add `"react-native-reanimated/plugin"` to `babel.config.js` plugins.

For more information see Vision Camera online installation [guide](
  https://mrousavy.com/react-native-vision-camera/docs/guides/
).

### Systemic Packages

```sh
yarn add @systemic-games/react-native-bluetooth-le
yarn add @systemic-games/react-native-nordic-nrf5-dfu
yarn add @systemic-games/vision-camera-rgb-averagesyarn
```

### React Navigation

```sh
yarn add @react-navigation/native
expo install react-native-screens react-native-safe-area-context
```

```sh
yarn add @react-navigation/stack
expo install react-native-gesture-handler
```

Add near the top of `index.js`:
```js
import "react-native-gesture-handler";
```

### babel-plugin-root-import

This Babel [plugin](https://github.com/entwicklerstube/babel-plugin-root-import)
lets you use root based paths to avoid having relative path
between your app source files.

```sh
yarn add babel-plugin-root-import --dev
```

Update Babel config file with:
```js
plugins: [
  [
    "babel-plugin-root-import",
    {
      rootPathSuffix: "./src",
      rootPathPrefix: "~",
    },
  ],
],
```

And `tsconfig.json` with:
```json
"baseUrl": "./src",
"paths": {
  "~/*": [
    "*"
  ]
}
```
