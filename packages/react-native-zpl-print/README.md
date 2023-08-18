# react-native-zpl-print

Converts HTML contents to ZPL instructions and send them to a Bluetooth printer.

## Installation

```sh
npm install @systemic-games/react-native-zpl-print
```

Note: this package is using iZettle's [android-html2bitmap](
  https://github.com/iZettle/android-html2bitmap
) package to render HTML into an bitmap.

## Usage

```ts
import { printHtml } from "@systemic-games/react-native-zpl-print";

// Print HTML on Xprinter
const html = "<html><body><p>Hello world!</p><br/>Html bitmap</body><html>";
const result = await printHtml("XP-", html);
if (result === "success") {
  console.log("Printing done!");
} else {
  console.log("Printing failed: " + result);
}
```

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
