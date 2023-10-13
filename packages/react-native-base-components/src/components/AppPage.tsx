import React from "react";
import { View, ViewProps } from "react-native";
import { useTheme } from "react-native-paper";

/**
 * Props for AppPage component.
 */
export interface AppPageProps extends ViewProps {}

/**
 * App page container with a scroll view to create separate pages with custom theme.
 * @param props See {@link AppPageProps} for props parameters.
 */
export function AppPage({ style, ...props }: AppPageProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.background,
          width: "100%",
          height: "100%",
          flex: 1,
          paddingHorizontal: 2,
          paddingTop: 2,
        },
        style,
      ]}
      {...props}
    />
  );
}
