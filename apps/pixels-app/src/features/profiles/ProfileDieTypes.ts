import { PixelDieType } from "@systemic-games/react-native-pixels-connect";

export const ProfileDieTypes: readonly PixelDieType[] = Object.freeze([
  "d20",
  "d12",
  "d10",
  "d8",
  "d6",
  "d4",
]);

// Return list of dice that are compatible with the given die type
// This functions is useful to get list of dice types compatible with a given profile
export function getCompatibleDieTypes(
  profileDieType?: PixelDieType
): PixelDieType[] {
  switch (profileDieType) {
    case undefined:
    case "unknown":
      return [];
    case "d6":
    case "d6pipped":
    case "d6fudge":
      return ["d6", "d6pipped", "d6fudge"];
    case "d00":
    case "d10":
      return ["d10", "d00"];
    default:
      return [profileDieType];
  }
}

// Returns a die type listed in ProfileDieTypes that is compatible with the given die type
export function toProfileDieType(dieType: PixelDieType): PixelDieType {
  switch (dieType) {
    case "d6pipped":
    case "d6fudge":
      return "d6";
    case "d00":
      return "d10";
    default:
      return dieType;
  }
}
