import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ThemeProvider } from "react-native-paper";

import { ErrorFallback } from "./ErrorFallback";

import { RootScreenName } from "~/navigation";
import { getRootScreenTheme } from "~/themes";

export function NavigationRoot({
  children,
  screenName,
}: React.PropsWithChildren<{ screenName: RootScreenName }>) {
  return (
    <ThemeProvider theme={getRootScreenTheme(screenName)}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        {children}
      </ErrorBoundary>
    </ThemeProvider>
  );
}
