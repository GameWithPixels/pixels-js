import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useReducer } from "react";

export default function (updateInterval: number) {
  const [_, forceUpdate] = useReducer((b) => !b, false);
  useFocusEffect(
    // Refresh UI
    useCallback(() => {
      const id = setInterval(forceUpdate, updateInterval);
      return () => {
        clearInterval(id);
      };
    }, [updateInterval])
  );
  return forceUpdate;
}
