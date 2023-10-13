import React from "react";
import { Card, Text, useTheme } from "react-native-paper";

import { TaskContainer } from "./TaskContainer";

import TaskChain from "~/features/tasks/TaskChain";

export interface TaskChainComponentProps extends React.PropsWithChildren {
  title: string;
  taskChain: TaskChain;
}

export function TaskChainComponent({
  children,
  title,
  taskChain,
}: TaskChainComponentProps) {
  const taskStatus = taskChain.status;
  const { colors } = useTheme();
  return (
    <Card>
      <Card.Content>
        <TaskContainer title={title} taskStatus={taskStatus}>
          {taskStatus === "faulted" ? (
            <Text
              variant="titleLarge"
              style={{ color: colors.error }}
            >{`${taskChain.lastError}`}</Text>
          ) : (
            taskStatus !== "succeeded" && taskChain.render()
          )}
        </TaskContainer>
        {children}
      </Card.Content>
    </Card>
  );
}
