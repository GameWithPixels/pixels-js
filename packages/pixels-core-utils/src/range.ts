/**
 * Creates a sequence of numbers.
 * @param startOrStop An integer number specifying at which position to start,
 *                    or if `stop` is undefined, at which position to stop (starting at 0).
 * @param stop Optional. An integer number specifying at which position to stop (not included).
 * @param step Optional. An integer number specifying the incrementation. Default is 1.
 * @returns A sequence of numbers.
 */
export function range(
  startOrStop: number,
  stop?: number,
  step?: number
): number[] {
  // Check parameters
  let start = startOrStop;
  if (stop === undefined) {
    stop = startOrStop;
    start = 0;
  }
  if (!step) {
    // Step can't be 0 or undefined
    step = 1;
  }
  let length = (stop - start) / step;
  if (length < 0) {
    length = -length;
    step = -step;
  }
  // Create array
  const arr = Array(Math.floor(length)) as number[];
  // And initialize its values
  let v = start,
    i = 0;
  while (i < length) {
    arr[i] = v;
    v += step;
    i += 1;
  }
  return arr;
}
