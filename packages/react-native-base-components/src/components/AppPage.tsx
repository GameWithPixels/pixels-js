import {
  Box,
  ITheme,
  NativeBaseProvider,
  ScrollView,
  StatusBar,
  usePropsResolution,
} from "native-base";
import { ColorType } from "native-base/lib/typescript/components/types";
import { PropsWithChildren } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

export interface AppPageProps extends PropsWithChildren {
  theme?: ITheme;
  h?: number;
  w?: number;
  p?: number | string;
  lightBg?: ColorType;
}

function AppPage(props: AppPageProps) {
  const resolvedProps = usePropsResolution("AppPage", props) as AppPageProps;
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
