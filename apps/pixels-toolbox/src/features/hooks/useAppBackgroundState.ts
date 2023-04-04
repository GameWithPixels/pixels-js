import React from "react";
import { AppState, AppStateStatus } from "react-native";

export default function (): AppStateStatus {
  const [appState, setAppState] = React.useState(AppState.currentState);
  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      setAppState((appState) => {
        if (
          appState.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          console.log("App has come to the foreground!");
        }
        console.log("AppState", nextAppState);
        return nextAppState;
      });
    });
    return () => {
      subscription.remove();
    };
  }, []);
  return appState;
}
