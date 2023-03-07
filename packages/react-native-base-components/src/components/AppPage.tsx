import { Box, IFlexProps, StatusBar, usePropsResolution } from "native-base";
import { ColorType } from "native-base/lib/typescript/components/types";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

/**
 * Props for AppPage component.
 */
export interface AppPageProps extends IFlexProps {
  h?: number | string;
  w?: number | string;
  p?: number | string;
  bg?: ColorType;
}

/**
 * App page container with a scroll view to create separate pages with custom theme.
 * @param props See {@link AppPageProps} for props parameters.
 */
export function AppPage(props: AppPageProps) {
  const resolvedProps = usePropsResolution("AppPage", props) as AppPageProps;
  return (
    <SafeAreaProvider>
      <StatusBar />
      <Box {...resolvedProps} />
    </SafeAreaProvider>
  );
}
