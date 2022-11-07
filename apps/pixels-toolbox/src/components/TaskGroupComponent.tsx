import { Box, Center, VStack } from "native-base";
import { PropsWithChildren } from "react";

import TaskStatusComponent from "./TaskStatusComponent";

import { TaskStatus } from "~/features/tasks/useTask";

export interface TaskGroupComponentProps extends PropsWithChildren {
  title: string;
  taskStatus: TaskStatus;
}

export default function ({
  children,
  title,
  taskStatus,
}: TaskGroupComponentProps) {
  return (
    <Center w="100%" py="3">
      <Box
        bg="coolGray.600"
        w="95%"
        borderColor="warmGray.400"
        borderWidth="2"
        p="2"
        rounded="md"
      >
        <TaskStatusComponent title={title} taskStatus={taskStatus} />
        {taskStatus !== "succeeded" && <VStack>{children}</VStack>}
      </Box>
    </Center>
  );
}
