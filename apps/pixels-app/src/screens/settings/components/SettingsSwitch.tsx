import { StyleSheet, View } from "react-native";
import { Switch, useTheme, SwitchProps } from "react-native-paper";

import { Body } from "./text";

export function SettingsSwitch({
  children,
  ...props
}: Exclude<SwitchProps, "trackColor">) {
  const { colors } = useTheme();
  return (
    <View style={styles.switchContainer}>
      <Switch
        trackColor={{
          false: colors.onSurfaceDisabled,
          true: colors.primary,
        }}
        {...props}
      />
      <Body>{children}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    gap: 10,
  },
});
