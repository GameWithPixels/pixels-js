import { getMPC, MPC } from "@systemic-games/react-native-pixels-connect";

import { MPCRole, MPCRoles, PairedMPC } from "~/app/PairedMPC";

function logError(
  action: string,
  name: string,
  role: string,
  error: unknown
): void {
  console.warn(`Error ${action} for MPC ${name} (${role}): ${error}`);
}

function forEachMPC(
  pairedMPCs: PairedMPC[],
  callback: (args: { mpc: MPC; role: MPCRole }) => Promise<void>
) {
  pairedMPCs.forEach(({ pixelId, name, role }) => {
    const mpc = getMPC(pixelId);
    if (mpc?.status === "ready") {
      callback({ mpc, role }).catch((e) => logError("syncing", name, role, e));
    }
  });
}

export function playAnimOnMPCs(pairedMPCs: PairedMPC[], animIndex: number) {
  forEachMPC(pairedMPCs, ({ mpc, role }) =>
    mpc.playAnim(animIndex, 0, MPCRoles.indexOf(role), 0)
  );
}

export function stopAnimOnMPCs(pairedMPCs: PairedMPC[], animIndex: number) {
  forEachMPC(pairedMPCs, ({ mpc }) => mpc.stopAnim(animIndex));
}

export function syncMPCs(pairedMPCs: PairedMPC[]) {
  if (!pairedMPCs.length) return;
  console.log("Syncing MPCs");
  const referenceTime = 1000; // Arbitrary reference time
  const maxDelayTime = 100; // Expected max delay before we've messages all controllers
  const timeOffset = 0;
  const distance = 12;
  const targetTime = Date.now() + maxDelayTime;
  forEachMPC(pairedMPCs, ({ mpc, role }) => {
    const xcoord = MPCRoles.indexOf(role) - 2.5;
    return mpc.sync(
      targetTime,
      referenceTime,
      xcoord * timeOffset,
      xcoord * distance
    );
  });
}
