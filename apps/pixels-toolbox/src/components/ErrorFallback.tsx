import * as Sentry from "@sentry/react-native";
import React from "react";
import { FallbackProps } from "react-error-boundary";
//import { Button, Text, useTheme } from "react-native-paper";
import { Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  // React.useEffect(() => {
  //   Sentry.captureException(error);
  // }, [error]);
  //const { colors } = useTheme();
  return (
    <SafeAreaView
      style={{
        padding: 20,
        alignItems: "center",
      }}
    >
      <Text>
        Error!
      </Text>
      <Text>
        {error.message}
      </Text>
      <Button
        title="Continue"
        onPress={resetErrorBoundary}
      />
    </SafeAreaView>
  );
}
