import React from "react";

export type DfuFilesInfo = Readonly<{
  timestamp: number;
  firmwarePath: string;
  bootloaderPath?: string;
}>;

// Both fields are undefined until the files are loaded or until
// an error occurred during loading
export type DfuFilesStatus = Readonly<{
  dfuFilesInfo?: DfuFilesInfo;
  dfuFilesError?: Error;
}>;

export const DfuFilesContext = React.createContext<DfuFilesStatus>({});

export function useAppDfuFiles(): DfuFilesStatus {
  return React.useContext(DfuFilesContext);
}
