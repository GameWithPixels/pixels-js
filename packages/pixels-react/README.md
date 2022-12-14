# Pixels React (Typescript)

## Example

```Typescript
import { usePixelStatus, usePixelValue } from "@systemic-games/pixels-react";
import { Pixel } from "@systemic-games/pixels-web-connect";

function PixelRollResult({ pixel }: { pixel: Pixel }) {
  const status = usePixelStatus(pixel);
  const [rollResult] = usePixelValue(pixel, "roll");

  useEffect(() => {
    if (status === "ready") {
      // Log battery state
      console.log(
        `${pixel.name} => battery: ${pixel.batteryLevel}, isCharging: ${pixel.isCharging}`
      );
      // Log roll state
      console.log(
        `${pixel.name} => initial roll state: ${pixel.rollState}, face ${pixel.currentFace}`
      );
    }
  }, [pixel, status]);

  useEffect(() => {
    if (rollResult) {
      // We log the result of each roll just for demonstration purposes
      // but this where you would want to act on a roll result.
      console.log(`Pixel ${pixel.name} rolled a ${rollResult.face}`);
    }
  }, [rollResult, pixel]);

  return (
    <div>
      <text>
        Pixel {pixel.name} status: {status}
      </text>
      {!!rollResult && <text>Roll result: {rollResult.face}</text>}
    </div>
  );
};
```

## Module documentation

See the module's export documentation [here](
    https://gamewithpixels.github.io/pixels-js/modules/_systemic_games_pixels_react.html
).

Documentation is generated with [TypeDoc](https://typedoc.org/).

## License

MIT

---

Made with [Example TypeScript Package](
    https://github.com/tomchen/example-typescript-package
).
