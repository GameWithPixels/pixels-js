import {
  Toggle,
  Pxtheme,
  BatteryLevel,
  RSSIStrength,
  AppPage,
  Card,
} from "@systemic-games/react-native-pixels-components";
import {
  Text,
  Link,
  HStack,
  Center,
  Heading,
  Switch,
  useColorMode,
  VStack,
  Box,
  NativeBaseProvider,
} from "native-base";
import React from "react";

import NativeBaseIcon from "./components/NativeBaseIcon";

export default function App() {
  console.log("test");
  console.log(2);
  return (
    <NativeBaseProvider>
      <AppPage theme={Pxtheme}>
        <VStack space={4}>
          <Card></Card>
          <Card></Card>
          <Toggle text="Hello toggle"></Toggle>
          <Card></Card>
          <Card></Card>
        </VStack>
        {/* <VStack space={5} alignItems="center">
          <NativeBaseIcon />
          <Heading size="lg">Welcome to NativeBase</Heading>
          <HStack space={2} alignItems="center">
            <Text>Edit</Text>
            <Box
              _web={{
                _text: {
                  fontFamily: "monospace",
                  fontSize: "sm",
                },
              }}
              px={2}
              py={1}
              _dark={{ bg: "blueGray.800" }}
              _light={{ bg: "blueGray.200" }}
            >
              App.js
            </Box>
            <Text>and save to reload.</Text>
          </HStack>
          <Link href="https://docs.nativebase.io" isExternal>
            <Text color="primary.500" underline fontSize="xl">
              Learn NativeBase
            </Text>
          </Link>
          <Toggle text="Test Toggle" space={4} />
          <BatteryLevel percentage={10} />
          <RSSIStrength percentage={55} />
          <ToggleDarkMode />
        </VStack> */}
      </AppPage>
    </NativeBaseProvider>
  );
}

// Color Switch Component
function ToggleDarkMode() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <HStack space={2} alignItems="center">
      <Text>Dark</Text>
      <Switch
        isChecked={colorMode === "light"}
        onToggle={toggleColorMode}
        aria-label={
          colorMode === "light" ? "switch to dark mode" : "switch to light mode"
        }
      />
      <Text>Light</Text>
    </HStack>
  );
}
