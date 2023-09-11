import { Button, ButtonProps, customText } from "react-native-paper";

const Text = customText<"emojiButton">();

export function EmojiButton({ children, ...props }: ButtonProps) {
  return (
    <Button {...props}>
      <Text variant="emojiButton">{children}</Text>
    </Button>
  );
}
