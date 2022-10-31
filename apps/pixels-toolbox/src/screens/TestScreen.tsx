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
  MutableRefObject,
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

type TaskAction = "run" | "cancel" | "reset";

type TaskComponentProps = PropsWithChildren<{
  status: TaskStatus;
}>;

type TaskComponent = FC<TaskComponentProps>;

type AsyncOperation = () => Promise<unknown>;

type TaskResultCallback = (result: TaskResult) => void;

function useTask(
  asyncOp: AsyncOperation,
  taskComponent: TaskComponent,
  action: TaskAction = "run"
): [TaskStatus, FC<PropsWithChildren>] {
  const [status, setStatus] = useState<TaskStatus>("pending");
  useEffect(() => {
    if (action === "run") {
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
  action: TaskAction,
  asyncOp: AsyncOperation,
  taskComponent: TaskComponent
): TaskChain {
  return new TaskChain(action, asyncOp, taskComponent);
}

interface TaskChainItem {
  status: TaskStatus;
  component: FC<PropsWithChildren>;
}

class TaskChain {
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
  render(): JSX.Element {
    return (
      <>
        {this.components.map((c, key) => (
          <View key={key}>{c({})}</View>
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

interface TestProps {
  action: TaskAction;
  onResult: TaskResultCallback;
  status: TaskStatus;
}

interface MyTest1Props extends TestProps {
  something: string;
}

function MyTest1({ action, onResult, status, something }: MyTest1Props) {
  const [value0, setValue0] = useState(0);
  const [value1, setValue1] = useState(0);
  const taskChain = useTaskChain(
    action,
    useCallback(async () => {
      for (let i = 1; i <= 3; ++i) {
        setValue0(i);
        await delay(1000);
      }
      //throw new Error("Fail0");
    }, []),
    useCallback(
      (p) => <Text>{`1. Status: ${p.status}, value: ${value0}`}</Text>,
      [value0]
    )
  )
    .chainWith(
      useCallback(async () => {
        for (let i = 1; i <= 2; ++i) {
          setValue1(i);
          await delay(1000);
        }
        //throw new Error("Fail1");
      }, []),
      useCallback(
        (p) => <Text>{`2. Status: ${p.status}, value: ${value1}`}</Text>,
        [value1]
      )
    )
    .finally(onResult);
  return (
    <VStack>
      <Text>{`Test ${something} => ${status}`}</Text>
      {taskChain.render()}
      <Text>End Test</Text>
    </VStack>
  );
}

interface MyTest2Props extends TestProps {
  somethingElse: number;
}

function MyTest2({ action, onResult, status, somethingElse }: MyTest2Props) {
  const [value0, setValue0] = useState(0);
  const [value1, setValue1] = useState(0);
  const taskChain = useTaskChain(
    action,
    useCallback(async () => {
      for (let i = 1; i <= 3; ++i) {
        setValue0(i);
        await delay(1000);
      }
      //throw new Error("Fail2");
    }, []),
    useCallback(
      (p) => <Text>{`1. Status: ${p.status}, value: ${value0}`}</Text>,
      [value0]
    )
  )
    .chainWith(
      useCallback(async () => {
        for (let i = 1; i <= 2; ++i) {
          setValue1(i);
          await delay(1000);
        }
        //throw new Error("Fail3");
      }, []),
      useCallback(
        (p) => <Text>{`2. Status: ${p.status}, value: ${value1}`}</Text>,
        [value1]
      )
    )
    .finally(onResult);
  return (
    <VStack>
      <Text>{`Test ${somethingElse} => ${status}`}</Text>
      {taskChain.render()}
      <Text>End Test</Text>
    </VStack>
  );
}

function createTaskChainItemPromise(
  testName: string,
  resultCallbacks: MutableRefObject<TaskResultCallback[]>
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    resultCallbacks.current.push((r: TaskResult) =>
      r === "succeeded"
        ? resolve()
        : reject(new Error(testName + " errored with result " + r))
    );
  });
}

function TestPage() {
  const [something, setSomething] = useState("1");
  const [somethingElse, setSomethingElse] = useState(2);
  const [cancel, setCancel] = useState(false);
  const [result, setResult] = useState<TaskResult>();
  const resultCallbacks = useRef<TaskResultCallback[]>([]);
  const taskChain = useTaskChain(
    "run",
    useCallback(() => createTaskChainItemPromise("Test1", resultCallbacks), []),
    useCallback(
      (p) => (
        <MyTest1
          something={something}
          action={cancel ? "cancel" : "run"}
          status={p.status}
          onResult={resultCallbacks.current[0]}
        />
      ),
      [cancel, something]
    )
  )
    .chainWith(
      useCallback(
        () => createTaskChainItemPromise("Test2", resultCallbacks),
        []
      ),
      useCallback(
        (p) => (
          <MyTest2
            somethingElse={somethingElse}
            action={
              cancel ? "cancel" : p.status === "pending" ? "reset" : "run"
            }
            status={p.status}
            onResult={resultCallbacks.current[1]}
          />
        ),
        [cancel, somethingElse]
      )
    )
    .finally(setResult);

  return (
    <VStack w="100%" h="100%" bg={useBackgroundColor()} px="3" py="1">
      <Button onPress={() => setCancel(true)}>Cancel</Button>
      {taskChain.render()}
      <Text>The end</Text>
      <Button onPress={() => setSomething((s) => s + "@")}>Change Test1</Button>
      <Button onPress={() => setSomethingElse((i) => i + 1)}>
        Change Test2
      </Button>
      {result && <Text>Result: {result}</Text>}
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
