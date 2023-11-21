import React from "react";
import { useTranslation } from "react-i18next";
import { Card, Text, useTheme } from "react-native-paper";

import { TaskContainer } from "./TaskContainer";

import { LocalizedError } from "~/features/LocalizedError";
import TaskChain from "~/features/tasks/TaskChain";
import { TaskCanceledError } from "~/features/tasks/useTask";

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
  const { t } = useTranslation();
  const getMessage = (error?: Error): string => {
    return error instanceof LocalizedError
      ? (error as LocalizedError).toLocalizedString(t)
      : error instanceof TaskCanceledError
      ? (error as TaskCanceledError).userMessage ?? t("canceled")
      : error?.message ?? String(error);
  };
  return (
    <Card>
      <Card.Content>
        <TaskContainer title={title} taskStatus={taskStatus}>
          {taskStatus === "faulted" || taskStatus === "canceled" ? (
            <Text variant="titleLarge" style={{ color: colors.error }}>
              {getMessage(taskChain.lastError)}
            </Text>
          ) : (
            taskStatus !== "succeeded" && taskChain.render()
          )}
        </TaskContainer>
        {children}
      </Card.Content>
    </Card>
  );
}
