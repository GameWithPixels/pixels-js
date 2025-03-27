import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { FlatList, View } from "react-native";
import { Text } from "react-native-paper";

import { AppActionCard } from "./components/AppActionCard";
import { CreateAppActionModal } from "./components/CreateAppActionModal";

import { useAppSelector, useAppStore } from "~/app/hooks";
import { AppActionsListScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { RotatingGradientBorderCard } from "~/components/GradientBorderCard";
import { PageHeader } from "~/components/PageHeader";
import { GradientIconButton } from "~/components/buttons";
import { addAppAction } from "~/features/store";

function AppActionsListPage({
  navigation,
}: {
  navigation: AppActionsListScreenProps["navigation"];
}) {
  const store = useAppStore();
  const actionsUuids = useAppSelector((state) => state.appActions.entries.ids);
  const onPressAction = React.useCallback(
    (uuid: string) =>
      navigation.navigate("editAppAction", { appActionUuid: uuid }),
    [navigation]
  );
  const [createActionModalVisible, setCreateActionModalVisible] =
    React.useState(false);
  return (
    <View style={{ height: "100%" }}>
      <PageHeader
        rightElement={() => (
          <GradientIconButton
            icon={(props) => <MaterialCommunityIcons name="plus" {...props} />}
            onPress={() => setCreateActionModalVisible(true)}
            style={{ marginRight: 5 }}
          />
        )}
      >
        <Text variant="titleLarge">App Actions</Text>
      </PageHeader>
      {actionsUuids.length ? (
        <FlatList
          data={actionsUuids}
          renderItem={({ item: uuid }) => (
            <AppActionCard
              uuid={uuid as string}
              onPressAction={onPressAction}
            />
          )}
          contentContainerStyle={{ padding: 10, gap: 10 }}
        />
      ) : (
        <RotatingGradientBorderCard
          style={{
            width: "80%",
            marginTop: 20,
            alignSelf: "center",
          }}
          contentStyle={{
            paddingVertical: 40,
            paddingHorizontal: 20,
            gap: 40,
          }}
        >
          <Text variant="titleLarge">App Actions</Text>
          <Text variant="bodyMedium" style={{ alignSelf: "stretch" }}>
            Customize how the app responds to rolls.
          </Text>
          <Text variant="bodyMedium" style={{ alignSelf: "stretch" }}>
            Tap the + button to add a new add action.
          </Text>
        </RotatingGradientBorderCard>
      )}
      <CreateAppActionModal
        visible={createActionModalVisible}
        onCreateAppAction={(type) => {
          store.dispatch(addAppAction({ type, enabled: true, data: {} }));
          const appActionUuid = store
            .getState()
            .appActions.entries.ids.at(-1) as string | undefined;
          setCreateActionModalVisible(false);
          appActionUuid &&
            navigation.navigate("editAppAction", { appActionUuid });
        }}
        onDismiss={() => setCreateActionModalVisible(false)}
      />
    </View>
  );
}

export function AppActionsListScreen({
  navigation,
}: AppActionsListScreenProps) {
  return (
    <AppBackground>
      <AppActionsListPage navigation={navigation} />
    </AppBackground>
  );
}
