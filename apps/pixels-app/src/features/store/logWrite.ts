export function logWrite(msg: string): void {
  if (__DEV__) {
    console.log(`Store Write ${msg}`);
  }
}
