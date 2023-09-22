import React from "react";

import {
  TaskOperation,
  TaskAction,
  TaskRenderer,
  TaskStatus,
  useTask,
} from "./useTask";

interface TaskChainItem {
  status: TaskStatus;
  component: React.FC<React.PropsWithChildren>;
  error?: Error;
}

export default class TaskChain {
  private readonly _tasksItems: TaskChainItem[] = [];
  private readonly _action: TaskAction;

  get tasksCount(): number {
    return this._tasksItems.length;
  }

  get status(): TaskStatus {
    const numTasks = this._tasksItems.length;
    if (!numTasks || this._tasksItems[0].status === "pending") {
      return "pending";
    }
    // Check if some task is running
    if (this._tasksItems.findIndex((ti) => ti.status === "running") >= 0) {
      return "running";
    }
    // Otherwise find first task that is either faulted or canceled
    const i = this._tasksItems.findIndex(
      (ti) => ti.status === "faulted" || ti.status === "canceled"
    );
    if (i >= 0) {
      // Some task failed or was canceled
      return this._tasksItems[i].status;
    } else {
      const status = this._tasksItems[numTasks - 1].status;
      return status === "pending" ? "running" : status;
    }
  }

  get components(): React.FC<React.PropsWithChildren>[] {
    return this._tasksItems.map((ti) => ti.component);
  }

  get lastError(): Error | undefined {
    return this._tasksItems.find((ti) => !!ti.error)?.error;
  }

  constructor(action: TaskAction) {
    this._action = action;
  }

  getStatusAt(index: number): TaskStatus | undefined {
    return this._tasksItems[index].status;
  }

  getComponentAt(index: number): React.FC<React.PropsWithChildren> | undefined {
    return this._tasksItems[index].component;
  }

  render(showPendingTasks = false): JSX.Element {
    return (
      <>
        {this._tasksItems.map((ti, key) => (
          <React.Fragment key={key}>
            {(showPendingTasks || ti.status !== "pending") && ti.component({})}
          </React.Fragment>
        ))}
      </>
    );
  }

  withTask(
    asyncOp: TaskOperation,
    taskRenderer: TaskRenderer,
    opt?: { skip?: boolean }
  ): TaskChain {
    const numTasks = this._tasksItems.length;
    const prevTaskSucceeded = numTasks
      ? this._tasksItems[numTasks - 1]?.status === "succeeded"
      : true;
    const action = !prevTaskSucceeded ? "reset" : this._action;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [status, component, error] = useTask(asyncOp, taskRenderer, action);
    if (!opt?.skip) {
      this._tasksItems.push({ status, component, error });
    }
    return this;
  }

  withStatusChanged(onStatusChanged?: (result: TaskStatus) => void): TaskChain {
    const status = this.status;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      onStatusChanged?.(status);
    }, [onStatusChanged, status]);
    return this;
  }
}
