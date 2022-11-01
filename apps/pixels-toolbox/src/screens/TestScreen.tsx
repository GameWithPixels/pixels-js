import {
  extendTheme,
  useColorModeValue,
  NativeBaseProvider,
  VStack,
  Text,
  Button,
} from "native-base";
import React, { FC, useCallback, useEffect, useRef, useState } from "react";

import { TaskResult, TaskResultCallback } from "~/TaskChain";
import AppPage from "~/components/AppPage";
import delay from "~/delay";
import {
  AsyncOperation,
  CanceledError,
  FaultedError,
  TaskAction,
  TaskComponent,
  TaskComponentProps,
} from "~/useTask";
import useTaskChain from "~/useTaskChain";

interface TaskResultComponentProps extends TaskComponentProps {
  onResult?: TaskResultCallback;
}

type TaskResultComponent = FC<TaskResultComponentProps>;

function useTestComponent(
  testName: string,
  taskResultComponent: TaskResultComponent
): [AsyncOperation, TaskComponent] {
  // Can't store TaskResultCallback in a state because the setter gets confused
  // and calls the new value (which is a function taking one argument) instead of storing it.
  // So we store an array of one value instead.
  const [onResult, setOnResult] = useState<TaskResultCallback[]>([]);
  const asyncOp = useCallback(
    () =>
      new Promise<void>((resolve, reject) =>
        setOnResult([
          (r: TaskResult) =>
            r === "succeeded"
              ? resolve()
              : reject(
                  r === "canceled"
                    ? new CanceledError(testName)
                    : new FaultedError(testName)
                ),
        ])
      ),
    [testName]
  );
  return [
    asyncOp,
    useCallback(
      (props: TaskComponentProps) =>
        taskResultComponent({ ...props, onResult: onResult[0] }),
      [onResult, taskResultComponent]
    ),
  ];
}

interface TestProps extends TaskResultComponentProps {
  action: TaskAction;
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
    .onResult(onResult);
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
      console.log("Got somethingElse = " + somethingElse);
      for (let i = 1; i <= 3; ++i) {
        setValue0(i);
        await delay(1000);
      }
      //throw new Error("Fail2");
    }, [somethingElse]),
    useCallback(
      (p) => <Text>{`1. Status: ${p.status}, value: ${value0}`}</Text>,
      [value0]
    )
  )
    .chainWith(
      useCallback(async () => {
        //console.log("Got somethingElse = " + somethingElse);
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
    .onResult(onResult);
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

function TestPage() {
  const [something, setSomething] = useState("1");
  const [somethingElse, setSomethingElse] = useState(2);
  const [cancel, setCancel] = useState(false);
  const [result, setResult] = useState<TaskResult>();
  useEffect(
    () => () => {
      // Reset state for hot reload
      setResult(undefined);
    },
    []
  );
  const taskChain = useTaskChain(
    "run",
    ...useTestComponent(
      "Test1",
      useCallback(
        (p) => (
          <MyTest1
            {...p}
            something={something}
            onSomeValue={setSomethingElse}
            action={cancel ? "cancel" : "run"}
          />
        ),
        [cancel, something]
      )
    )
  )
    .chainWith(
      ...useTestComponent(
        "Test2",
        useCallback(
          (p) => (
            <MyTest2
              {...p}
              somethingElse={somethingElse}
              action={
                cancel ? "cancel" : p.status === "pending" ? "reset" : "run"
              }
            />
          ),
          [cancel, somethingElse]
        )
      )
    )
    .chainWith(
      ...useTestComponent(
        "Test3",
        useCallback(
          (p) => (
            <MyTest1
              {...p}
              something={something}
              onSomeValue={setSomethingElse}
              action={cancel ? "cancel" : "run"}
            />
          ),
          [cancel, something]
        )
      )
    )
    .onResult(setResult);

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
