import React from "react";

import { EditRuleCallback, RulesSection } from "./RulesSection";

import { SlideInView } from "~/components/SlideInView";
import { connectionFlags, batteryFlags } from "~/features/profiles";

export function EditAdvancedRules({
  profileUuid,
  onEditRule,
}: {
  profileUuid: string;
  onEditRule: EditRuleCallback;
}) {
  return (
    <SlideInView style={{ paddingTop: 10, paddingHorizontal: 10, gap: 10 }}>
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
