import { FC, PropsWithChildren, useEffect, useState } from "react";

export type TaskStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "faulted"
  | "canceled";

export type TaskAction = "run" | "cancel" | "reset";

export type TaskComponentProps = PropsWithChildren<{
  status: TaskStatus;
}>;

export type TaskComponent = FC<TaskComponentProps>;

export type AsyncOperation = () => Promise<unknown>;

export class CanceledError extends Error {
  constructor(testName: string) {
    super(`Task ${testName} canceled`);
  }
}

export class FaultedError extends Error {
  constructor(testName: string) {
    super(`Task ${testName} faulted`);
  }
}

export default function (
  asyncOp: AsyncOperation,
  taskComponent: TaskComponent,
  action: TaskAction = "run"
): [TaskStatus, FC<PropsWithChildren>] {
  const [status, setStatus] = useState<TaskStatus>("pending");
  useEffect(() => {
    if (action === "run") {
      setStatus("running");
      const updateStatus = (newStatus: TaskStatus) =>
        setStatus((status) => (status === "running" ? newStatus : status));
      let canceled = false;
      asyncOp()
        .then(() => !canceled && updateStatus("succeeded"))
        .catch((error) => {
          console.log(`Task error (with canceled: ${canceled})`, error);
          if (error instanceof CanceledError) {
            updateStatus("canceled");
          } else if (!canceled) {
            updateStatus("faulted");
          }
        });
      return () => {
        canceled = true;
        updateStatus("canceled");
      };
    } else if (action === "cancel") {
      // Cancellation is done on unmounting the effect (see code above)
    } else if (action === "reset") {
      setStatus("pending");
    }
  }, [asyncOp, action]);
  return [status, ({ children }) => taskComponent({ children, status })];
}
