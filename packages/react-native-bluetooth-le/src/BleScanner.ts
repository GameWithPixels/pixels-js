import { Central, ScannedPeripheral, ScanResultEvent } from "./Central";

let _listener: ((p: ScanResultEvent) => void) | undefined;

export const BleScanner = {
  async start(
    services: string | string[],
    onScannedPeripheral: (p: ScannedPeripheral) => void
  ): Promise<void> {
    const listener = (ev: ScanResultEvent) =>
      onScannedPeripheral(ev.peripheral);

    // Scan
    await Central.startScan(services);

    // Watch for stop scan event to remove listener
    Central.addListener("scanStatus", ({ scanning }) => {
      if (!scanning && _listener) {
        Central.removeListener("scannedPeripheral", _listener);
        _listener = undefined;
      }
    });

    // Subscribe to scan events
    Central.addListener("scannedPeripheral", listener);
    _listener = listener;
  },

  async stop(): Promise<void> {
    if (_listener) {
      // Stop listening to stop scan events
      await Central.stopScan();
    }
  },
};
