import { assertNever } from "@systemic-games/pixels-core-utils";
import React from "react";

import {
  TaskOperation,
  TaskCanceledError,
  TaskFaultedError,
  TaskAction,
  TaskStatus,
} from "./useTask";

export type TaskStatusCallback = (ev: {
  status: TaskStatus;
  error?: Error;
}) => void;

export type TaskComponentProps = React.PropsWithChildren<{
  action: TaskAction;
  onTaskStatus?: TaskStatusCallback;
}>;

export type TaskComponent = React.FC<TaskComponentProps>;

export function useTaskComponent(
  taskName: string,
  cancel: boolean,
  taskComponent: TaskComponent
): [TaskOperation, React.FC] {
  const [onTaskStatus, setOnTaskStatus] = React.useState<TaskStatusCallback>();
  const [resetCounter, setResetCounter] = React.useState(0);
  const asyncOp = React.useCallback(() => {
    let hasCompleted = false;
    return new Promise<void>((resolve, reject) =>
      setOnTaskStatus(
        () =>
          ((ev) => {
            switch (ev.status) {
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
                if (ev.status === "succeeded") {
                  resolve();
                } else {
                  reject(
                    ev.status === "canceled"
                      ? new TaskCanceledError(taskName)
                      : new TaskFaultedError(
                          taskName,
                          ev.error instanceof TaskFaultedError
                            ? ev.error.cause
                            : ev.error
                        )
                  );
                }
                break;
              default:
                assertNever(ev.status, `Unknown task status: ${ev.status}`);
            }
          }) as TaskStatusCallback
      )
    );
  }, [resetCounter, taskName]);
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
