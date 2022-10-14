import Central, { ScannedPeripheral, ScannedPeripheralEvent } from "./Central";

let _listener: ((p: ScannedPeripheralEvent) => void) | undefined;

const Scanner = {
  async start(
    services: string | string[],
    onScannedPeripheral: (p: ScannedPeripheral) => void
  ): Promise<void> {
    _listener = (ev: ScannedPeripheralEvent) =>
      onScannedPeripheral(ev.peripheral);

    // Scan
    await Central.scanForPeripheralsWithServices(services);

    // Subscribe to scan events
    Central.addScannedPeripheralEventListener(_listener);
  },

  async stop(): Promise<void> {
    if (_listener) {
      // Stop listening to stop scan events
      await Central.stopScanning();

      Central.removeScannedPeripheralEventListener(_listener);
      _listener = undefined;
    }
  },
};

export default Scanner;
