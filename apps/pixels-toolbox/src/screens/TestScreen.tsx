import {
  extendTheme,
  useColorModeValue,
  NativeBaseProvider,
  VStack,
  Text,
  Button,
} from "native-base";
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { TaskResult, TaskResultCallback } from "~/TaskChain";
import AppPage from "~/components/AppPage";
import delay from "~/delay";
import { CanceledError, FaultedError, TaskAction, TaskStatus } from "~/useTask";
import useTaskChain from "~/useTaskChain";

interface TestProps {
  action: TaskAction;
  onResult: TaskResultCallback;
  status: TaskStatus;
}

interface MyTest1Props extends TestProps {
  something: string;
  onSomeValue: (value: number) => void;
}

function MyTest1({
  action,
  onResult,
  status,
  something,
  onSomeValue,
}: MyTest1Props) {
  const onSomeValueRef = useRef(onSomeValue);
  onSomeValueRef.current = onSomeValue;
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
        onSomeValueRef.current(123);
      }, []),
      useCallback(
        (p) => <Text>{`2. Status: ${p.status}, value: ${value1}`}</Text>,
        [value1]
      )
    )
    .finally(onResult);
  return (
    <VStack>
      <Text>
        Test {something}: {status}
      </Text>
      {taskChain.render()}
      <Text>End Test {something}</Text>
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
        console.log("Got somethingElse = " + somethingElse);
        for (let i = 1; i <= 2; ++i) {
          setValue1(i);
          await delay(1000);
        }
        //throw new Error("Fail3");
      }, [somethingElse]),
      useCallback(
        (p) => <Text>{`2. Status: ${p.status}, value: ${value1}`}</Text>,
        [value1]
      )
    )
    .finally(onResult);
  return (
    <VStack>
      <Text>
        Test {somethingElse}: {status}
      </Text>
      {taskChain.render()}
      <Text>End Test {somethingElse}</Text>
    </VStack>
  );
}

function createTaskPromise(
  testName: string,
  setResultCallbacks: (
    setState: (callbacks: TaskResultCallback[]) => TaskResultCallback[]
  ) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const resultCallback = (r: TaskResult) =>
      r === "succeeded"
        ? resolve()
        : reject(
            r === "canceled"
              ? new CanceledError(testName)
              : new FaultedError(testName)
          );
    setResultCallbacks((callbacks: TaskResultCallback[]) => {
      return [...callbacks, resultCallback];
    });
  });
}

function TestPage() {
  const [something, setSomething] = useState("1");
  const [somethingElse, setSomethingElse] = useState(2);
  const [cancel, setCancel] = useState(false);
  const [result, setResult] = useState<TaskResult>();
  const [resultCallbacks, setResultCallbacks] = useState<TaskResultCallback[]>(
    []
  );
  useEffect(
    () => () => {
      // Reset state for hot reload
      setResultCallbacks([]);
      setResult(undefined);
    },
    []
  );
  const taskChain = useTaskChain(
    "run",
    useCallback(() => createTaskPromise("Test1", setResultCallbacks), []),
    useCallback(
      (p) => (
        <MyTest1
          something={something}
          onSomeValue={setSomethingElse}
          action={cancel ? "cancel" : "run"}
          status={p.status}
          onResult={resultCallbacks[0]}
        />
      ),
      [cancel, resultCallbacks, something]
    )
  )
    .chainWith(
      useCallback(() => createTaskPromise("Test2", setResultCallbacks), []),
      useCallback(
        (p) => (
          <MyTest2
            somethingElse={somethingElse}
            action={
              cancel ? "cancel" : p.status === "pending" ? "reset" : "run"
            }
            status={p.status}
            onResult={resultCallbacks[1]}
          />
        ),
        [cancel, resultCallbacks, somethingElse]
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
