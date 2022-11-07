import { TaskStatus } from "./useTask";

export type TaskResult = "succeeded" | "faulted" | "canceled";

export function getTaskResult(taskStatus: TaskStatus): TaskResult | undefined {
  switch (taskStatus) {
    case "succeeded":
    case "faulted":
    case "canceled":
      return taskStatus;
  }
}

export function isTaskCompleted(taskStatus: TaskStatus) {
  return !!getTaskResult(taskStatus);
}

export function getTaskResultEmoji(
  taskStatus?: TaskStatus | TaskResult
): string {
  return taskStatus === "succeeded"
    ? "☑️"
    : taskStatus === "faulted"
    ? "❌"
    : taskStatus === "canceled"
    ? "⚠️"
    : "";
}
