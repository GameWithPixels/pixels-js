export type DfuAvailability = "unknown" | "outdated" | "up-to-date";

export function getDieDfuAvailability(
  onDieFirmwareTimestamp?: number,
  comparisonTimestamp?: number
): DfuAvailability {
  return onDieFirmwareTimestamp === undefined ||
    comparisonTimestamp === undefined
    ? "unknown"
    : onDieFirmwareTimestamp < comparisonTimestamp
      ? "outdated"
      : "up-to-date";
}
