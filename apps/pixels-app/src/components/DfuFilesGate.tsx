import React from "react";
import { Text } from "react-native-paper";

import { useAppSelector } from "~/app/hooks";
import { DfuFilesInfo } from "~/hooks";

export function DfuFilesGate({
  children,
}: {
  children: (props: { dfuFilesInfo: DfuFilesInfo }) => React.ReactNode;
}) {
  const dfuFilesStatus = useAppSelector(
    (state) => state.appTransient.dfuFilesStatus
  );
  return dfuFilesStatus && typeof dfuFilesStatus === "object" ? (
    children ? (
      <>{children({ dfuFilesInfo: dfuFilesStatus })}</>
    ) : null
  ) : (
    <Text variant="bodyLarge">
      {dfuFilesStatus
        ? `Error reading firmware file: ${dfuFilesStatus}`
        : "Preparing firmware file..."}
    </Text>
  );
}
