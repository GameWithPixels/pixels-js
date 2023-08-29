import { TaskStatus } from "./useTask";

export type TaskResult = "succeeded" | "failed" | "canceled";

export function getTaskResult(taskStatus: TaskStatus): TaskResult | undefined {
  switch (taskStatus) {
    case "succeeded":
    case "canceled":
      return taskStatus;
    case "faulted":
      return "failed";
    // Otherwise return undefined
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
