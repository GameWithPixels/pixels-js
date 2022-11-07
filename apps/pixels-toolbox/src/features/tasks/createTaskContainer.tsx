import { ReactNode } from "react";

import { TaskRenderer } from "./useTask";

import TaskContainer from "~/components/TaskContainer";

export function createTaskStatusContainer(
  title?: string,
  children?: ReactNode,
  alwaysShowChildren = false
): TaskRenderer {
  return (props) => (
    <TaskContainer title={title} {...props} isSubTask>
      {(alwaysShowChildren || props.taskStatus === "running") && children}
    </TaskContainer>
  );
}
