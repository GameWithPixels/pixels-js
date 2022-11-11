/**
 * Return the name corresponding to a given Pixel enum value.
 */
export default function <EnumType>(
  value: EnumType,
  enumValues: { [s: string]: EnumType }
): string | undefined {
  for (const [key, val] of Object.entries(enumValues)) {
    if (val === value) {
      return key;
    }
  }
}
