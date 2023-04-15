import { PropsWithChildren } from "react";
import { Card, Text, useTheme } from "react-native-paper";

import TaskContainer from "./TaskContainer";

import TaskChain from "~/features/tasks/TaskChain";

export interface TaskChainComponentProps extends PropsWithChildren {
  title: string;
  taskChain: TaskChain;
}

export default function ({ title, taskChain }: TaskChainComponentProps) {
  const taskStatus = taskChain.status;
  const theme = useTheme();
  return (
    <Card>
      <Card.Content>
        <TaskContainer title={title} taskStatus={taskStatus}>
          {taskStatus === "faulted" ? (
            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.error }}
            >{`${taskChain.lastError}`}</Text>
          ) : (
            taskStatus !== "succeeded" && taskChain.render()
          )}
        </TaskContainer>
      </Card.Content>
    </Card>
  );
}
