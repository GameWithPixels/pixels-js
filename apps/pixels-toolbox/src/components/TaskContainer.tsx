import {
  BaseBox,
  BaseHStack,
  BaseVStack,
} from "@systemic-games/react-native-base-components";
import { ActivityIndicator, Text } from "react-native-paper";

import { getTaskResultEmoji } from "~/features/tasks/TaskResult";
import { TaskRendererProps } from "~/features/tasks/useTask";

export interface TaskContainerProps extends TaskRendererProps {
  title?: string;
  isSubTask?: boolean;
}

export function TaskContainer({
  children,
  title,
  taskStatus,
  isSubTask,
}: TaskContainerProps) {
  return taskStatus === "pending" ? (
    <></>
  ) : (
    <BaseVStack gap={8} ml={isSubTask ? 35 : undefined}>
      {title && (
        <BaseHStack gap={8} alignItems="center">
          <BaseBox w={35} alignItems="center" justifyContent="center">
            {taskStatus === "running" ? (
              <ActivityIndicator />
            ) : (
              <Text variant="headlineMedium">
                {getTaskResultEmoji(taskStatus)}
              </Text>
            )}
          </BaseBox>
          <Text
            variant="titleLarge"
            style={{ fontWeight: isSubTask ? "normal" : "bold" }}
          >
            {title}
          </Text>
        </BaseHStack>
      )}
      {taskStatus !== "succeeded" && children}
    </BaseVStack>
  );
}
