import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "react-native-paper";

export function CopyToClipboardButton({
  text,
  size,
}: {
  text: string;
  size: number;
}) {
  const { colors } = useTheme();
  return (
    <MaterialCommunityIcons
      name="content-copy"
      size={size}
      color={colors.onSurface}
      onPress={() => {
        if (text?.length) {
          Clipboard.setStringAsync(text).catch((e: Error) =>
            console.log(`Clipboard error: ${e}`)
          );
        }
      }}
    />
  );
}
