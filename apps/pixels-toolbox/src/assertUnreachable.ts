// https://stackoverflow.com/a/39419171
export default function (x: never): never {
  throw new Error("Didn't expect to get here");
}
