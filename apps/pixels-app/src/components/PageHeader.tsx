import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, IconButton } from "react-native-paper";

export interface PageHeaderProps extends React.PropsWithChildren {
  mode?: "arrow-left" | "chevron-down";
  onGoBack?: () => void;
  leftElement?: () => React.ReactNode;
  rightElement?: () => React.ReactNode;
}

export function PageHeader({
  children,
  mode = "arrow-left",
  onGoBack,
  leftElement,
  rightElement,
}: PageHeaderProps) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        height: 50,
      }}
    >
      {typeof children === "string" ? (
        <Text variant="titleMedium">{children}</Text>
      ) : (
        children
      )}
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          flexDirection: "row",
          alignItems: "center",
          justifyContent:
            leftElement ?? onGoBack ? "space-between" : "flex-end",
        }}
      >
        {leftElement
          ? leftElement()
          : onGoBack && (
              <IconButton
                icon={({ size, color }) => (
                  <MaterialCommunityIcons
                    name={mode}
                    size={size}
                    color={color}
                    style={{ padding: 5, marginLeft: -5 }} // Making the touchable surface bigger
                  />
                )}
                size={mode === "arrow-left" ? 24 : 30}
                onPress={onGoBack}
              />
            )}
        {rightElement?.()}
      </View>
    </View>
  );
}
