import TaskChain from "~/TaskChain";
import { AsyncOperation, TaskAction, TaskRenderer } from "~/useTask";

export default function (
  action: TaskAction,
  asyncOp: AsyncOperation,
  taskRenderer: TaskRenderer
): TaskChain {
  return new TaskChain(action, asyncOp, taskRenderer);
}
