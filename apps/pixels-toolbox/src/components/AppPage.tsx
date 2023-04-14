import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { View } from "react-native";
import { useTheme } from "react-native-paper";

import ErrorFallback from "./ErrorFallback";

// Note: call useErrorHandler() only in child components, not in the component
// rendering the AppPage as it will crash when handling an error.
export function AppPage({ children }: React.PropsWithChildren) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: theme.colors.background,
      }}
    >
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        {children}
      </ErrorBoundary>
    </View>
  );
}
