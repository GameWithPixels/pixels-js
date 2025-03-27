import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import * as Clipboard from "expo-clipboard";
import { View } from "react-native";
import { TextInput, useTheme } from "react-native-paper";

import { getBorderRadius } from "~/features/getBorderRadius";

export function TextInputWithCopyButton({
  value,
  mode,
  onChangeText,
}: {
  value: string;
  mode?: "default" | "bottomSheet";
  onChangeText?: (text: string) => void;
}) {
  const Input = mode === "bottomSheet" ? BottomSheetTextInput : TextInput;
  const { colors, fonts, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  const contentStyle = {
    borderWidth: 1,
    borderRadius,
    borderColor: colors.primary,
  } as const;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 10,
        gap: 10,
      }}
    >
      <Input
        maxLength={500}
        value={value}
        onChangeText={onChangeText}
        mode="outlined"
        style={{
          flex: 1,
          flexGrow: 1,
          backgroundColor: colors.elevation.level1,
          ...(mode === "bottomSheet"
            ? {
                paddingVertical: 16, // MD3_MIN_HEIGHT = 56,
                paddingHorizontal: 16, // MD3_INPUT_PADDING_HORIZONTAL
                color: colors.onSurfaceVariant,
                ...fonts.bodyLarge,
                ...contentStyle,
              }
            : {}),
        }}
        contentStyle={contentStyle}
      />
      <MaterialCommunityIcons
        name="content-copy"
        size={20}
        color={colors.onSurface}
        onPress={() => {
          if (value?.length) {
            Clipboard.setStringAsync(value).catch((e: Error) =>
              console.log(`Clipboard error: ${e}`)
            );
          }
        }}
      />
    </View>
  );
}
