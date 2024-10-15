import { Text as PaperText, TextProps } from "react-native-paper";

export function Title(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="titleLarge" {...props} />;
}

export function Body(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="bodyLarge" {...props} />;
}

export function Remark(props: Omit<TextProps<never>, "variant">) {
  return <PaperText {...props} />;
}
