import { assertNever } from "@systemic-games/pixels-core-utils";
import { FC, PropsWithChildren, useCallback, useState } from "react";

import {
  TaskOperation,
  TaskCanceledError,
  TaskFaultedError,
  TaskAction,
  TaskStatus,
} from "./useTask";

export type TaskStatusCallback = (status: TaskStatus) => void;

export type TaskComponentProps = PropsWithChildren<{
  action: TaskAction;
  onTaskStatus?: TaskStatusCallback;
}>;

export type TaskComponent = FC<TaskComponentProps>;

export default function (
  testName: string,
  cancel: boolean,
  taskComponent: TaskComponent
): [TaskOperation, FC] {
  const [onTaskStatus, setOnTaskStatus] = useState<TaskStatusCallback>();
  const [resetCounter, setResetCounter] = useState(0);
  const asyncOp = useCallback(() => {
    let hasCompleted = false;
    return new Promise<void>((resolve, reject) =>
      setOnTaskStatus(() => (s: TaskStatus) => {
        switch (s) {
          case "pending":
          case "running":
            if (hasCompleted) {
              // TODO not a great way of having the callback to be recreated
              setResetCounter(resetCounter + 1);
            }
            break;
          case "succeeded":
          case "faulted":
          case "canceled":
            hasCompleted = true;
            if (s === "succeeded") {
              resolve();
            } else {
              reject(
                s === "canceled"
                  ? new TaskCanceledError(testName)
                  : new TaskFaultedError(testName)
              );
            }
            break;
          default:
            assertNever(s);
        }
      })
    );
  }, [resetCounter, testName]);
  return [
    asyncOp,
    useCallback(
      (props: PropsWithChildren) =>
        taskComponent({
          ...props,
          action: cancel ? "cancel" : "run",
          onTaskStatus,
        }),
      [cancel, onTaskStatus, taskComponent]
    ),
  ];
}
