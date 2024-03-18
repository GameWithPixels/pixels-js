import React from "react";

export interface DfuFilesInfo {
  readonly timestamp: number;
  readonly firmwarePath: string;
  readonly bootloaderPath?: string;
}

// Both fields are undefined until the files are loaded or until
// an error occurred during loading
export interface DfuFilesStatus {
  readonly dfuFilesInfo?: DfuFilesInfo;
  readonly dfuFilesError?: Error;
}

export const DfuFilesContext = React.createContext<DfuFilesStatus>({});

export function useAppDfuFiles(): DfuFilesStatus {
  return React.useContext(DfuFilesContext);
}
