import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ViewProps } from "react-native";
import { Text, TouchableRipple, useTheme } from "react-native-paper";

export function OnOffButton({
  enabled,
  style,
  ...props
}: {
  enabled?: boolean;
  style?: ViewProps["style"];
} & Omit<React.ComponentProps<typeof TouchableRipple>, "children" | "style">) {
  const { colors } = useTheme();
  return (
    <TouchableRipple
      style={[
        {
          width: 80,
          paddingVertical: 5,
          alignItems: "center",
          backgroundColor: colors.backdrop,
        },
        style,
      ]}
      {...props}
    >
      <>
        <MaterialCommunityIcons
          name={enabled ? "power" : "power-off"}
          size={32}
          color={enabled ? colors.primary : colors.onSurface}
        />
        <Text variant="bodySmall">{enabled ? "enabled" : "disabled"}</Text>
      </>
    </TouchableRipple>
  );
}
