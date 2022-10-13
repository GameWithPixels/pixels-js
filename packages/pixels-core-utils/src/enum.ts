let _enumValue = 0;

/**
 * Number generator for enums.
 *
 * A note about enums:
 * Typescript documentation recommends using "as const" over "enum".
 * See https://www.typescriptlang.org/docs/handbook/enums.html#objects-vs-enums
 */
export function enumValue(initialValue?: number): number {
  if (initialValue !== undefined) {
    _enumValue = initialValue;
  }
  return _enumValue++;
}

let _enumFlag = 0;

/**
 * Number generator for enum flags.
 *
 * A note about enums:
 * Typescript documentation recommends using "as const" over "enum".
 * See https://www.typescriptlang.org/docs/handbook/enums.html#objects-vs-enums
 */
export function enumFlag(initialValue?: number): number {
  if (initialValue !== undefined) {
    _enumFlag = initialValue;
  }
  const flag = 1 << _enumFlag;
  _enumFlag += 1;
  return flag;
}
