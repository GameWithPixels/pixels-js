import {
  Center,
  ITheme,
  NativeBaseProvider,
  StatusBar,
  usePropsResolution,
} from "native-base";
import { ColorType } from "native-base/lib/typescript/components/types";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

export interface AppPageProps {
  theme: ITheme;
  p?: number | string;
  bg?: ColorType;
  children?: JSX.Element | JSX.Element[];
}

export function AppPage(props: AppPageProps) {
  const resolvedProps = usePropsResolution("BaseAppPage", props);
  return (
    <NativeBaseProvider theme={props.theme}>
      <StatusBar />
      <SafeAreaProvider>
        <Center p={resolvedProps.p} bg={resolvedProps.lightBg}>
          {props.children}
        </Center>
      </SafeAreaProvider>
    </NativeBaseProvider>
  );
}
