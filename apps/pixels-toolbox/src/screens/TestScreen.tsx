import {
  extendTheme,
  useColorModeValue,
  NativeBaseProvider,
  VStack,
  Text,
  Button,
} from "native-base";
import React, { useCallback, useRef, useState } from "react";

import AppPage from "~/components/AppPage";
import delay from "~/delay";
import useTaskChain from "~/features/tasks/useTaskChain";
import useTestComponent, {
  TaskComponentProps,
} from "~/features/tasks/useTaskComponent";

interface MyTest1Props extends TaskComponentProps {
  something: string;
  onSomeValue: (value: number) => void;
}

function MyTest1({
  action,
  onTaskStatus,
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
    (p) => <Text>{`1. Status: ${p.taskStatus}, value: ${value0}`}</Text>
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
      (p) => <Text>{`2. Status: ${p.taskStatus}, value: ${value1}`}</Text>
    )
    .withStatusChanged(onTaskStatus);
  return (
    <VStack>
      <Text>
        Test {something}: {taskChain.status}
      </Text>
      {taskChain.render()}
      <Text>End Test {something}</Text>
    </VStack>
  );
}

interface MyTest2Props extends TaskComponentProps {
  somethingElse: number;
}

function MyTest2({ action, onTaskStatus, somethingElse }: MyTest2Props) {
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
    (p) => <Text>{`1. Status: ${p.taskStatus}, value: ${value0}`}</Text>
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
      (p) => <Text>{`2. Status: ${p.taskStatus}, value: ${value1}`}</Text>
    )
    .withStatusChanged(onTaskStatus);
  return (
    <VStack>
      <Text>
        Test {somethingElse}: {taskChain.status}
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
  const taskChain = useTaskChain(
    cancel ? "cancel" : "run",
    ...useTestComponent("Test1", cancel, (p) => (
      <MyTest1 {...p} something={something} onSomeValue={setSomethingElse} />
    ))
  )
    .chainWith(
      ...useTestComponent("Test2", cancel, (p) => (
        <MyTest2 {...p} somethingElse={somethingElse} />
      ))
    )
    .chainWith(
      ...useTestComponent("Test3", cancel, (p) => (
        <MyTest1 {...p} something={something} onSomeValue={setSomethingElse} />
      ))
    );
  return (
    <VStack w="100%" h="100%" bg={useBackgroundColor()} px="3" py="1">
      <Button onPress={() => setCancel(true)}>Cancel</Button>
      {taskChain.render()}
      <Text>The end</Text>
      <Button onPress={() => setSomething((s) => s + "@")}>Change Test1</Button>
      <Button onPress={() => setSomethingElse((i) => i + 1)}>
        Change Test2
      </Button>
      <Text>Status: {taskChain.status}</Text>
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
