export const ValidationFormFactors = [
  "boardNoCoil",
  "board",
  "die",
  "dieFinal",
] as const;
export type ValidationFormFactor = (typeof ValidationFormFactors)[number];

export function getBoardOrDie(
  formFactor: ValidationFormFactor
): "board" | "die" {
  return formFactor.startsWith("die") ? "die" : "board";
}

export function isBoard(formFactor: ValidationFormFactor): boolean {
  return getBoardOrDie(formFactor) === "board";
}
