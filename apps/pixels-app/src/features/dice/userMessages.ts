export function getFirmwareUpdateAvailable(diceCount?: number): string {
  return `A firmware update is available for your ${diceCount === 1 ? "die" : "dice"}.`;
}

export function getKeepAllDiceUpToDate(): string {
  return (
    "We recommend to keep all dice up-to-date to ensure that " +
    "they stay compatible with the app."
  );
}

export function getKeepDiceNearDevice(pixelsCount?: number): string {
  const diceStr = pixelsCount && pixelsCount <= 1 ? "die" : "dice";
  return (
    `Keep the Pixels app opened and your ${diceStr} near your device ` +
    "during the update process. They may stay in open chargers but avoid " +
    `moving charger lids or other magnets as it may turn the ${diceStr} off.`
  );
}
