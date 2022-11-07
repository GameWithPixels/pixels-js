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
      <VStack
        bg="coolGray.600"
        w="95%"
        borderColor="warmGray.400"
        borderWidth="2"
        p="2"
        rounded="md"
      >
        <TaskContainer title={title} taskStatus={taskStatus}>
          {children}
        </TaskContainer>
      </VStack>
    </Center>
  );
}
