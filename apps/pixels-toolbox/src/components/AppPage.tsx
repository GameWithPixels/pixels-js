import { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
// eslint-disable-next-line import/namespace
import { StyleProp, View, ViewStyle } from "react-native";

import ErrorFallback from "./ErrorFallback";

import styles from "~/styles";

// Note: call useErrorHandler() only in child components, not in the component
// rendering the AppPage as it will crash when handling an error.
export default function ({
  children,
  style,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style ?? styles.container}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        {children}
      </ErrorBoundary>
    </View>
  );
}
