import { PixelAppPage } from "@systemic-games/react-native-pixels-components";
import React from "react";

import { ObservableProfileEditor } from "./components/ObservableProfileEditor";

import { useAppUpdateProfile } from "~/app/hooks";
import { FromStore } from "~/features/FromStore";
import { makeObservable } from "~/features/makeObservable";
import { ProfileEditScreenProps } from "~/navigation";

export function ProfileEditScreen({
  navigation,
  route,
}: ProfileEditScreenProps) {
  const { profileUuid } = route.params;
  const observableProfile = React.useMemo(
    () => makeObservable(FromStore.loadProfile(profileUuid)),
    [profileUuid]
  );

  // TODO profile is always saved on leaving screen
  const updateProfile = useAppUpdateProfile();
  React.useEffect(() => {
    return () => {
      updateProfile(observableProfile);
    };
  }, [observableProfile, updateProfile]);

  return (
    <PixelAppPage>
      <ObservableProfileEditor
        navigation={navigation}
        observableProfile={observableProfile}
      />
    </PixelAppPage>
  );
}
