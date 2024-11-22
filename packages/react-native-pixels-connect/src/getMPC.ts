import { MPC } from "@systemic-games/pixels-core-connect";

import BleSession from "./BleSession";
import { ScannedDevicesRegistry } from "./ScannedDevicesRegistry";
import { DevicesMap } from "./static";

export function getMPC(id: string | number): MPC | undefined {
  if (typeof id === "number" ? id !== 0 : id?.length > 0) {
    const sc = ScannedDevicesRegistry.findMPC(id);
    // Get system id from the input data
    const systemId = typeof id === "string" ? id : sc?.systemId;
    if (sc && systemId?.length) {
      // Check for an existing MPC object for the given system id
      const dev = DevicesMap.get(systemId);
      const exitingMPC = dev instanceof MPC ? dev : undefined;
      // Or create a new MPC instance
      const mpc =
        exitingMPC ?? new MPC(new BleSession("mpc", systemId, sc?.name), sc);
      if (!exitingMPC) {
        // Keep track of this new instance
        DevicesMap.set(systemId, mpc);
      }
      return mpc;
    }
  }
}
