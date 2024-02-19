import React from "react";
import { useErrorBoundary } from "react-error-boundary";

export function useErrorWithHandler(error?: Error): void {
  const { showBoundary } = useErrorBoundary();
  React.useEffect(() => {
    if (error) {
      showBoundary(error);
    }
  }, [error, showBoundary]);
}
