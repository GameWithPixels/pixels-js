import { FC, PropsWithChildren, useEffect, useState } from "react";

export type TaskStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "faulted"
  | "canceled";

export type TaskAction = "run" | "cancel" | "reset";

export type TaskRendererProps = PropsWithChildren<{
  taskStatus: TaskStatus;
}>;

export type TaskRenderer = FC<TaskRendererProps>;

export type TaskOperation = (abortSignal: AbortSignal) => Promise<unknown>;

export class TaskCanceledError extends Error {
  constructor(testName: string) {
    super(`Task ${testName} canceled`);
  }
}

export class TaskFaultedError extends Error {
  constructor(testName: string) {
    super(`Task ${testName} faulted`);
  }
}

export default function (
  asyncOp: TaskOperation,
  taskRenderer: TaskRenderer,
  action: TaskAction = "run"
): [TaskStatus, FC<PropsWithChildren>, Error?] {
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [lastError, setLastError] = useState<Error>();
  useEffect(() => {
    setLastError(undefined);
    if (action === "run") {
      setStatus("running");
      const updateStatus = (newStatus: TaskStatus) =>
        setStatus((status) => (status !== "running" ? status : newStatus));
      const abortCtrl = new AbortController();
      asyncOp(abortCtrl.signal)
        .then(() => !abortCtrl.signal.aborted && updateStatus("succeeded"))
        .catch((error) => {
          console.log(
            `Task error (with aborted: ${abortCtrl.signal.aborted})`,
            error
          );
          setLastError(error);
          if (error instanceof TaskCanceledError) {
            updateStatus("canceled");
          } else if (!abortCtrl.signal.aborted) {
            updateStatus("faulted");
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
  }, [asyncOp, action]);
  return [
    status,
    ({ children }) => taskRenderer({ children, taskStatus: status }),
    lastError,
  ];
}
