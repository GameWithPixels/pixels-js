import { StatusBar, View, usePropsResolution } from "native-base";
import { IViewProps } from "native-base/lib/typescript/components/basic/View/types";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

/**
 * Props for AppPage component.
 */
export interface AppPageProps extends IViewProps {}

/**
 * App page container with a scroll view to create separate pages with custom theme.
 * @param props See {@link AppPageProps} for props parameters.
 */
export function AppPage(props: AppPageProps) {
  const resolvedProps = usePropsResolution("AppPage", props) as AppPageProps;
  return (
    <SafeAreaProvider>
      <StatusBar />
      <View {...resolvedProps} />
    </SafeAreaProvider>
  );
}
