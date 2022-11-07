import { ReactNode } from "react";

import { TaskRenderer } from "./useTask";

import TaskContainer from "~/components/TaskContainer";

export function createTaskStatusContainer(
  title?: string,
  children?: ReactNode
): TaskRenderer {
  return (props) => (
    <TaskContainer title={title} taskStatus={props.status} isSubTask>
      {children}
    </TaskContainer>
  );
}
