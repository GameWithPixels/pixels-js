import { Center, VStack, Text, Spinner, HStack } from "native-base";
import { PropsWithChildren, ReactNode } from "react";

import { getTaskResultEmoji } from "~/features/tasks/TaskResult";
import { TaskRenderer, TaskStatus } from "~/features/tasks/useTask";

export interface TaskStatusComponentProps extends PropsWithChildren {
  title: string;
  taskStatus: TaskStatus;
  isSubTask?: boolean;
}

export default function TaskStatusComponent({
  children,
  title,
  taskStatus,
  isSubTask,
}: TaskStatusComponentProps) {
  return taskStatus === "pending" ? (
    <></>
  ) : (
    <VStack ml={isSubTask ? "10%" : undefined}>
      <HStack>
        <Center w="10%">
          {taskStatus === "running" ? (
            <Spinner />
          ) : (
            <Text>{getTaskResultEmoji(taskStatus)}</Text>
          )}
        </Center>
        <Text fontWeight={isSubTask ? "normal" : undefined}>{title}</Text>
      </HStack>
      {children}
    </VStack>
  );
}

export function createTaskStatusComponent(
  title: string,
  children?: ReactNode
): TaskRenderer {
  return (props) => (
    <TaskStatusComponent title={title} taskStatus={props.status} isSubTask>
      {children}
    </TaskStatusComponent>
  );
}
