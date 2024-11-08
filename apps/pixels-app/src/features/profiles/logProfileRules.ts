import { Profiles } from "@systemic-games/react-native-pixels-connect";

export function logProfileRules(profile: Profiles.Profile): void {
  for (const rule of profile.rules) {
    console.log(" - Rule of type " + rule.condition.type);
    if (rule.condition instanceof Profiles.ConditionRolled) {
      console.log("    Mapped faces: " + rule.condition.faces.join(", "));
    }
    for (const action of rule.actions) {
      if (action instanceof Profiles.ActionPlayAnimation) {
        const anim = action.animation;
        console.log(
          anim
            ? `    * Play anim ${anim.name}, type: ${anim.type},` +
                ` duration: ${anim.duration}, count ${action.loopCount}`
            : "    * No animation!"
        );
      } else if (action instanceof Profiles.ActionMakeWebRequest) {
        console.log(
          `    * Web request to "${action.url}" with value "${action.value}"`
        );
      } else if (action instanceof Profiles.ActionSpeakText) {
        console.log(
          `    * Speak "${action.text}" with volume ${action.volume} pitch ${action.pitch} and rate ${action.rate}`
        );
      } else if (action instanceof Profiles.ActionPlayAudioClip) {
        console.log(
          `    * Clip "${action.clipUuid}" with volume ${action.volume} and loop count ${action.loopCount}`
        );
      }
    }
  }
}
