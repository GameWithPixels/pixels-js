import { TextInput, TextInputProps, useTheme } from "react-native-paper";

import AppStyles from "~/AppStyles";

const Icon = <TextInput.Icon icon="pen" />;

export function TextInputClear({
  isTitle,
  ...props
}: {
  isTitle?: boolean;
} & Pick<
  TextInputProps,
  "placeholder" | "value" | "onChangeText" | "multiline"
>) {
  const theme = useTheme();
  return (
    <TextInput
      right={Icon}
      dense
      mode="outlined"
      style={isTitle ? theme.fonts.titleLarge : undefined}
      outlineStyle={{
        borderWidth: undefined,
        backgroundColor: undefined,
      }}
      contentStyle={AppStyles.textCentered}
      {...props}
    />
  );
}
