import { MPC, getMPC } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

export function useMPC(systemId: string): MPC | undefined {
  const [mpc, setMPC] = React.useState(getMPC(systemId));
  const central = usePixelsCentral();
  React.useEffect(() => {
    const disposer = central.addListener("onMPCScanned", () => {
      setMPC(getMPC(systemId));
      disposer();
    });
    return () => disposer();
  }, [central, systemId]);
  return mpc;
}
