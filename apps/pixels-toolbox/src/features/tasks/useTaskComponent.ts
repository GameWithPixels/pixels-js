import { assertNever } from "@systemic-games/pixels-core-utils";
import React from "react";

import {
  TaskOperation,
  TaskCanceledError,
  TaskFaultedError,
  TaskAction,
  TaskStatus,
} from "./useTask";

export type TaskStatusCallback = (status: TaskStatus) => void;

export type TaskComponentProps = React.PropsWithChildren<{
  action: TaskAction;
  onTaskStatus?: TaskStatusCallback;
}>;

export type TaskComponent = React.FC<TaskComponentProps>;

export default function (
  testName: string,
  cancel: boolean,
  taskComponent: TaskComponent
): [TaskOperation, React.FC] {
  const [onTaskStatus, setOnTaskStatus] = React.useState<TaskStatusCallback>();
  const [resetCounter, setResetCounter] = React.useState(0);
  const asyncOp = React.useCallback(() => {
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
    React.useCallback(
      (props: React.PropsWithChildren) =>
        taskComponent({
          ...props,
          action: cancel ? "cancel" : "run",
          onTaskStatus,
        }),
      [cancel, onTaskStatus, taskComponent]
    ),
  ];
}
