import { Central, ScannedPeripheral } from "./Central";

let _scanning = false;

export const BleScanner = {
  async start(
    services: string | string[],
    onScannedPeripheral: (p: ScannedPeripheral) => void
  ): Promise<void> {
    await Central.startScan(services, (ev) => {
      if (ev.type === "peripheral") {
        onScannedPeripheral(ev.peripheral);
      } else if (ev.scanStatus === "stopped") {
        _scanning = false;
      }
    });
    _scanning = true;
  },

  async stop(): Promise<void> {
    if (_scanning) {
      _scanning = false;
      await Central.stopScan();
    }
  },
};
