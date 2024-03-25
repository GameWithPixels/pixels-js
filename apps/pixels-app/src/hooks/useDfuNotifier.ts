import React from "react";

import { DfuNotifier } from "~/features/dfu/DfuNotifier";

export const DfuNotifierContext = React.createContext<DfuNotifier>(
  new DfuNotifier()
);

export function useDfuNotifier(): DfuNotifier {
  return React.useContext(DfuNotifierContext);
}
