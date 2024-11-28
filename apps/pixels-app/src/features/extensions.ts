import {
  assert,
  getValueKeyName,
  safeAssign,
} from "@systemic-games/pixels-core-utils";
import {
  Pixel,
  PixelColorwayValues,
  PixelDieTypeValues,
  StoreValue,
  StoreValueAck,
  StoreValueResult,
  StoreValueResultValues,
} from "@systemic-games/react-native-pixels-connect";

// TODO Copy of Toolbox code

function log(pixel: Pixel, message: string): void {
  console.log(`[Pixel ${pixel.name}] ${message}`);
}

/* List of codes for the store values' types. */
export const PixelValueStoreType = {
  dieType: 1,
  colorway: 2,
  runMode: 3,
  validationTimestampStart: 0xa0,
} as const;

/**
 * Requests the Pixel to to store the given value.
 * @param pixel The Pixel instance to use.
 * @param valueType The type of the value to write (8 bits).
 * @param value The value to write (24 bits)
 * @returns A promise that resolves to the result of the store operation.
 */
export async function pixelStoreValue(
  pixel: Pixel,
  valueType: number,
  value: number
): Promise<StoreValueResult> {
  // Check boundaries
  assert(valueType > 0 && valueType <= 0xff);
  assert(value >= 0 && value <= 0xffffff);
  // Build value to send
  const storeValue = ((valueType << 24) | value) >>> 0;
  // And send it to die
  const ack = (await pixel.sendAndWaitForResponse(
    safeAssign(new StoreValue(), { value: storeValue }),
    "storeValueAck"
  )) as StoreValueAck;
  // Check result
  const result =
    getValueKeyName(ack.result, StoreValueResultValues) ?? "unknownError";
  log(
    pixel,
    `Store value 0x${storeValue.toString(16)} of type` +
      ` 0x${valueType.toString(16)} => ${result} (${ack.result}),` +
      ` index: ${ack.index}`
  );
  // Update Pixel instance
  if (result === "success") {
    switch (valueType) {
      case PixelValueStoreType.dieType: {
        const dieType = getValueKeyName(value, PixelDieTypeValues) ?? "unknown";
        log(pixel, `Updating die type to ${dieType}`);
        //@ts-expect-error Private function
        pixel._updateDieType(
          // Pass function parameter on next line to have TS check typing
          dieType
        );
        break;
      }
      case PixelValueStoreType.colorway: {
        const colorway =
          getValueKeyName(value, PixelColorwayValues) ?? "unknown";
        log(pixel, `Updating colorway to ${colorway}`);
        //@ts-expect-error Private function
        pixel._updateColorway(
          // Pass function parameter on next line to have TS check typing
          colorway
        );
        break;
      }
    }
  }
  return result;
}
