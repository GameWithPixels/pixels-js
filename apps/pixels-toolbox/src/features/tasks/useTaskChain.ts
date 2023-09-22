import TaskChain from "./TaskChain";
import { TaskAction } from "./useTask";

export function useTaskChain(action: TaskAction): TaskChain {
  return new TaskChain(action);
}
