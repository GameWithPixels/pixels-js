import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useReducer } from "react";

export default function (updateInterval: number) {
  const [_, triggerRender] = useReducer((b) => !b, false);
  useFocusEffect(
    // Refresh UI
    useCallback(() => {
      const id = setInterval(triggerRender, updateInterval);
      return () => {
        clearInterval(id);
      };
    }, [updateInterval])
  );
  return triggerRender;
}
