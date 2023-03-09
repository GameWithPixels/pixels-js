import { Central } from "@systemic-games/react-native-bluetooth-le";
import { useEffect } from "react";

export function useBluetooth(): void {
  useEffect(() => {
    Central.initialize();
    return () => {
      Central.shutdown();
    };
  }, []);
}
