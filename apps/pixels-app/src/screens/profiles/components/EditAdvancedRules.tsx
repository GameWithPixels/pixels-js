import React from "react";

import { EditRuleCallback, RulesSection } from "./RulesSection";

import { connectionFlags, batteryFlags } from "~/actionTypes";
import { SlideInView } from "~/components/SlideInView";

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
