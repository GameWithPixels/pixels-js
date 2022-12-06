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

/**
 * Props for AppPage component.
 */
export interface AppPageProps extends PropsWithChildren {
  theme?: ITheme; // Theme used in the page and given to NativeBaseProvider. Will be applied to all the children contained inside the app page
  scrollable?: boolean;
  h?: number | string;
  w?: number | string;
  p?: number | string;
  lightBg?: ColorType;
  onRefresh?: (() => void) | null | undefined; // Function executed when refreshing the page
}

const wait = (timeout: number) => {
  return new Promise((resolve) => setTimeout(resolve, timeout));
};

/**
 * App page container with a scroll view to create separate pages with custom theme.
 * @param props See {@link AppPageProps} for props parameters.
 */
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
          {resolvedProps.scrollable ? (
            <ScrollView
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {props.children}
            </ScrollView>
          ) : (
            props.children
          )}
        </Box>
      </SafeAreaProvider>
    </NativeBaseProvider>
  );
}

export { AppPage as BaseAppPage };
