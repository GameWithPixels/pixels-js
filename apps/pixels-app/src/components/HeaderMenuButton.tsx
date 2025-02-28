import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { useWindowDimensions, View } from "react-native";
import {
  IconButton,
  Menu,
  MenuProps,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { ViewProps } from "react-native-svg/lib/typescript/fabric/utils";

import { getBorderRadius } from "~/features/getBorderRadius";

export interface HeaderMenuButtonProps
  extends Omit<MenuProps, "anchor" | "theme" | "style"> {
  style?: ViewProps["style"];
  menuStyle?: MenuProps["style"];
  onShowMenu: () => void;
  onSelect?: () => void;
}

export function HeaderMenuButton({
  onShowMenu,
  onSelect,
  style,
  menuStyle,
  ...props
}: HeaderMenuButtonProps) {
  const { width } = useWindowDimensions();
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness);
  const height = 36;
  const color = props.visible ? colors.onSurfaceDisabled : colors.onSurface;
  return (
    <View
      style={[{ flexDirection: "row", alignItems: "center", gap: 6 }, style]}
    >
      {onSelect && (
        <TouchableRipple
          sentry-label="header-bar-select"
          borderless
          style={{ height: height - 6, borderRadius }}
          onPress={onSelect}
        >
          <Text
            variant="bodySmall"
            style={{
              height: "100%",
              paddingHorizontal: 14,
              lineHeight: height - 6, // Same as height to center text vertically
              color: colors.onSurface,
              borderRadius,
              borderWidth: 1,
              borderColor: colors.outline,
              backgroundColor: colors.background,
              textAlign: "center",
            }}
          >
            Select
          </Text>
        </TouchableRipple>
      )}
      {/* Make bigger pressable area */}
      <IconButton
        sentry-label="header-bar-show-menu"
        mode="outlined"
        iconColor={color}
        size={height - 14}
        icon={({ color, size }) => (
          <MaterialCommunityIcons
            name="dots-horizontal"
            color={color}
            size={size}
          />
        )}
        style={{ margin: 0 }}
        onPress={onShowMenu}
      />
      <Menu
        anchor={{ x: width - 10, y: height + 6 }}
        style={menuStyle}
        {...props}
      />
    </View>
  );
}
