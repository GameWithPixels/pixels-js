// https://dirask.com/posts/JavaScript-convert-string-to-bytes-array-UTF-8-1XkbEj
function toBytes(text: string): number[] {
  const result = [];
  for (let i = 0; i < text.length; i += 1) {
    const hi = text.charCodeAt(i);
    if (hi < 0x0080) {
      // code point range: U+0000 - U+007F
      // bytes: 0xxxxxxx
      result.push(hi);
      continue;
    }
    if (hi < 0x0800) {
      // code point range: U+0080 - U+07FF
      // bytes: 110xxxxx 10xxxxxx
      result.push(0xc0 | (hi >> 6), 0x80 | (hi & 0x3f));
      continue;
    }
    if (hi < 0xd800 || hi >= 0xe000) {
      // code point range: U+0800 - U+FFFF
      // bytes: 1110xxxx 10xxxxxx 10xxxxxx
      result.push(
        0xe0 | (hi >> 12),
        0x80 | ((hi >> 6) & 0x3f),
        0x80 | (hi & 0x3f)
      );
      continue;
    }
    i += 1;
    if (i < text.length) {
      // surrogate pair
      const lo = text.charCodeAt(i);
      const code = ((0x00010000 + (hi & 0x03ff)) << 10) | (lo & 0x03ff);
      // code point range: U+10000 - U+10FFFF
      // bytes: 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
      result.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    } else {
      break;
    }
  }
  return result;
}

export function encodeUtf8(str: string): Uint8Array {
  return new Uint8Array(toBytes(str));
}
