import React from "react";

import { EditRuleCallback, RulesSection } from "./RulesSection";

import { connectionFlags, batteryFlags } from "~/actionTypes";
import { SlideInView } from "~/components/SlideInView";
import { Banner } from "~/components/banners";

export function EditAdvancedRules({
  profileUuid,
  onEditRule,
}: {
  profileUuid: string;
  onEditRule: EditRuleCallback;
}) {
  const [showHelpBanner, setShowHelpBanner] = React.useState(true);
  return (
    <SlideInView style={{ paddingTop: 10, paddingHorizontal: 10, gap: 10 }}>
      <Banner
        visible={showHelpBanner}
        collapsedMarginBottom={-10}
        onDismiss={() => setShowHelpBanner(false)}
      >
        Advanced rules blah blah.
      </Banner>
      <RulesSection
        profileUuid={profileUuid}
        onEditRule={onEditRule}
        conditionType="connection"
        flags={connectionFlags}
      />
      <RulesSection
        profileUuid={profileUuid}
        onEditRule={onEditRule}
        conditionType="battery"
        flags={batteryFlags}
      />
    </SlideInView>
  );
}
