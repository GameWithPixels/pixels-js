import { FallbackProps } from "react-error-boundary";
// eslint-disable-next-line import/namespace
import { StyleSheet, Text, View, Button } from "react-native";

import globalStyles, { sr } from "~/styles";

export default function ({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.textBold}>Error!</Text>
      <Text style={styles.textBold}>{error.message}</Text>
      <Button title="Hide" onPress={resetErrorBoundary} />
    </View>
  );
}

const styles = StyleSheet.create({
  ...globalStyles,
  errorBox: {
    backgroundColor: "red",
    borderRadius: globalStyles.box.borderRadius,
    width: "98%",
    marginVertical: sr(5),
    paddingVertical: sr(10),
    alignItems: "center",
    justifyContent: "space-between",
  },
});
