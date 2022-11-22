import {
  Box,
  ITheme,
  NativeBaseProvider,
  ScrollView,
  StatusBar,
  usePropsResolution,
} from "native-base";
import { ColorType } from "native-base/lib/typescript/components/types";
import React, { PropsWithChildren, useState } from "react";
// eslint-disable-next-line import/namespace
import { RefreshControl } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export interface AppPageProps extends PropsWithChildren {
  theme?: ITheme;
  h?: number;
  w?: number;
  p?: number | string;
  lightBg?: ColorType;
  onRefresh?: (() => void) | null | undefined;
}

const wait = (timeout: number) => {
  return new Promise((resolve) => setTimeout(resolve, timeout));
};

function AppPage(props: AppPageProps) {
  const [refreshing, setRefreshing] = useState(false);

  //Example to use and see the refresh function
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    wait(2000).then(() => setRefreshing(false));
  }, []);
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
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {props.children}
          </ScrollView>
        </Box>
      </SafeAreaProvider>
    </NativeBaseProvider>
  );
}

export { AppPage as BaseAppPage };
