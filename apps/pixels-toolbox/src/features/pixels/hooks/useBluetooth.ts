import {
  initializeBle,
  shutdownBle,
} from "@systemic-games/react-native-pixels-connect";
import { useEffect } from "react";

export default function () {
  useEffect(() => {
    initializeBle().catch(console.error);
    return () => {
      shutdownBle().catch(console.error);
    };
  }, []);
}
