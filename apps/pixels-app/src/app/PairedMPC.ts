export const MPCRoles = [
  "left1",
  "left2",
  "left3",
  "right1",
  "right2",
  "right3",
] as const;

export type MPCRole = (typeof MPCRoles)[number];

export type PairedMPC = Readonly<{
  systemId: string;
  pixelId: number;
  name: string;
  ledCount: number;
  firmwareTimestamp: number;
  profileHash: number;
  role: MPCRole;
}>;
