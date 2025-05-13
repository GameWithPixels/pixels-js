import { assertNever } from "@systemic-games/pixels-core-utils";

import { AppActionType } from "../store";

export function getAppActionTypeLabel(type: AppActionType): string {
  switch (type) {
    case "speak":
      return "Speak Rolls";
    case "url":
      return "URL";
    case "json":
      return "JSON";
    case "discord":
      return "Discord";
    case "dddice":
      return "dddice";
    case "twitch":
      return "Twitch";
    case "proxy":
      return "Proxy";
    default:
      assertNever(type, `Unknown action kind: ${type}`);
  }
}
