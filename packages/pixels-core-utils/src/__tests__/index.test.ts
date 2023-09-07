import { decodeUtf8 } from "../decodeUtf8";
import { encodeUtf8 } from "../encodeUtf8";

test("UTF8 encoding/decoding", () => {
  expect(decodeUtf8(encodeUtf8("\u00E9"))).toBe("é");
  expect(decodeUtf8(encodeUtf8("正确"))).toBe("正确");
});

export {}; // Because of --isolatedModules Typescript config option
