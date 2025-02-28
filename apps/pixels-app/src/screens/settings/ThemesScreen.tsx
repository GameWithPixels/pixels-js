import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React from "react";
import { ScrollView, View } from "react-native";
import {
  Divider,
  Text as PaperText,
  TextProps,
  ThemeProvider,
} from "react-native-paper";

import { AppScreensNames, AppThemesNames } from "~/app/displayNames";
import { useAppDispatch } from "~/app/hooks";
import { RootScreenName, ThemesScreenProps } from "~/app/navigation";
import { getBottomSheetProps, AppThemes } from "~/app/themes";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { TouchableCard } from "~/components/TouchableCard";
import {
  BottomSheetModalCloseButton,
  OutlineButton,
} from "~/components/buttons";
import { setScreenTheme } from "~/features/store";
import { useAppTheme, useBottomSheetBackHandler } from "~/hooks";

function Text(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="bodyLarge" {...props} />;
}

function TextButton(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="labelLarge" {...props} />;
}

function ThemePicker({ screen }: { screen: RootScreenName }) {
  const theme = useAppTheme(screen);
  const appDispatch = useAppDispatch();
  const themesKeys = Object.keys(AppThemes) as (keyof typeof AppThemes)[];
  const selectedThemeKey =
    themesKeys[Object.values(AppThemes).indexOf(theme)] ?? "dark";

  const [visible, setVisible] = React.useState(false);
  const sheetRef = React.useRef<BottomSheetModal>(null);
  const onChange = useBottomSheetBackHandler(sheetRef);
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const { colors } = theme;
  return (
    <>
      <Text>
        {AppScreensNames[screen]} Screen:{"  "}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <ThemeProvider theme={AppThemes[selectedThemeKey]}>
          <TouchableCard
            gradientBorder="bright"
            style={{ flexGrow: 1 }}
            contentStyle={{ padding: 10 }}
          >
            <TextButton>{AppThemesNames[selectedThemeKey]}</TextButton>
          </TouchableCard>
        </ThemeProvider>
        <OutlineButton onPress={() => setVisible(true)}>Change</OutlineButton>
      </View>
      <ThemeProvider theme={AppThemes.light}>
        <BottomSheetModal
          ref={sheetRef}
          enableDynamicSizing
          onDismiss={() => setVisible(false)}
          onChange={onChange}
          {...getBottomSheetProps(colors)}
        >
          <BottomSheetScrollView
            contentContainerStyle={{ padding: 20, gap: 10 }}
          >
            <Text>Select Theme</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {themesKeys.map((themeKey) => (
                <ThemeProvider key={themeKey} theme={AppThemes[themeKey]}>
                  <TouchableCard
                    selectable
                    selected={selectedThemeKey === themeKey}
                    gradientBorder="bright"
                    contentStyle={{ padding: 10, minWidth: 80 }}
                    onPress={() => {
                      appDispatch(setScreenTheme({ screen, themeKey }));
                      setVisible(false);
                    }}
                  >
                    <TextButton>{AppThemesNames[themeKey]}</TextButton>
                  </TouchableCard>
                </ThemeProvider>
              ))}
            </View>
          </BottomSheetScrollView>
          <BottomSheetModalCloseButton onPress={sheetRef.current?.dismiss} />
        </BottomSheetModal>
      </ThemeProvider>
    </>
  );
}

function ThemesPage({
  navigation,
}: {
  navigation: ThemesScreenProps["navigation"];
}) {
  return (
    <View style={{ height: "100%" }}>
      <PageHeader onGoBack={() => navigation.goBack()}>Themes</PageHeader>
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={{
          paddingVertical: 20,
          paddingHorizontal: 20,
          gap: 20,
        }}
      >
        <ThemePicker screen="home" />
        <Divider style={{ marginVertical: 10 }} />
        <ThemePicker screen="profiles" />
        <Divider style={{ marginVertical: 10 }} />
        <ThemePicker screen="settings" />
      </ScrollView>
    </View>
  );
}

export function ThemesScreen({ navigation }: ThemesScreenProps) {
  return (
    <AppBackground>
      <ThemesPage navigation={navigation} />
    </AppBackground>
  );
}
