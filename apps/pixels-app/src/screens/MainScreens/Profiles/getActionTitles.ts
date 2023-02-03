import {
  ActionTypeValues,
  EditAction,
  EditActionPlayAnimation,
  EditActionPlayAudioClip,
} from "@systemic-games/pixels-edit-animation";

export default function (actions: EditAction[]): string[] {
  const actionsTitles: any[] = [];

  actions.forEach(function (action) {
    if (action.type === ActionTypeValues.playAnimation) {
      actionsTitles.push(
        "Play " + (action as EditActionPlayAnimation).animation?.name
      );
    } else {
      actionsTitles.push(
        "Play " + (action as EditActionPlayAudioClip).clip?.name
      );
    }
  });
  return actionsTitles;
}
