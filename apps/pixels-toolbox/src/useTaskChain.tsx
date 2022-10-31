import TaskChain from "~/TaskChain";
import { AsyncOperation, TaskAction, TaskComponent } from "~/useTask";

export default function (
  action: TaskAction,
  asyncOp: AsyncOperation,
  taskComponent: TaskComponent
): TaskChain {
  return new TaskChain(action, asyncOp, taskComponent);
}
