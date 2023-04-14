import { FallbackProps } from "react-error-boundary";
import { View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

export default function ({ error, resetErrorBoundary }: FallbackProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.errorContainer,
        padding: 20,
        alignItems: "center",
      }}
    >
      <Text variant="headlineMedium" style={{ color: theme.colors.error }}>
        Error!
      </Text>
      <Text
        variant="bodyLarge"
        style={{ color: theme.colors.error, marginVertical: 30 }}
      >
        {error.message}
      </Text>
      <Button
        mode="outlined"
        textColor={theme.colors.error}
        onPress={resetErrorBoundary}
      >
        Continue
      </Button>
    </View>
  );
}
