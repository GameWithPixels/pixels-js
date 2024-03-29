import { MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons";
import { assertNever } from "@systemic-games/pixels-core-utils";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { StyleProp, TextStyle } from "react-native";

import AnimationsIcon from "#/icons/navigation/animations";
import SpeakIcon from "#/icons/profiles/speak";

function GlobeIcon({ size, color }: { size: number; color?: string }) {
  return <MaterialCommunityIcons name="web" size={size} color={color} />;
}

function FileAudioIcon({ size, color }: { size: number; color?: string }) {
  return <FontAwesome name="file-sound-o" size={size} color={color} />;
}

export function getActionTypeIcon(
  type: Profiles.ActionType
):
  | (({
      size,
      color,
    }: {
      size: number;
      color?: string;
      style?: StyleProp<TextStyle>;
    }) => React.JSX.Element)
  | undefined {
  switch (type) {
    case "none":
      return undefined;
    case "playAnimation":
      return AnimationsIcon;
    case "playAudioClip":
      return FileAudioIcon;
    case "makeWebRequest":
      return GlobeIcon;
    case "speakText":
      return SpeakIcon;
    default:
      assertNever(type);
  }
}

export function ActionTypeIcon({
  type,
  size,
  color,
  style,
}: {
  type: Profiles.ActionType;
  size: number;
  color?: string;
  style?: Omit<TextStyle, "color"> & { color: string };
}) {
  const Icon = getActionTypeIcon(type);
  return Icon ? (
    <Icon size={size} color={color ?? style?.color} style={style} />
  ) : null;
}
