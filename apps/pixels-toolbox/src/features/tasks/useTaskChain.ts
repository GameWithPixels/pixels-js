import { TaskChain } from "./TaskChain";
import { TaskAction } from "./useTask";

export function useTaskChain(action: TaskAction, name?: string): TaskChain {
  return new TaskChain(action, name);
}
