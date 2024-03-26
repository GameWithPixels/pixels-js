export type DfuAvailability = "unknown" | "outdated" | "up-to-date";

export function getDieDfuAvailability(
  onDieFirmwareTimestamp: number,
  comparisonTimestamp?: number
): DfuAvailability {
  return !comparisonTimestamp
    ? "unknown"
    : onDieFirmwareTimestamp < comparisonTimestamp
      ? "outdated"
      : "up-to-date";
}
