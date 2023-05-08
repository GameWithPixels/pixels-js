import { PixelAppPage } from "@systemic-games/react-native-pixels-components";
import React from "react";

import ObservableAnimationEditor from "./components/ObservableAnimationEditor";

import { useAppUpdateAnimation } from "~/app/hooks";
import FromStore from "~/features/FromStore";
import { makeObservable } from "~/features/makeObservable";
import { AnimationEditScreenProps } from "~/navigation";

export default function AnimationEditScreen({
  route,
}: AnimationEditScreenProps) {
  const { animationUuid } = route.params;
  const observableAnim = React.useMemo(
    () => makeObservable(FromStore.loadAnimation(animationUuid)),
    [animationUuid]
  );

  // TODO anim is always saved on leaving screen
  const updateAnim = useAppUpdateAnimation();
  React.useEffect(() => {
    return () => {
      updateAnim(observableAnim);
    };
  }, [observableAnim, updateAnim]);

  return (
    <PixelAppPage>
      <ObservableAnimationEditor observableAnim={observableAnim} />
    </PixelAppPage>
  );
}
