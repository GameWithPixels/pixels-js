import { delay } from "@systemic-games/pixels-core-utils";
import React from "react";
import { Button, Text } from "react-native-paper";

import { AppPage } from "~/components/AppPage";
import { BaseVStack } from "~/components/BaseVStack";
import {
  TaskComponentProps,
  useTaskChain,
  useTaskComponent,
} from "~/features/tasks";

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
  const onSomeValueRef = React.useRef(onSomeValue);
  onSomeValueRef.current = onSomeValue;
  const [value0, setValue0] = React.useState(0);
  const [value1, setValue1] = React.useState(0);
  const taskChain = useTaskChain(action)
    .withTask(
      React.useCallback(async () => {
        for (let i = 1; i <= 3; ++i) {
          setValue0(i);
          await delay(1000);
        }
        //throw new Error("Fail0");
      }, []),
      (p) => <Text>{`1. Status: ${p.taskStatus}, value: ${value0}`}</Text>
    )
    .withTask(
      React.useCallback(async () => {
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
    <BaseVStack gap={5}>
      <Text>
        Test {something}: {taskChain.status}
      </Text>
      {taskChain.render()}
      <Text>End Test {something}</Text>
    </BaseVStack>
  );
}

interface MyTest2Props extends TaskComponentProps {
  somethingElse: number;
}

function MyTest2({ action, onTaskStatus, somethingElse }: MyTest2Props) {
  const [value0, setValue0] = React.useState(0);
  const [value1, setValue1] = React.useState(0);
  const taskChain = useTaskChain(action)
    .withTask(
      React.useCallback(async () => {
        console.log("Got somethingElse = " + somethingElse);
        for (let i = 1; i <= 3; ++i) {
          setValue0(i);
          await delay(1000);
        }
        //throw new Error("Fail2");
      }, [somethingElse]),
      (p) => <Text>{`1. Status: ${p.taskStatus}, value: ${value0}`}</Text>
    )
    .withTask(
      React.useCallback(async () => {
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
    <BaseVStack gap={5}>
      <Text>
        Test {somethingElse}: {taskChain.status}
      </Text>
      {taskChain.render()}
      <Text>End Test {somethingElse}</Text>
    </BaseVStack>
  );
}

function TestPage() {
  const [something, setSomething] = React.useState("1");
  const [somethingElse, setSomethingElse] = React.useState(2);
  const [cancel, setCancel] = React.useState(false);
  const taskChain = useTaskChain(cancel ? "cancel" : "run")
    .withTask(
      ...useTaskComponent("Test1", cancel, (p) => (
        <MyTest1 {...p} something={something} onSomeValue={setSomethingElse} />
      ))
    )
    .withTask(
      ...useTaskComponent("Test2", cancel, (p) => (
        <MyTest2 {...p} somethingElse={somethingElse} />
      ))
    )
    .withTask(
      ...useTaskComponent("Test3", cancel, (p) => (
        <MyTest1 {...p} something={something} onSomeValue={setSomethingElse} />
      ))
    );
  return (
    <BaseVStack gap={20}>
      <Button mode="contained-tonal" onPress={() => setCancel(true)}>
        Cancel
      </Button>
      {taskChain.render()}
      <Text>The end</Text>
      <Button
        mode="contained-tonal"
        onPress={() => setSomething((s) => s + "@")}
      >
        Change Test1
      </Button>
      <Button
        mode="contained-tonal"
        onPress={() => setSomethingElse((i) => i + 1)}
      >
        Change Test2
      </Button>
      <Text>Status: {taskChain.status}</Text>
    </BaseVStack>
  );
}

export function TaskChainTestScreen() {
  return (
    <AppPage>
      <TestPage />
    </AppPage>
  );
}
