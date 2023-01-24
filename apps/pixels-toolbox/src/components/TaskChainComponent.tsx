import { Center, Text, VStack } from "native-base";
import { PropsWithChildren } from "react";

import TaskContainer from "./TaskContainer";

import TaskChain from "~/features/tasks/TaskChain";

export interface TaskChainComponentProps extends PropsWithChildren {
  title: string;
  taskChain: TaskChain;
}

export default function ({ title, taskChain }: TaskChainComponentProps) {
  const taskStatus = taskChain.status;
  return (
    <Center w="100%" py="3">
      <VStack variant="card" w="95%" p="2">
        <TaskContainer title={title} taskStatus={taskStatus}>
          {taskStatus === "faulted" ? (
            <Text>{`${taskChain.lastError}`}</Text>
          ) : (
            taskStatus !== "succeeded" && taskChain.render()
          )}
        </TaskContainer>
      </VStack>
    </Center>
  );
}
