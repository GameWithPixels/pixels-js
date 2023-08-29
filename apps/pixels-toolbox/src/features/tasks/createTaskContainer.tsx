import React from "react";

import { TaskRenderer } from "./useTask";

import { TaskContainer } from "~/components/TaskContainer";

export function createTaskStatusContainer(
  args:
    | string
    | {
        title?: string;
        children?: React.ReactNode;
        alwaysShowChildren?: boolean;
      }
): TaskRenderer {
  const isStr = typeof args === "string";
  const title = isStr ? args : args.title;
  const children = isStr ? undefined : args.children;
  const alwaysShowChildren = isStr ? false : args.alwaysShowChildren;
  return (props) => (
    <TaskContainer title={title} {...props} isSubTask>
      {(alwaysShowChildren || props.taskStatus === "running") && children}
    </TaskContainer>
  );
}
