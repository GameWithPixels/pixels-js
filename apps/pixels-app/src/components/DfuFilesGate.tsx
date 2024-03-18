import React from "react";
import { Text } from "react-native-paper";

import { DfuFilesInfo } from "~/features/dfu/DfuNotifier";

export function DfuFilesGate({
  children,
  dfuFilesInfo,
  dfuFilesError,
}: {
  children: (props: { dfuFilesInfo: DfuFilesInfo }) => React.ReactNode;
  dfuFilesInfo?: DfuFilesInfo;
  dfuFilesError?: Error;
}) {
  return dfuFilesInfo ? (
    children ? (
      <>{children({ dfuFilesInfo })}</>
    ) : null
  ) : (
    <Text variant="bodyLarge">
      {dfuFilesError
        ? `Error reading firmware file: ${dfuFilesError}`
        : "Preparing firmware file..."}
    </Text>
  );
}
