export const ValidationSequences = [
  "firmwareUpdate",
  "boardNoCoil",
  "board",
  "die",
  "dieFinal",
] as const;

export type ValidationSequence = (typeof ValidationSequences)[number];

export function getBoardOrDie(sequence: ValidationSequence): "board" | "die" {
  return sequence.startsWith("die") ? "die" : "board";
}

export function isBoard(sequence: ValidationSequence): boolean {
  return getBoardOrDie(sequence) === "board";
}
