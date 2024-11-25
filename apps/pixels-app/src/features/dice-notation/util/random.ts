export type Random = (min: number, max: number) => number;

function random(min: number, max: number): number {
  return Math.floor(Math.random() * Math.floor(max - min + 1)) + min;
}

export default random;
