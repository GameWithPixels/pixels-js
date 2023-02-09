import { useEffect } from "react";

import { initializeBle, shutdownBle } from "../ble";

export function useBluetooth(): void {
  useEffect(() => {
    initializeBle().catch(console.error);
    return () => {
      shutdownBle().catch(console.error);
    };
  }, []);
}
