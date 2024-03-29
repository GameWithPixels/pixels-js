# Pixels Web Connect

This is the Pixels package for front end web developers.
It enables communications between Pixels dice and a web browser
using Bluetooth Low Energy.

Find the latest published version on [NPM](
  https://www.npmjs.com/package/@systemic-games/pixels-web-connect
).

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

## Browser Support

This package relies on the [*Web Bluetooth API*](
    https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API
) for accessing Bluetooth from the browser.
At the time of writing only Chromium based browsers such as Chrome, Edge
and Opera have support for these APIs.

On Linux, you need to enable Web Bluetooth support with this flag:
`chrome://flags/#enable-web-bluetooth`.

*Note:*
Currently all our testing is being done with Chrome on Windows.

## Getting Started

To install the package:
```sh
npm i @systemic-games/pixels-web-connect
```

Start by calling the `requestPixel` function to request the user to select
a Pixel die to connect to.

This function returns a `Pixel` object.
Call the `connect` asynchronous method to initiate a Bluetooth connection with
the die.

The `Pixel` class has a number of methods to retrieve information about the
die state. It also let you add a listener for any Pixel message.

### Communicating With Pixels

```JavaScript
import {
    repeatConnect,
	requestPixel,
	Color,
} from "@systemic-games/pixels-web-connect";

// Ask user to select a Pixel
const pixel = await requestPixel();

// Connect to die
console.log("Connecting...");
await repeatConnect(pixel);

// Get last roll state
const rollState = pixel.rollState;
console.log(`=> roll state: ${rollState.state}, face up: ${rollState.face}`);

// Read RSSI (signal strength)
const rssi = await pixel.queryRssi();
console.log(`=> rssi: ${rssi}`);
// And battery level
console.log(`=> Battery: ${pixel.batteryLevel}%`);

// Make LEDs flash a color
await pixel.blink(Color.red);

// Add listener to get notified on rolls
pixel.addEventListener("roll", (face) => {
	console.log(`=> rolled face: ${face}`);
});
```

### Playing Animations

Classes to manipulate animation data are available in a separate package:
[*@systemic-games/pixels-edit-animation*](
    https://www.npmjs.com/package/@systemic-games/pixels-edit-animation
).

```JavaScript
import {
  createDataSetForAnimation,
  EditAnimationRainbow,
} from "@systemic-games/pixels-edit-animation";

// Create a simple rainbow animation
const editDataSet = createDataSetForAnimation(
    new EditAnimationRainbow({
        duration: 3,
        count: 2,
        fade: 0.5,
    })
);

// And play it on the Pixel die
await pixel.playTestAnimation(editDataSet.toDataSet());
```

## React Hooks

See the [*@systemic-games/pixels-react*](../pixels-react) package.

## Example

We've made a mini dice game "Odd Or Even", checkout the source code [here](
    https://github.com/GameWithPixels/PixelsWebDemo
).

## Module documentation

To get more in depth information about this package see the module's export
documentation [here](
    https://gamewithpixels.github.io/pixels-js/modules/_systemic_games_pixels_web_connect.html
).

Documentation generated with [TypeDoc](https://typedoc.org/).

## Known Issues

On Windows 10, the OS notifies of a Bluetooth peripheral being disconnected a few
seconds (around 4) before the peripheral actually gets the disconnection event.
This will make a re-connection attempt to fail if made before that delay as the
peripheral will still disconnect after this 4 seconds delay.
Using [`repeatConnect()`](
    https://gamewithpixels.github.io/pixels-js/functions/_systemic_games_pixels_web_connect.repeatConnect.html
) function is a good workaround as it will attempt to connect a few times before
failing.

## License

MIT

---

Made with [Example TypeScript Package](
    https://github.com/tomchen/example-typescript-package
).
