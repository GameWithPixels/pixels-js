import { assert, range } from "@systemic-games/pixels-core-utils";
import {
  EditPattern,
  EditRgbGradient,
  extractKeyframes,
  Json,
} from "@systemic-games/pixels-edit-animation";
import { Color, ColorUtils } from "@systemic-games/react-native-pixels-connect";
import { toByteArray } from "base64-js";
import * as FileSystem from "expo-file-system";
import { decode } from "fast-png";

import { ensureAssetReadableAsync } from "~/features/duplicated/ensureAssetReadableAsync";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function checkLegacyPattern(name: string): void {
  const originalData: Json.DataSet = require(
    `!/profiles/default-profile-d20.json`
  );
  const originalPattern = originalData.patterns?.find((p) => p.name === name);
  if (originalPattern) {
    originalPattern?.gradients?.forEach((g, i) =>
      console.log(`Keyframes count on line ${i}: ${g.keyframes?.length}`)
    );
    console.log(
      "Total keyframes count: " +
        originalPattern?.gradients?.reduce(
          (a, g) => a + (g.keyframes?.length ?? 0),
          0
        )
    );
    console.log(
      "Total color count: " +
        new Set(
          originalPattern?.gradients?.flatMap((g) =>
            g.keyframes?.map(
              (kf) =>
                ColorUtils.colorBytesToString(
                  kf?.color?.r!,
                  kf?.color?.g!,
                  kf?.color?.b!
                ) ?? []
            )
          ) ?? []
        ).size
    );
  } else {
    console.log(
      `Pattern '${name}' not found among ${originalData?.patterns?.map(
        (p) => p.name
      )}`
    );
  }
}

export async function createPatternFromImage(
  virtualAssetModule: string | number
): Promise<EditPattern> {
  const asset = await ensureAssetReadableAsync(
    virtualAssetModule,
    "some-pattern.png"
  );
  if (!asset.localUri) {
    throw new Error("No localUri");
  }
  const data = await FileSystem.readAsStringAsync(asset.localUri, {
    encoding: "base64",
  });
  const binaryData = toByteArray(data).buffer; // Faster than Buffer.from()
  const png = decode(binaryData);
  console.log(
    `Loaded PNG ${png.width} x ${png.height} with ${png.channels} channels => ${png.data.length} bytes`
  );
  assert(
    png.height === 20,
    `Expected pattern image height is 20 but got ${png.height}`
  );
  assert(
    png.channels === 3 || png.channels === 4,
    `Expected pattern image to have 3 or 4 channels but got ${png.channels}`
  );
  assert(
    png.width * png.height * png.channels === png.data.length,
    "Pattern image data length does not match expected size"
  );
  const lineByteSize = png.data.length / png.height;
  return new EditPattern({
    gradients: range(png.height).map((i) => {
      const line = png.data.slice(i * lineByteSize, (i + 1) * lineByteSize);
      const pixels: Color[] = [];
      for (let j = 0; j < png.channels * png.width; j += png.channels) {
        pixels.push(
          new Color(line[j] / 255, line[j + 1] / 255, line[j + 2] / 255)
        );
      }
      return new EditRgbGradient({
        keyframes: extractKeyframes(pixels),
      });
    }),
  });
}
