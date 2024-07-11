import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ThemeProvider } from "react-native-paper";

import { ErrorFallback } from "./ErrorFallback";

import { useAppTheme } from "~/hooks";
import { RootScreenName } from "~/navigation";

export function NavigationRoot({
  children,
  screenName,
}: React.PropsWithChildren<{ screenName: RootScreenName }>) {
  const theme = useAppTheme(screenName);
  return (
    <ThemeProvider theme={theme}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        {children}
      </ErrorBoundary>
    </ThemeProvider>
  );
}
