import * as Sentry from "@sentry/react-native";
import React from "react";
import { FallbackProps } from "react-error-boundary";
import { ScrollView } from "react-native";
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
        padding: 10,
        alignItems: "center",
      }}
    >
      <ScrollView>
        <Button
          mode="contained-tonal"
          textColor={colors.error}
          style={{ marginBottom: 20 }}
          onPress={resetErrorBoundary}
        >
          Continue
        </Button>
        <Text variant="headlineMedium" style={{ color: colors.error }}>
          Error!
        </Text>
        <Text
          variant="bodyLarge"
          style={{ color: colors.error, marginVertical: 30 }}
        >
          {error?.message ?? String(error ?? "")}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
