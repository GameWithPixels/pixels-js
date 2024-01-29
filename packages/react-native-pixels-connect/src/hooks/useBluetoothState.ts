import {
  BluetoothState,
  Central,
} from "@systemic-games/react-native-bluetooth-le";
import React from "react";

export function useBluetoothState(): BluetoothState {
  const [state, setState] = React.useState(Central.getBluetoothState());
  React.useEffect(() => {
    const listener = ({ state }: { state: BluetoothState }) => setState(state);
    Central.addListener("bluetoothState", listener);
    return () => Central.removeListener("bluetoothState", listener);
  }, []);
  return state;
}
