import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { Menu, MenuProps, Text, useTheme } from "react-native-paper";

export function HeaderBar({
  onShow,
  onSelect,
  ...props
}: { onShow: () => void; onSelect?: () => void } & Omit<
  MenuProps,
  "anchor" | "theme"
>) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const height = 26;
  const padding = 7;
  const color = props.visible ? colors.onSurfaceDisabled : colors.onSurface;
  const backgroundColor = colors.background;
  return (
    <View
      style={{
        position: "absolute",
        right: 0,
        flexDirection: "row",
      }}
    >
      {onSelect && (
        <Pressable style={{ padding }} onPress={onSelect}>
          <Text
            variant="bodySmall"
            style={{
              height,
              paddingHorizontal: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.outline,
              overflow: "hidden", // For border radius to work on iOS
              color: colors.onSurface,
              backgroundColor,
              lineHeight: height, // Same as height to center text vertically
            }}
          >
            Select
          </Text>
        </Pressable>
      )}
      {/* Make bigger pressable area */}
      <Pressable style={{ padding }} onPress={onShow}>
        <MaterialCommunityIcons
          name="dots-horizontal"
          size={height - 8}
          color={color}
          style={{
            padding: 2,
            borderRadius: height / 2,
            borderWidth: 1,
            borderColor: color,
            overflow: "hidden", // For border radius to work on iOS
            backgroundColor,
            textAlign: "center",
            textAlignVertical: "center",
          }}
        />
      </Pressable>
      <Menu anchor={{ x: width - 20, y: 80 }} {...props} />
    </View>
  );
}
