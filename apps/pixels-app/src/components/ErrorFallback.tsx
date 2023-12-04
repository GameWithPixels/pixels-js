import { FallbackProps } from "react-error-boundary";
import { View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.errorContainer,
        padding: 20,
        alignItems: "center",
      }}
    >
      <Text variant="headlineMedium" style={{ color: colors.error }}>
        Error!
      </Text>
      <Text
        variant="bodyLarge"
        style={{ color: colors.error, marginVertical: 30 }}
      >
        {error.message}
      </Text>
      <Button
        mode="outlined"
        textColor={colors.error}
        onPress={resetErrorBoundary}
      >
        Continue
      </Button>
    </View>
  );
}
