import React from "react";

import { DieRendererWithFocus } from "./DieRendererWithFocus";
import { ProfileDieRenderer } from "./ProfileDieRenderer";

import { PairedDie } from "~/app/PairedDie";
import { getCompatibleDiceTypes } from "~/features/profiles";
import { DieRendererProps } from "~/features/render3d/DieRenderer";
import { usePairedDieProfileUuid, useProfile } from "~/hooks";

export const PairedDieRenderer = React.memo(function PixelDieRenderer({
  pairedDie,
  speed,
}: { pairedDie: Pick<PairedDie, "pixelId" | "dieType" | "colorway"> } & Pick<
  DieRendererProps,
  "speed"
>) {
  const profile = useProfile(usePairedDieProfileUuid(pairedDie));
  return getCompatibleDiceTypes(profile.dieType).includes(pairedDie.dieType) ? (
    <ProfileDieRenderer
      profile={profile}
      colorway={pairedDie.colorway}
      speed={speed}
    />
  ) : (
    <DieRendererWithFocus
      dieType={pairedDie.dieType}
      colorway={pairedDie.colorway}
    />
  );
});
