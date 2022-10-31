import {
  extendTheme,
  useColorModeValue,
  NativeBaseProvider,
  VStack,
  Text,
  Button,
  View,
} from "native-base";
import {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import AppPage from "~/components/AppPage";
import delay from "~/delay";

type TaskResult = "succeeded" | "faulted" | "canceled";

type TaskStatus = "pending" | "running" | TaskResult;

type TaskComponentProps = PropsWithChildren<{
  status: TaskStatus;
}>;

type TaskComponent = FC<TaskComponentProps>;

type TaskAction = "cancel" | "reset";

type AsyncOperation = () => Promise<unknown>;

type TaskResultCallback = (result: TaskResult) => void;

function useTask(
  asyncOp: AsyncOperation,
  taskComponent: TaskComponent,
  action?: TaskAction
): [TaskStatus, FC<PropsWithChildren>] {
  const [status, setStatus] = useState<TaskStatus>("pending");
  useEffect(() => {
    if (!action) {
      setStatus("running");
      const updateStatus = (newStatus: TaskStatus) =>
        setStatus((status) => (status === "running" ? newStatus : status));
      let canceled = false;
      asyncOp()
        .then(() => !canceled && updateStatus("succeeded"))
        .catch((error) => {
          console.log(`Task error (with canceled: ${canceled})`, error);
          if (!canceled) {
            updateStatus("faulted");
          }
        });
      return () => {
        canceled = true;
        updateStatus("canceled");
      };
    } else if (action === "cancel") {
      // Cancellation is done on unmounting the effect (see code above)
    } else if (action === "reset") {
      setStatus("pending");
    }
  }, [asyncOp, action]);
  return [status, ({ children }) => taskComponent({ children, status })];
}

function useTaskChain(
  asyncOp: AsyncOperation,
  taskComponent: TaskComponent
): TaskChain {
  return new TaskChain(asyncOp, taskComponent);
}

interface TaskChainItem {
  status: TaskStatus;
  component: FC<PropsWithChildren>;
}

class TaskChain {
  private _tasksItems: TaskChainItem[] = [];
  private readonly _isCanceled: boolean;
  private _doCancel: () => void;
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
  constructor(asyncOp: AsyncOperation, taskComponent: TaskComponent) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [canceled, setCanceled] = useState(false);
    this._isCanceled = canceled;
    this._doCancel = () => setCanceled(true);
    this.chainWith(asyncOp, taskComponent);
  }
  getStatusAt(index: number): TaskStatus | undefined {
    return this._tasksItems[index].status;
  }
  getComponentAt(index: number): FC<PropsWithChildren> | undefined {
    return this._tasksItems[index].component;
  }
  cancel(): void {
    this._doCancel();
  }
  chainWith(asyncOp: AsyncOperation, taskComponent: TaskComponent): TaskChain {
    const numTasks = this._tasksItems.length;
    const prevTaskSucceeded = numTasks
      ? this._tasksItems[numTasks - 1]?.status === "succeeded"
      : true;
    const action = !prevTaskSucceeded
      ? "reset"
      : this._isCanceled
      ? "cancel"
      : undefined; // Run now
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

interface MyTestProps {
  onResult: TaskResultCallback;
}

function MyTest({ onResult }: MyTestProps) {
  const [value0, setValue0] = useState(0);
  const [value1, setValue1] = useState(0);
  const taskChain = useTaskChain(
    useCallback(async () => {
      for (let i = 1; i <= 4; ++i) {
        setValue0(i);
        await delay(1000);
      }
      //throw new Error("Coucou0");
    }, []),
    useCallback(
      (p) => <Text>{`1. Status: ${p.status}, value: ${value0}`}</Text>,
      [value0]
    )
  )
    .chainWith(
      useCallback(async () => {
        for (let i = 1; i <= 3; ++i) {
          setValue1(i);
          await delay(1000);
        }
        //throw new Error("Coucou1");
      }, []),
      useCallback(
        (p) => <Text>{`2. Status: ${p.status}, value: ${value1}`}</Text>,
        [value1]
      )
    )
    .finally(onResult);
  return (
    <VStack>
      <Button onPress={() => taskChain.cancel()}>Cancel</Button>
      <Text>Test</Text>
      {taskChain.components.map((c, key) => (
        <View key={key}>{c({})}</View>
      ))}
      <Text>End</Text>
    </VStack>
  );
}

function TestPage() {
  console.log("=========================");
  return (
    <VStack w="100%" h="100%" bg={useBackgroundColor()} px="3" py="1">
      <MyTest onResult={(r) => console.log("Result", r)} />
    </VStack>
  );
}

function useBackgroundColor() {
  return useColorModeValue("warmGray.100", "coolGray.800");
}

const theme = extendTheme({
  components: {
    Text: {
      baseStyle: {
        fontSize: "2xl",
        fontWeight: "bold",
        _dark: {
          color: "warmGray.200",
        },
        _light: {
          color: "coolGray.700",
        },
      },
    },
    Button: {
      variants: {
        solid: {
          _dark: {
            bg: "coolGray.600",
            _pressed: {
              bg: "coolGray.700",
            },
            _text: {
              color: "warmGray.200",
            },
          },
          _light: {
            bg: "warmGray.300",
            _pressed: {
              bg: "warmGray.200",
            },
            _text: {
              color: "coolGray.700",
            },
          },
        },
      },
      defaultProps: {
        size: "lg",
        _text: {
          fontSize: "2xl",
        },
      },
    },
  },
  config: {
    initialColorMode: "dark",
  },
});

export default function () {
  return (
    <AppPage style={{ flex: 1 }}>
      <NativeBaseProvider theme={theme} config={{ strictMode: "error" }}>
        <TestPage />
      </NativeBaseProvider>
    </AppPage>
  );
}
