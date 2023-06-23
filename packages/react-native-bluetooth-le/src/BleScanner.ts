import Central, { ScannedPeripheral, ScannedPeripheralEvent } from "./Central";

let _listener: ((p: ScannedPeripheralEvent) => void) | undefined;

const BleScanner = {
  async start(
    services: string | string[],
    onScannedPeripheral: (p: ScannedPeripheral) => void
  ): Promise<void> {
    const listener = (ev: ScannedPeripheralEvent) =>
      onScannedPeripheral(ev.peripheral);

    // Scan
    await Central.startScanning(services);

    // Subscribe to scan events
    Central.addListener("scannedPeripheral", listener);
    _listener = listener;
  },

  async stop(): Promise<void> {
    if (_listener) {
      const listener = _listener;
      _listener = undefined;
      Central.removeListener("scannedPeripheral", listener);

      // Stop listening to stop scan events
      await Central.stopScanning();
    }
  },
};

export default BleScanner;
