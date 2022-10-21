import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useRef } from "react";

export type TaskCompletedCallback = (success: boolean) => void;

interface RunTasksParamsRef {
  canceled?: boolean;
  unmounted?: boolean;
  onCompleted?: TaskCompletedCallback;
}

function runTasks(
  tasks: (() => Promise<unknown>)[],
  paramsRef: RunTasksParamsRef
) {
  const runTasksSequentially = async () => {
    for (const task of tasks) {
      if (paramsRef.canceled) {
        throw new Error("Task canceled");
      }
      if (paramsRef.unmounted) {
        throw new Error("Tasks unmounted");
      }
      await task();
    }
  };
  runTasksSequentially()
    .then(() => paramsRef.onCompleted?.(true))
    .catch((error: any) => {
      console.warn("Task error:", error);
      if (!paramsRef.unmounted) {
        paramsRef.onCompleted?.(false);
      }
    });
}

export interface TasksRunnerProps {
  key?: React.Key | null;
  children?: JSX.Element | JSX.Element[];
  tasks: (() => Promise<unknown>)[];
  onCompleted?: TaskCompletedCallback;
  cancel?: boolean;
}

export default function (props: TasksRunnerProps) {
  const tasksRef = useRef(props.tasks);
  const paramsRef = useRef<RunTasksParamsRef>({});
  if (props.cancel) {
    paramsRef.current.canceled = true;
  }
  paramsRef.current.onCompleted = props.onCompleted;
  useFocusEffect(
    useCallback(() => {
      runTasks(tasksRef.current, paramsRef.current);
      return () => (paramsRef.current.unmounted = true);
    }, [])
  );
  return <>{props.children}</>;
}
