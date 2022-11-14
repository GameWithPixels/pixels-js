/**
 * Return the name corresponding to a given Pixel enum value.
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
