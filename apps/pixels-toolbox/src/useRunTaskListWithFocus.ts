import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";

interface RunTasksParamsRef {
  canceled?: boolean;
  onCompleted?: (status: TaskListStatus) => void;
}

class TaskCanceledError extends Error {}

export type TaskListStatus = "success" | "fail" | "cancel";

function runTaskList(
  tasks: (() => Promise<unknown>)[],
  paramsRef: RunTasksParamsRef
) {
  const runTasksSequentially = async () => {
    for (const task of tasks) {
      if (paramsRef.canceled) {
        throw new TaskCanceledError("Tasks canceled");
      }
      await task();
    }
  };
  runTasksSequentially()
    .then(() => paramsRef.onCompleted?.("success"))
    .catch((error: any) => {
      console.warn("runTaskList error:", error);
      paramsRef.onCompleted?.(
        error instanceof TaskCanceledError ? "cancel" : "fail"
      );
    });
}

export default function (
  tasks: (() => Promise<unknown>)[] | (() => (() => Promise<unknown>)[]),
  cancel?: boolean
): TaskListStatus | undefined {
  const [status, setStatus] = useState<TaskListStatus>();
  const tasksRef = useRef(typeof tasks === "function" ? tasks() : tasks);
  const paramsRef = useRef<RunTasksParamsRef>({});
  if (cancel) {
    paramsRef.current.canceled = true;
  }
  paramsRef.current.onCompleted = setStatus;
  useFocusEffect(
    useCallback(() => {
      runTaskList(tasksRef.current, paramsRef.current);
      return () => (paramsRef.current.canceled = true);
    }, [])
  );
  return status;
}
