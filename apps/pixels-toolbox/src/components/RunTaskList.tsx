import React, { useCallback, useEffect, useRef, useState } from "react";

export type TaskResult = "success" | "fail";

export interface TaskResultComponentProps {
  children?: JSX.Element | JSX.Element[];
  result?: TaskResult;
}

export type TaskResultComponent =
  React.FunctionComponent<TaskResultComponentProps>;

export interface TaskInfo {
  task: () => Promise<unknown>;
  component?: TaskResultComponent;
}

export type TaskListResult = TaskResult | "cancel";

export interface TaskListResultComponentProps {
  children?: JSX.Element | JSX.Element[];
  result?: TaskListResult;
}

export type TaskListResultComponent =
  React.FunctionComponent<TaskListResultComponentProps>;

export interface RunTaskListProps {
  children?: JSX.Element | JSX.Element[];
  tasks: TaskInfo[];
  component?: TaskListResultComponent;
  cancel?: boolean;
  onCompleted?: (status: TaskListResult) => void;
}

export default function (props: RunTaskListProps) {
  const [result, setResult] = useState<TaskListResult>();
  // const onResolvedRef = useRef<(result: TaskResult) => void>();
  // const [stepsToRun] = useState((): React.FunctionComponent[] =>
  //   props.tasks.map((t) => createTask(t.task, onResolvedRef, t.component))
  // );
  const tasksToRun = useRef(props.tasks);
  const isCanceledRef = useRef(false);
  const [tasks, setTasks] = useState<React.FunctionComponent[]>([]);
  const onCompleted = useCallback((result: TaskResult) => {
    if (isCanceledRef.current) {
      setResult("cancel");
    } else if (result === "success") {
      setTasks((tasks) => {
        const next = tasksToRun.current[tasks.length];
        if (next) {
          const task = createTask(next.task, onCompleted, next.component);
          return [...tasks, task];
        } else {
          setResult(result);
        }
        return tasks;
      });
    } else {
      setResult(result);
    }
  }, []);
  if (props.cancel) {
    isCanceledRef.current = true;
  }
  // Start
  useEffect(() => {
    if (!isCanceledRef.current) {
      onCompleted("success");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const children = tasks.map((c, i) => React.createElement(c, { key: i }));
  return <>{props.component?.({ children, result })}</>;
}

function createTask(
  task: () => Promise<unknown>,
  // onResolvedRef: React.MutableRefObject<
  //   ((result: TaskResult) => void) | undefined
  // >,
  onCompleted?: (result: TaskResult) => void,
  component?: TaskResultComponent
): React.FunctionComponent {
  return () => {
    const [result, setResult] = useState<TaskResult>();
    useEffect(() => {
      task()
        .then(() => {
          setResult("success");
          onCompleted?.("success");
        })
        .catch((error: any) => {
          console.warn("runTaskList error:", error);
          setResult("fail");
          onCompleted?.("fail");
        });
    }, []);
    return <>{component?.({ result })}</>;
  };
}
