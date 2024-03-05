import {
  BluetoothState,
  Central,
} from "@systemic-games/react-native-bluetooth-le";
import React from "react";

export function useBluetoothState(): BluetoothState {
  const [state, setState] = React.useState(Central.getBluetoothState());
  React.useEffect(() => {
    setState(Central.getBluetoothState());
    const onBluetoothState = ({ state }: { state: BluetoothState }) =>
      setState(state);
    Central.addEventListener("bluetoothState", onBluetoothState);
    return () => {
      Central.removeEventListener("bluetoothState", onBluetoothState);
    };
  }, []);
  return state;
}
