import React from "react";
import { useTranslation } from "react-i18next";
import { Card, Text, useTheme } from "react-native-paper";

import { TaskContainer } from "./TaskContainer";

import { LocalizedError } from "~/features/LocalizedError";
import { TaskCanceledError, TaskChain } from "~/features/tasks";

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
  const getMessage = (error?: Error): string =>
    error instanceof LocalizedError
      ? (error as LocalizedError).toLocalizedString(t)
      : error instanceof TaskCanceledError
        ? t("canceled")
        : (error?.message ?? (error ? String(error) : ""));
  return (
    <Card>
      <Card.Content>
        <TaskContainer title={title} taskStatus={taskStatus}>
          {taskStatus === "faulted" || taskStatus === "canceled"
            ? !!taskChain.lastError && (
                // Show error message if any
                <Text variant="titleLarge" style={{ color: colors.error }}>
                  {getMessage(taskChain.lastError)}
                </Text>
              )
            : taskStatus !== "succeeded" && taskChain.render()}
        </TaskContainer>
        {children}
      </Card.Content>
    </Card>
  );
}
