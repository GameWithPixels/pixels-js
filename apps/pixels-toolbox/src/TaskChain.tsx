import { FC, Fragment, PropsWithChildren, useEffect } from "react";

import useTask, {
  AsyncOperation,
  TaskAction,
  TaskRenderer,
  TaskStatus,
} from "~/useTask";

interface TaskChainItem {
  status: TaskStatus;
  component: FC<PropsWithChildren>;
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

  get components(): FC<PropsWithChildren>[] {
    return this._tasksItems.map((ti) => ti.component);
  }

  constructor(
    action: TaskAction,
    asyncOp: AsyncOperation,
    taskRenderer: TaskRenderer
  ) {
    this._action = action;
    this.chainWith(asyncOp, taskRenderer);
  }

  getStatusAt(index: number): TaskStatus | undefined {
    return this._tasksItems[index].status;
  }

  getComponentAt(index: number): FC<PropsWithChildren> | undefined {
    return this._tasksItems[index].component;
  }

  render(showPendingTasks = false): JSX.Element {
    return (
      <>
        {this._tasksItems.map((ti, key) => (
          <Fragment key={key}>
            {(showPendingTasks || ti.status !== "pending") && ti.component({})}
          </Fragment>
        ))}
      </>
    );
  }

  chainWith(asyncOp: AsyncOperation, taskRenderer: TaskRenderer): TaskChain {
    const numTasks = this._tasksItems.length;
    const prevTaskSucceeded = numTasks
      ? this._tasksItems[numTasks - 1]?.status === "succeeded"
      : true;
    const action = !prevTaskSucceeded ? "reset" : this._action;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [status, component] = useTask(asyncOp, taskRenderer, action);
    this._tasksItems.push({ status, component });
    return this;
  }

  withStatusChanged(onStatusChanged?: (result: TaskStatus) => void): TaskChain {
    const status = this.status;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      onStatusChanged?.(status);
    }, [onStatusChanged, status]);
    return this;
  }
}
