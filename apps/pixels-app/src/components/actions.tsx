import { MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons";
import {
  ActionTypeValues,
  ActionType,
} from "@systemic-games/pixels-core-connect";
import { assertNever } from "@systemic-games/pixels-core-utils";
import { StyleProp, TextStyle } from "react-native";

import AnimationsIcon from "#/icons/navigation/animations";
import SpeakIcon from "#/icons/profiles/speak";

export const actionTypes = (
  Object.keys(ActionTypeValues) as ActionType[]
).filter((t) => t !== "none");

function GlobeIcon({ size, color }: { size: number; color: string }) {
  return <MaterialCommunityIcons name="web" size={size} color={color} />;
}

function FileAudioIcon({ size, color }: { size: number; color: string }) {
  return <FontAwesome name="file-sound-o" size={size} color={color} />;
}

export function getActionTypeIcon(
  type: ActionType
):
  | (({ size, color }: { size: number; color: string }) => React.JSX.Element)
  | undefined {
  switch (type) {
    case "none":
      return undefined;
    case "playAnimation":
      return AnimationsIcon;
    case "playSound":
      return FileAudioIcon;
    case "textToSpeech":
      return SpeakIcon;
    case "webRequest":
      return GlobeIcon;
    default:
      assertNever(type);
  }
}

export function ActionTypeIcon({
  type,
  size,
  style,
}: {
  type: ActionType;
  size: number;
    style: StyleProp<TextStyle>;
}) {
  const Icon = getActionTypeIcon(type);
  // @ts-ignore
  return Icon ? <Icon size={size} color={style.color} style={style} /> : null;
}
