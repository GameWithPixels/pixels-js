import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { Menu, MenuProps, Text, useTheme } from "react-native-paper";

import { iOSBorderRadiusFix } from "~/fixes";

export interface HeaderMenuButtonProps
  extends Omit<MenuProps, "anchor" | "theme"> {
  onShowMenu: () => void;
  onSelect?: () => void;
}

export function HeaderMenuButton({
  onShowMenu,
  onSelect,
  ...props
}: HeaderMenuButtonProps) {
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
        <Pressable
          sentry-label="header-bar-select"
          style={{ padding }}
          onPress={onSelect}
        >
          <Text
            variant="bodySmall"
            style={{
              ...iOSBorderRadiusFix,
              height,
              paddingHorizontal: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.outline,
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
      <Pressable
        sentry-label="header-bar-show-menu"
        style={{ padding }}
        onPress={onShowMenu}
      >
        <MaterialCommunityIcons
          name="dots-horizontal"
          size={height - 8}
          color={color}
          style={{
            ...iOSBorderRadiusFix,
            padding: 2,
            borderRadius: height / 2,
            borderWidth: 1,
            borderColor: color,
            backgroundColor,
            textAlign: "center",
            textAlignVertical: "center",
          }}
        />
      </Pressable>
      <Menu anchor={{ x: width - 20, y: height + 10 }} {...props} />
    </View>
  );
}
