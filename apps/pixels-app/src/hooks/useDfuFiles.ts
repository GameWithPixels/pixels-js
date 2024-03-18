import React from "react";

import { DfuFilesInfo } from "~/features/dfu/DfuNotifier";

// Both fields are undefined when the dfu files are not loaded yet
export interface DfuFilesLoadStatus {
  readonly dfuFilesInfo?: DfuFilesInfo;
  readonly dfuFilesError?: Error;
}

export const DfuFilesContext = React.createContext<DfuFilesLoadStatus>({});

export function useDfuFiles(): DfuFilesLoadStatus {
  return React.useContext(DfuFilesContext);
}
