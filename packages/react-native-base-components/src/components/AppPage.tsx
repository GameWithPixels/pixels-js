import {
  Box,
  ITheme,
  NativeBaseProvider,
  ScrollView,
  StatusBar,
  usePropsResolution,
} from "native-base";
import { ColorType } from "native-base/lib/typescript/components/types";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

export interface AppPageProps {
  theme: ITheme;
  p?: number | string;
  lightBg?: ColorType;
  children?: JSX.Element | JSX.Element[];
}

function AppPage(props: AppPageProps) {
  const resolvedProps = usePropsResolution("BaseAppPage", props);
  return (
    <NativeBaseProvider theme={props.theme}>
      <StatusBar />
      <SafeAreaProvider>
        <Box
          p={2}
          bg={resolvedProps.lightBg}
          h={resolvedProps.h}
          w={resolvedProps.w}
        >
          <ScrollView>{props.children}</ScrollView>
        </Box>
      </SafeAreaProvider>
    </NativeBaseProvider>
  );
}

export { AppPage as BaseAppPage };
