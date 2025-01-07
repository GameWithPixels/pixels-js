import { assertNever } from "@systemic-games/pixels-core-utils";
import { PixelDieType } from "@systemic-games/pixels-edit-animation";

import { DiceSetType } from "./DiceSetType";

export function getDiceSetDiceList(type: DiceSetType): PixelDieType[] {
  switch (type) {
    case "unknown":
      return [];
    case "rpg":
      return ["d20", "d12", "d00", "d10", "d8", "d6", "d4"];
    case "advantage":
      return ["d20", "d20", "d12", "d10", "d8", "d6", "d4"];
    case "boardGamer":
      return ["d20", "d12", "d10", "d8", "d6pipped", "d6pipped", "d4"];
    case "power":
      return ["d20", "d8", "d8", "d8", "d6", "d6", "d6"];
    case "fudge":
      return [
        "d6fudge",
        "d6fudge",
        "d6fudge",
        "d6fudge",
        "d6fudge",
        "d6fudge",
        "d6fudge",
      ];
    case "classicPippedD6":
      return [
        "d6pipped",
        "d6pipped",
        "d6pipped",
        "d6pipped",
        "d6pipped",
        "d6pipped",
        "d6pipped",
      ];
    case "initiativeD20":
      return ["d20", "d20", "d20", "d20", "d20", "d20", "d20"];
    case "rageD12":
      return ["d12", "d12", "d12", "d12", "d12", "d12", "d12"];
    case "divineD00":
      return ["d00", "d00", "d00", "d00", "d00", "d00", "d00"];
    case "eldritchD10":
      return ["d10", "d10", "d10", "d10", "d10", "d10", "d10"];
    case "smiteD8":
      return ["d8", "d8", "d8", "d8", "d8", "d8", "d8"];
    case "fireballD6":
      return ["d6", "d6", "d6", "d6", "d6", "d6", "d6"];
    case "healingD4":
      return ["d4", "d4", "d4", "d4", "d4", "d4", "d4"];
    default:
      assertNever(type);
  }
}
