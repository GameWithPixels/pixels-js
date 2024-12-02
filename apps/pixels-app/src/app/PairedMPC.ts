export const MPCRoles = [
  "left3",
  "left2",
  "left1",
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
