import * as Sentry from "@sentry/react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import React from "react";
import { FallbackProps } from "react-error-boundary";
import { ScrollView } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppStore } from "~/app/hooks";
import Pathname from "~/features/files/Pathname";
import { logError } from "~/features/utils";

async function exportData(data: unknown): Promise<void> {
  const uri = await Pathname.generateTempPathnameAsync(
    "pixels-app-data-",
    ".csv"
  );
  try {
    const json = JSON.stringify(data, null, 2);
    await FileSystem.writeAsStringAsync(uri, json);
    await Sharing.shareAsync(uri);
  } finally {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const store = useAppStore();
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
        <Button
          mode="outlined"
          textColor={colors.error}
          style={{ marginBottom: 20 }}
          onPress={() =>
            exportData(store.getState()).catch((e) =>
              logError(`Error exporting app data: ${e}`)
            )
          }
        >
          Export App Data
        </Button>
        <Text variant="headlineMedium" style={{ color: colors.error }}>
          Error!
        </Text>
        <Text
          variant="bodyLarge"
          style={{ color: colors.error, marginVertical: 30 }}
        >
          {error?.message ?? JSON.stringify(error ?? "")}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
