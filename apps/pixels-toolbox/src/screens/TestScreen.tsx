import {
  extendTheme,
  useColorModeValue,
  NativeBaseProvider,
  Center,
  VStack,
  Text,
  Button,
  Box,
  ScrollView,
  Spinner,
  HStack,
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
import { useErrorHandler } from "react-error-boundary";

import AppPage from "~/components/AppPage";
import delay from "~/delay";

type Task = () => Promise<unknown>;

type TaskStatus = "pending" | "running" | "succeeded" | "faulted" | "canceled";

type TaskComponentProps = PropsWithChildren<{
  status: TaskStatus;
}>;

type TaskComponent = FC<TaskComponentProps>;

function useTask(
  task: Task,
  component: TaskComponent,
  runNow = true
): [TaskStatus, FC<PropsWithChildren>] {
  const [status, setStatus] = useState<TaskStatus>(
    runNow ? "pending" : "running"
  );
  useEffect(() => {
    if (runNow) {
      setStatus("running");
      let canceled = false;
      task()
        .then(() => !canceled && setStatus("succeeded"))
        .catch((error) => {
          console.log(`Task error (with canceled: ${canceled})`, error);
          if (!canceled) {
            setStatus("faulted");
          }
        });
      return () => {
        canceled = true;
        setStatus("canceled");
      };
    }
  }, [task, runNow]);
  return [status, ({ children }) => component({ children, status })];
}

interface TaskItem {
  task: Task;
  component: TaskComponent;
}

function useTaskList(
  taskItems: TaskItem[]
): [TaskStatus, FC<PropsWithChildren>[]] {
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [taskIndex, setTaskIndex] = useState(-1);
  useEffect(() => {
    if (taskItems.length) {
      setStatus("running");
      let canceled = false;
      const runTask = (taskIndex: number) => {
        console.log(`Task at ${taskIndex}: ${taskItems[taskIndex]}`);
        if (taskItems[taskIndex]) {
          setTaskIndex(taskIndex);
          taskItems[taskIndex]
            .task()
            .then(() => !canceled && runTask(taskIndex + 1))
            .catch((error) => {
              console.log(
                `TaskList error (with canceled: ${canceled}) at index ${taskIndex}`,
                error
              );
              if (!canceled) {
                setStatus("faulted");
              }
            });
        } else {
          setStatus("succeeded");
          setTaskIndex(-1);
        }
      };
      runTask(0);
      return () => {
        canceled = true;
        setStatus("canceled");
      };
    }
  }, [taskItems]);
  return [
    status,
    taskItems.slice(0, taskIndex + 1).map(
      (t) =>
        ({ children }: PropsWithChildren) =>
          t.component({ children, status })
    ),
  ];
}

interface ChildProps {
  onCompleted: (success: boolean) => void;
}

function Child({ onCompleted }: ChildProps) {
  const [value0, setValue0] = useState(0);
  const [value1, setValue1] = useState(0);
  const [status, components] = useTaskList([
    {
      task: useCallback(async () => {
        for (let i = 1; i <= 2; ++i) {
          setValue0(i);
          await delay(1000);
        }
        //throw new Error("Coucou0");
      }, []),
      component: useCallback(
        (p) => <Text>{`1. Status: ${p.status}, value: ${value0}`}</Text>,
        [value0]
      ),
    },
    {
      task: useCallback(async () => {
        for (let i = 1; i <= 3; ++i) {
          setValue1(i);
          await delay(1000);
        }
        throw new Error("Coucou1");
      }, []),
      component: useCallback(
        (p) => <Text>{`2. Status: ${p.status}, value: ${value1}`}</Text>,
        [value1]
      ),
    },
  ]);

  // const [status0, component0] = useTask(
  //   useCallback(async () => {
  //     for (let i = 1; i <= 2; ++i) {
  //       setValue0(i);
  //       await delay(1000);
  //     }
  //     //throw new Error("Coucou0");
  //   }, []),
  //   useCallback(
  //     (p) => <Text>{`1. Status: ${p.status}, value: ${value0}`}</Text>,
  //     [value0]
  //   )
  // );
  // const [status1, component1] = useTask(
  //   useCallback(async () => {
  //     for (let i = 1; i <= 3; ++i) {
  //       setValue1(i);
  //       await delay(1000);
  //     }
  //     throw new Error("Coucou1");
  //   }, []),
  //   useCallback(
  //     (p) => <Text>{`2. Status: ${p.status}, value: ${value1}`}</Text>,
  //     [value1]
  //   ),
  //   status0 === "succeeded"
  // );
  return (
    <VStack>
      <Text>Child</Text>
      <Text>{status}</Text>
      {components.map((c, key) => (
        <View key={key}>{c({})}</View>
      ))}
      <Text>End</Text>
    </VStack>
  );
}

function TestPage() {
  return (
    <VStack w="100%" h="100%" bg={useBackgroundColor()} px="3" py="1">
      <Child onCompleted={console.log} />
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
