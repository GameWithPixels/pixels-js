import * as Sentry from "@sentry/react-native";
import React from "react";

export type TaskStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "faulted"
  | "canceled";

export type TaskAction = "run" | "cancel" | "reset";

export type TaskRendererProps = React.PropsWithChildren<{
  taskStatus: TaskStatus;
}>;

export type TaskRenderer = React.FC<TaskRendererProps>;

export type TaskOperation = (abortSignal: AbortSignal) => Promise<unknown>;

export class TaskCanceledError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "TaskCanceledError";
  }
}

export class TaskFaultedError extends Error {
  readonly cause?: Error;
  constructor(message?: string, error?: Error) {
    super(message);
    this.name = "TaskFaultedError";
    this.cause = error;
  }
}

export function useTask(
  asyncOp: TaskOperation,
  taskRenderer: TaskRenderer,
  action: TaskAction = "run",
  name?: string
): [TaskStatus, React.FC<React.PropsWithChildren>, Error?] {
  const [status, setStatus] = React.useState<TaskStatus>("pending");
  const [lastError, setLastError] = React.useState<Error>();
  const nameRef = React.useRef(name);
  React.useEffect(() => {
    setLastError(undefined);
    if (action === "run") {
      setStatus("running");
      const updateStatus = (newStatus: TaskStatus) =>
        setStatus((status) => (status !== "running" ? status : newStatus));
      const abortCtrl = new AbortController();
      asyncOp(abortCtrl.signal)
        .then(() => !abortCtrl.signal.aborted && updateStatus("succeeded"))
        .catch((error) => {
          const name = nameRef.current;
          const errorMsg = `${name ?? "Task"} error [aborted: ${
            abortCtrl.signal.aborted
          }]: ${error}`;
          console.log(errorMsg);
          // Keep error
          setLastError(error);
          // Update status
          if (error instanceof TaskCanceledError) {
            updateStatus("canceled");
          } else if (!abortCtrl.signal.aborted) {
            updateStatus("faulted");
          }
          // Report error to Sentry
          if (name) {
            Sentry.captureMessage(errorMsg, "warning");
          }
        });
      return () => {
        abortCtrl.abort();
        updateStatus("canceled");
      };
    } else if (action === "cancel") {
      // Cancellation is done on unmounting the effect (see code above)
    } else if (action === "reset") {
      setStatus("pending");
    }
  }, [asyncOp, action, nameRef]);
  return [
    status,
    ({ children }) => taskRenderer({ children, taskStatus: status }),
    lastError,
  ];
}
