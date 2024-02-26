// https://www.basedash.com/blog/javascript-string-to-bytes
function toBytes(str: string): number[] {
  const bytes = [];

  for (let i = 0; i < str.length; i++) {
    const codePoint = str.codePointAt(i)!;

    if (codePoint < 0x80) {
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint < 0x10000) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f)
      );
    } else {
      i++; // skip one iteration since we have a surrogate pair
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f)
      );
    }
  }
  return bytes;
}

export function encodeUtf8(str: string): Uint8Array {
  return new Uint8Array(toBytes(str));
}

// Async native alternative
// import { toByteArray } from "base64-js";
// new Promise((resolve, reject) => {
//   const reader = new FileReader();
//   reader.onloadend = () => {
//     const uri = reader.result?.toString();
//     if (uri) {
//       const data = uri.substring(
//         "data:application/octet-stream;base64,".length
//       );
//       resolve(toByteArray(data));
//     } else {
//       reject(new Error("Failed to encode string"));
//     }
//   };
//   reader.readAsDataURL(new Blob(["some string"]));
// });
