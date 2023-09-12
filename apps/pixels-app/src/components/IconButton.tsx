import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  BaseBoxProps,
  BaseButton,
} from "@systemic-games/react-native-pixels-components";
import React from "react";
import { TouchableRippleProps, useTheme } from "react-native-paper";

interface IconButtonProps extends BaseBoxProps {
  icon: "add" | "delete";
  onPress?: TouchableRippleProps["onPress"];
}

export default function ({ icon, onPress, ...flexProps }: IconButtonProps) {
  const theme = useTheme();
  return (
    <BaseButton onPress={onPress} paddingVertical={3} {...flexProps}>
      {icon === "add" ? (
        <Ionicons
          name="add-circle-outline"
          size={24}
          color={theme.colors.onBackground}
        />
      ) : (
        <MaterialCommunityIcons
          name="delete-circle-outline"
          size={24}
          color={theme.colors.onBackground}
        />
      )}
    </BaseButton>
  );
}
