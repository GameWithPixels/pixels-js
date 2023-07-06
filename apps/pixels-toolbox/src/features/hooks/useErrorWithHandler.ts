import React from "react";
import { useErrorHandler } from "react-error-boundary";

export function useErrorWithHandler(error?: Error): void {
  const errorHandler = useErrorHandler();
  React.useEffect(() => {
    if (error) {
      errorHandler(error);
    }
  }, [errorHandler, error]);
}
