import React from "react";

import { DfuFilesInfo } from "~/features/dfu/DfuNotifier";

export interface DfuFilesAndLoadError {
  readonly dfuFilesInfo?: DfuFilesInfo;
  readonly dfuFilesError?: Error;
}

export const DfuFilesContext = React.createContext<DfuFilesAndLoadError>({});

export function useDfuFiles(): DfuFilesAndLoadError {
  return React.useContext(DfuFilesContext);
}
