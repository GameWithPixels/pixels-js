import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * The different available web request formats.
 * @enum
 */
export const WebRequestFormatValues = {
  parameters: enumValue(0),
  json: enumValue(),
  discord: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link ColorModeValues}.
 */
export type WebRequestFormat = keyof typeof WebRequestFormatValues;
