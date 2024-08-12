import {
  Charger,
  PixelsBluetoothIds,
} from "@systemic-games/pixels-core-connect";

import BleSession from "./BleSession";
import { ScannedDevicesRegistry } from "./ScannedDevicesRegistry";
import { DevicesMap } from "./static";

export function getCharger(id: string | number): Charger | undefined {
  if (typeof id === "number" ? id !== 0 : id?.length > 0) {
    const sc = ScannedDevicesRegistry.findCharger(id);
    // Get system id from the input data
    const systemId = typeof id === "string" ? id : sc?.systemId;
    if (sc && systemId?.length) {
      // Check for an existing Pixel object for the given system id
      const dev = DevicesMap.get(systemId);
      const exitingCharger = dev instanceof Charger ? dev : undefined;
      // Or create a new Pixel instance
      const charger =
        exitingCharger ??
        new Charger(
          new BleSession({
            systemId,
            name: sc?.name,
            uuids: PixelsBluetoothIds.charger,
          }),
          sc
        );
      if (!exitingCharger) {
        // Keep track of this new instance
        DevicesMap.set(systemId, charger);
      }
      return charger;
    }
  }
}
