import { Center, VStack } from "native-base";
import { PropsWithChildren } from "react";

import TaskContainer from "./TaskContainer";

import { TaskStatus } from "~/features/tasks/useTask";

export interface TaskGroupContainerProps extends PropsWithChildren {
  title: string;
  taskStatus: TaskStatus;
}

export default function ({
  children,
  title,
  taskStatus,
}: TaskGroupContainerProps) {
  return (
    <Center w="100%" py="3">
      <VStack variant="card" w="95%" p="2">
        <TaskContainer title={title} taskStatus={taskStatus}>
          {taskStatus !== "succeeded" && children}
        </TaskContainer>
      </VStack>
    </Center>
  );
}
