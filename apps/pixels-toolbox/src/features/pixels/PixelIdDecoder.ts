export const RbgColorNames = ["red", "green", "blue"] as const;
export type RbgColor = (typeof RbgColorNames)[number];

const crcDivisor = "1011";
const crcBitCount = crcDivisor.length - 1;
const header: Readonly<RbgColor[]> = RbgColorNames;
const headerBitsCount = RbgColorNames.length;
const messageBitCount = headerBitsCount + crcBitCount + 32; // Pixel Id is 32 bits
const frameDuration = 33; // In milliseconds
const bitDuration = frameDuration * 3;
const blinkFrameRate = 30;
const messageFrameCount = (messageBitCount * bitDuration) / blinkFrameRate;

export function pixelIdToName(pixelId: number) {
  let name = "";
  for (let i = 0; i < 7; ++i) {
    name += (pixelId % 10).toString();
    pixelId = Math.floor(pixelId / 10);
  }
  return name;
}

export default class PixelIdDecoder {
  private _redValues: number[] = [];
  private _greenValues: number[] = [];
  private _blueValues: number[] = [];
  private _timeValues: number[] = [];
  private _lastFrameColor: RbgColor | undefined;

  // Message duration in ms
  get messageDuration(): number {
    return messageBitCount * bitDuration;
  }

  // Returns the last color processed by processFrameResult
  get lastFrameColor(): RbgColor | undefined {
    return this._lastFrameColor;
  }

  resetFrameResults(): void {
    this._redValues.length = 0;
    this._greenValues.length = 0;
    this._blueValues.length = 0;
    this._timeValues.length = 0;
  }

  processFrameResult(
    redAverage: number,
    greenAverage: number,
    blueAverage: number,
    timestamp: number
  ): number | undefined {
    // Keep the color averages and time values
    const numFrames = this._redValues.length;
    if (numFrames >= 2 * messageFrameCount) {
      this._redValues.shift();
      this._greenValues.shift();
      this._blueValues.shift();
      this._timeValues.shift();
    }
    this._redValues.push(redAverage);
    this._greenValues.push(greenAverage);
    this._blueValues.push(blueAverage);
    this._timeValues.push(timestamp);

    if (numFrames >= messageBitCount) {
      // First compute average for each color channel
      const redAvg = this._redValues.reduce((acc, v) => acc + v, 0) / numFrames;
      const greenAvg =
        this._greenValues.reduce((acc, v) => acc + v, 0) / numFrames;
      const blueAvg =
        this._blueValues.reduce((acc, v) => acc + v, 0) / numFrames;

      // Go through frames from the last to the first
      const colors: RbgColor[] = [];
      let lastColorTime = 0;
      for (let i = numFrames - 1; i >= 0; --i) {
        // Normalize color channels
        const r = this._redValues[i] / redAvg;
        const g = this._greenValues[i] / greenAvg;
        const b = this._blueValues[i] / blueAvg;
        const t = this._timeValues[i];
        // Get dominance for each channel
        const rd = r / Math.max(g, b);
        const gd = g / Math.max(r, b);
        const bd = b / Math.max(r, g);
        // Get dominant channel (if any)
        const threshold = 0.03; // 3%
        const color =
          rd - gd > threshold && rd - bd > threshold
            ? "red"
            : gd - rd > threshold && gd - bd > threshold
            ? "green"
            : bd - rd > threshold && bd - gd > threshold
            ? "blue"
            : undefined;
        if (!lastColorTime) {
          this._lastFrameColor = color;
        }
        if (color && (!colors.length || colors.at(-1) !== color)) {
          // Use color if different from last one
          colors.push(color);
          lastColorTime = t;
          // Check if we have already enough colors
          const len = colors.length;
          if (len >= messageBitCount) {
            // Check that the last colors match the expected header
            // (and which were emitted first as we traverse the color channels in reverse order)
            let equal = true;
            for (let j = 0; j < headerBitsCount && equal; ++j) {
              equal = colors[len - j - 1] === header[j];
            }
            if (equal) {
              // Decode the colors to get the Pixel id
              return this.decodeColors(
                colors.slice(len - messageBitCount, len).reverse()
              );
            }
          }
        } else if (lastColorTime - t > 2 * bitDuration) {
          // Reset if the color didn't change for a while
          colors.length = 0;
        }
      }
    }
  }

  private computeCrc(value: number): number {
    // 3-bit CRC
    // https://en.wikipedia.org/wiki/Cyclic_redundancy_check#Computation
    // We work with "binary" strings to avoid any issue using TypeScript
    // numbers(which are floating values)

    // Left shift the value by the CRC size
    const shiftedValue = value.toString(2) + "0".repeat(crcBitCount);
    let result = shiftedValue; // When we are done, this will be the CRC
    // Left shit the CRC divisor to match the of "result"
    let div = crcDivisor + "0".repeat(result.length - crcDivisor.length);
    do {
      // Do an XOR operation between "result" and "div"
      let xor = 0;
      for (let i = 0; i <= crcBitCount; ++i) {
        xor += (result[i] === div[i] ? 0 : 1) << (crcBitCount - i);
      }
      const xorStr = xor.toString(2);
      result = xorStr + result.substring(crcBitCount + 1, result.length);
      // Right shift "div" to match the new size of "result"
      div = div.substring(0, result.length);
    } while (result.length > crcBitCount);
    // Convert CRC string to number
    let crc = 0;
    for (let i = 0; i < result.length; ++i) {
      if (result[i] === "1") {
        crc += 1 << (result.length - 1 - i);
      }
    }
    return crc;
  }

  private decodeColors(colors: RbgColor[]): number | undefined {
    // We should get a sequence of colors, with never twice the same color
    // consecutively.
    // The sequence starts with a header, followed by the CRC and finally the data.
    // To decode the CRC and the data, we need to compare the current color
    // against the previous one in the sequence. If the it's the following
    // color with respect to the R,G,B order then it's a 0, if not it's a 1.
    let result = 0;
    let crc = 0;
    for (let i = 0; i < colors.length - headerBitsCount; ++i) {
      // Get the color index
      const i0 = RbgColorNames.indexOf(colors[headerBitsCount + i - 1]);
      const i1 = RbgColorNames.indexOf(colors[headerBitsCount + i]);
      // 1 if i1 follows i0 (with looping back from 2 to 0),
      // 0 otherwise
      const bit = i1 - i0 + (i0 > i1 ? 2 : -1);
      // Update crc if we are processing the first few bits,
      // otherwise update result
      if (bit) {
        // Note: we use exponential rather than bit shifting
        // because 1 << 31 returns -2147483648 instead of 2147483648
        if (i < crcBitCount) {
          crc += 2 ** i;
        } else {
          result += 2 ** (i - 3);
        }
      }
    }
    // Return result only if the CRC is valid
    return crc === this.computeCrc(result) ? result : undefined;
  }
}
