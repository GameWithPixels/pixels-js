import { StyleSheet } from "react-native";
import { Button, ButtonProps } from "react-native-paper";

export function EmojiButton(props: ButtonProps) {
  return <Button labelStyle={styles.text} mode="outlined" {...props} />;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 24,
    lineHeight: undefined,
    marginVertical: undefined,
    marginHorizontal: undefined,
  },
});
