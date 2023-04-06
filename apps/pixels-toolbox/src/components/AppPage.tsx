import { VStack } from "native-base";
import { PropsWithChildren } from "react";
import { ErrorBoundary } from "react-error-boundary";

import ErrorFallback from "./ErrorFallback";

// Note: call useErrorHandler() only in child components, not in the component
// rendering the AppPage as it will crash when handling an error.
export default function ({ children }: PropsWithChildren) {
  return (
    <VStack flex={1} width="100%" height="100%" variant="background">
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        {children}
      </ErrorBoundary>
    </VStack>
  );
}
