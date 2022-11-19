import TaskChain from "./TaskChain";
import { TaskOperation, TaskAction, TaskRenderer } from "./useTask";

export default function (
  action: TaskAction,
  asyncOp: TaskOperation,
  taskRenderer: TaskRenderer
): TaskChain {
  return new TaskChain(action, asyncOp, taskRenderer);
}
