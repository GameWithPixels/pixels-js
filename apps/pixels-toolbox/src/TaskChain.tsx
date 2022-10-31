import { FC, Fragment, PropsWithChildren, useEffect, useRef } from "react";

import useTask, {
  AsyncOperation,
  TaskAction,
  TaskComponent,
  TaskStatus,
} from "~/useTask";

export type TaskResult = "succeeded" | "faulted" | "canceled";

export type TaskResultCallback = (result: TaskResult) => void;

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
    if (!numTasks) {
      return "pending";
    }
    // Find first task that is either faulted or canceled
    const i = this._tasksItems.findIndex(
      (ti) => ti.status === "faulted" || ti.status === "canceled"
    );
    if (i >= 0) {
      return this._tasksItems[i].status; // Some task failed or was canceled
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
    taskComponent: TaskComponent
  ) {
    this._action = action;
    this.chainWith(asyncOp, taskComponent);
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

  chainWith(asyncOp: AsyncOperation, taskComponent: TaskComponent): TaskChain {
    const numTasks = this._tasksItems.length;
    const prevTaskSucceeded = numTasks
      ? this._tasksItems[numTasks - 1]?.status === "succeeded"
      : true;
    const action = !prevTaskSucceeded ? "reset" : this._action;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [status, component] = useTask(asyncOp, taskComponent, action);
    this._tasksItems.push({ status, component });
    return this;
  }

  finally(onResult: TaskResultCallback): TaskChain {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const onResultRef = useRef(onResult);
    onResultRef.current = onResult; // Don't want to re-run onResult each time the callback changes
    const status = this.status;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (
        status === "succeeded" ||
        status === "faulted" ||
        status === "canceled"
      ) {
        onResultRef.current(status);
      }
    }, [status]);
    return this;
  }
}
