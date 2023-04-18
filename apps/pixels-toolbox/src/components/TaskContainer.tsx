import {
  FastBox,
  FastHStack,
  FastVStack,
} from "@systemic-games/react-native-base-components";
import { ActivityIndicator, Text } from "react-native-paper";

import { getTaskResultEmoji } from "~/features/tasks/TaskResult";
import { TaskRendererProps } from "~/features/tasks/useTask";

export interface TaskContainerProps extends TaskRendererProps {
  title?: string;
  isSubTask?: boolean;
}

export default function ({
  children,
  title,
  taskStatus,
  isSubTask,
}: TaskContainerProps) {
  return taskStatus === "pending" ? (
    <></>
  ) : (
    <FastVStack gap={8} ml={isSubTask ? "10%" : undefined}>
      {title && (
        <FastHStack gap={8} alignItems="center">
          <FastBox w="10%" alignItems="center" justifyContent="center">
            {taskStatus === "running" ? (
              <ActivityIndicator />
            ) : (
              <Text variant="headlineMedium">
                {getTaskResultEmoji(taskStatus)}
              </Text>
            )}
          </FastBox>
          <Text
            variant="titleLarge"
            style={{ fontWeight: isSubTask ? "normal" : "bold" }}
          >
            {title}
          </Text>
        </FastHStack>
      )}
      {taskStatus !== "succeeded" && children}
    </FastVStack>
  );
}
