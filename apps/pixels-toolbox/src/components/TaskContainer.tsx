import { Center, VStack, Text, Spinner, HStack } from "native-base";

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
    <VStack ml={isSubTask ? "10%" : undefined}>
      {title && (
        <HStack>
          <Center w="10%">
            {taskStatus === "running" ? (
              <Spinner />
            ) : (
              <Text>{getTaskResultEmoji(taskStatus)}</Text>
            )}
          </Center>
          <Text fontWeight={isSubTask ? "normal" : undefined}>{title}</Text>
        </HStack>
      )}
      {taskStatus !== "succeeded" && children}
    </VStack>
  );
}
