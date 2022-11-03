import { FC, PropsWithChildren, useCallback, useState } from "react";

import assertUnreachable from "./assertUnreachable";
import {
  AsyncOperation,
  CanceledError,
  FaultedError,
  TaskAction,
  TaskStatus,
} from "./useTask";

export type TaskStatusCallback = (status: TaskStatus) => void;

export type TaskComponentProps = PropsWithChildren<{
  action: TaskAction;
  onTaskStatus: TaskStatusCallback;
}>;

export type TaskComponent = FC<TaskComponentProps>;

export default function (
  testName: string,
  run: boolean,
  taskComponent: TaskComponent
): [AsyncOperation, FC] {
  // Can't store TaskResultCallback in a state because the setter gets confused
  // and calls the new value (which is a function taking one argument) instead of storing it.
  // So we store an array of one value instead.
  const [onTaskStatus, setOnTaskStatus] = useState<TaskStatusCallback[]>([]);
  const [resetCounter, setResetCounter] = useState(0);
  const asyncOp = useCallback(() => {
    let hasCompleted = false;
    return new Promise<void>((resolve, reject) =>
      setOnTaskStatus([
        (s: TaskStatus) => {
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
                    ? new CanceledError(testName)
                    : new FaultedError(testName)
                );
              }
              break;
            default:
              assertUnreachable(s);
          }
        },
      ])
    );
  }, [resetCounter, testName]);
  return [
    asyncOp,
    useCallback(
      (props: PropsWithChildren) =>
        taskComponent({
          ...props,
          action: run ? "run" : "cancel",
          onTaskStatus: onTaskStatus[0],
        }),
      [run, onTaskStatus, taskComponent]
    ),
  ];
}
