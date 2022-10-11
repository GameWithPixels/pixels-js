// eslint-disable-next-line import/namespace
import { StyleSheet, View } from "react-native";

import { sr } from "~/styles";

export default function () {
  return <View style={styles.spacer} />;
}

const styles = StyleSheet.create({
  spacer: {
    marginVertical: sr(5),
  },
});
