import * as Sentry from "@sentry/react-native";
import React from "react";
import { FallbackProps } from "react-error-boundary";
import { Button, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  React.useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  const { colors } = useTheme();
  return (
    <SafeAreaView
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
        mode="contained-tonal"
        textColor={colors.error}
        onPress={resetErrorBoundary}
      >
        Continue
      </Button>
    </SafeAreaView>
  );
}
