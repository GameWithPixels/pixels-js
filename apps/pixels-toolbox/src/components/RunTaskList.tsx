import React, { useCallback, useEffect, useRef, useState } from "react";

export type TaskResult = "success" | "fail";

export interface TaskResultComponentProps {
  children?: JSX.Element | JSX.Element[];
  result?: TaskResult;
}

export type TaskResultComponent = React.FC<TaskResultComponentProps>;

export interface TaskInfo {
  task: () => Promise<unknown>;
  component?: TaskResultComponent;
}

export type TaskListResult = TaskResult | "cancel";

export interface TaskListResultComponentProps {
  children?: JSX.Element | JSX.Element[];
  result?: TaskListResult;
}

export type TaskListResultComponent = React.FC<TaskListResultComponentProps>;

export interface RunTaskListProps {
  children?: JSX.Element | JSX.Element[];
  tasks: TaskInfo[];
  component?: TaskListResultComponent;
  cancel?: boolean;
  onCompleted?: (status: TaskListResult) => void;
}

// Tasks are read on first render and stored.
export default function ({
  children,
  tasks,
  component,
  cancel,
  onCompleted,
}: RunTaskListProps) {
  const [result, setResult] = useState<TaskListResult>();
  const tasksToRunRef = useRef(tasks);
  const isCanceledRef = useRef(false);
  if (cancel) {
    isCanceledRef.current = true;
  }
  const [tasksCmps, setTasksCmps] = useState<React.FC[]>([]);
  const onTaskCompleted = useCallback((result: TaskResult) => {
    if (isCanceledRef.current) {
      setResult("cancel");
    } else if (result === "success") {
      setTasksCmps((tasksCmps) => {
        const next = tasksToRunRef.current[tasksCmps.length];
        if (next) {
          const cmp = createTaskCmp(next.task, onTaskCompleted, next.component);
          return [...tasksCmps, cmp];
        } else {
          setResult(result);
          return tasksCmps;
        }
      });
    } else {
      setResult(result);
    }
  }, []);
  // Start
  useEffect(() => {
    onTaskCompleted("success");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Notify
  useEffect(() => {
    if (result) {
      onCompleted?.(result);
    }
  }, [onCompleted, result]);
  const tasksComponents = tasksCmps.map((c, i) =>
    React.createElement(c, { key: i })
  );
  return (
    <>
      {component?.({ result, children: tasksComponents })}
      {children}
    </>
  );
}

function createTaskCmp(
  task: () => Promise<unknown>,
  // onResolvedRef: React.MutableRefObject<
  //   ((result: TaskResult) => void) | undefined
  // >,
  onCompleted?: (result: TaskResult) => void,
  component?: TaskResultComponent
): React.FC {
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
