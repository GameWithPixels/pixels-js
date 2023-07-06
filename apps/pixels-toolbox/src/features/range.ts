// Similar to Python range (but limited to numbers)
// https://www.w3schools.com/python/ref_func_range.asp
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
