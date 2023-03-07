import { Central } from "@systemic-games/react-native-bluetooth-le";
import { useEffect } from "react";

export function useBluetooth(): void {
  useEffect(() => {
    Central.initialize().catch(console.error);
    return () => {
      Central.shutdown().catch(console.error);
    };
  }, []);
}
