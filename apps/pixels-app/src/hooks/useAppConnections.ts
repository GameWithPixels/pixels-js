import React from "react";

import { AppConnections } from "~/app/AppConnections";

export const AppConnectionsContext = React.createContext<AppConnections>(
  new AppConnections()
);

export function useAppConnections(): AppConnections {
  return React.useContext(AppConnectionsContext);
}
