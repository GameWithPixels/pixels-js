import { useEffect } from "react";
import { useErrorHandler } from "react-error-boundary";

export default function (error?: Error): void {
  const errorHandler = useErrorHandler();
  useEffect(() => {
    if (error) {
      errorHandler(error);
    }
  }, [errorHandler, error]);
}
