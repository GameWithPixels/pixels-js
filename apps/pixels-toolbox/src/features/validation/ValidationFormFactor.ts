export const ValidationFormFactors = ["boardNoCoil", "board", "die"] as const;
export type ValidationFormFactor = typeof ValidationFormFactors[number];

export function getBoardOrDie(
  formFactor: ValidationFormFactor
): "board" | "die" {
  return formFactor === "die" ? "die" : "board";
}

export function isBoard(formFactor: ValidationFormFactor): boolean {
  return getBoardOrDie(formFactor) === "board";
}
