/** Thrown by {@link decodeUtf8} function. */
export class DecodeUtf8Error extends Error {
  readonly decodedString: string;
  constructor(message: string, decodedString: string) {
    // Initialize instance
    super(message);
    this.name = "DecodeUtf8Error";
    this.decodedString = decodedString;
  }
}

/**
 * Takes a byte array and interpret it as a UTF8 string.
 * Copied from https://gist.github.com/pascaldekloe/62546103a1576803dade9269ccf76330
 * @param bytes Byte array with UTF8 string data.
 * @returns The decoded string.
 */
export function decodeUtf8(bytes: Uint8Array): string {
  let i = 0,
    s = "";
  while (i < bytes.length) {
    let c = bytes[i++];
    if (!c) {
      break;
    } else if (c > 127) {
      if (c > 191 && c < 224) {
        if (i >= bytes.length)
          throw new DecodeUtf8Error("Incomplete 2-bytes sequence", s);
        c = ((c & 31) << 6) | (bytes[i++] & 63);
      } else if (c > 223 && c < 240) {
        if (i + 1 >= bytes.length)
          throw new DecodeUtf8Error("Incomplete 3-bytes sequence", s);
        c = ((c & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
      } else if (c > 239 && c < 248) {
        if (i + 2 >= bytes.length)
          throw new DecodeUtf8Error("Incomplete 4-bytes sequence", s);
        c =
          ((c & 7) << 18) |
          ((bytes[i++] & 63) << 12) |
          ((bytes[i++] & 63) << 6) |
          (bytes[i++] & 63);
      } else
        throw new DecodeUtf8Error(
          `Unknown multibyte start 0x${c.toString(16)} at index ${i - 1}`,
          s
        );
    }
    if (c <= 0xffff) s += String.fromCharCode(c);
    else if (c <= 0x10ffff) {
      c -= 0x10000;
      s += String.fromCharCode((c >> 10) | 0xd800);
      s += String.fromCharCode((c & 0x3ff) | 0xdc00);
    } else
      throw new DecodeUtf8Error(
        `Code point 0x${c.toString(16)} exceeds UTF-16 reach`,
        s
      );
  }
  return s;
}
