/**
 * Returns the name corresponding for a given Pixel enum value.
 * @param value The Pixel enum value.
 * @param enumValues The object with for the Pixel enum.
 * @returns A string with the name corresponding to the enum value.
 */
export default function <EnumType, EnumNames extends string>(
  value: EnumType,
  enumValues: { [key in EnumNames]: EnumType }
): EnumNames | undefined {
  for (const [key, val] of Object.entries(enumValues)) {
    if (val === value) {
      return key as EnumNames;
    }
  }
}
