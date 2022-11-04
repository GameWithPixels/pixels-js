import { awesomeMultiply } from "@systemic-games/react-native-pixels-components";
import {
  Text,
  Link,
  HStack,
  Center,
  Heading,
  Switch,
  useColorMode,
  NativeBaseProvider,
  extendTheme,
  VStack,
  Box,
  Button,
} from "native-base";
import React from "react";
import { Provider } from "react-redux";

import { useAppDispatch, useAppSelector } from "./app/hooks";
import { store } from "./app/store";
import NativeBaseIcon from "./components/NativeBaseIcon";
import { setDarkMode, setLightMode } from "./features/themeModeSlice";

// Define the config
const config = {
  useSystemColorMode: false,
  initialColorMode: "dark",
};

// extend the theme
export const theme = extendTheme({ config });
type MyThemeType = typeof theme;
declare module "native-base" {
  interface ICustomTheme extends MyThemeType {}
}

function ReduxExample() {
  const appDispatch = useAppDispatch();
  const { themeMode } = useAppSelector((state) => state.themeMode);
  return (
    <HStack>
      <Text>{themeMode}</Text>
      <Button onPress={() => appDispatch(setLightMode())}>Light</Button>
      <Button onPress={() => appDispatch(setDarkMode())}>Dark</Button>
    </HStack>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <NativeBaseProvider>
        <Center
          _dark={{ bg: "blueGray.900" }}
          _light={{ bg: "blueGray.50" }}
          px={4}
          flex={1}
        >
          <VStack space={5} alignItems="center">
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
              <Text>{awesomeMultiply(3, 4)}</Text>
            </Link>
            <ToggleDarkMode />
            <ReduxExample />
            <ReduxExample />
          </VStack>
        </Center>
      </NativeBaseProvider>
    </Provider>
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
