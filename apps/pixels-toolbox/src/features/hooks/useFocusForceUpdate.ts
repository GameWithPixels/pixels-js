import { useFocusEffect } from "@react-navigation/native";
import React from "react";

export default function (updateInterval: number) {
  const [_, triggerRender] = React.useReducer((b) => !b, false);
  useFocusEffect(
    // Refresh UI
    React.useCallback(() => {
      const id = setInterval(triggerRender, updateInterval);
      return () => {
        clearInterval(id);
      };
    }, [updateInterval])
  );
  return triggerRender;
}
