import {
  createPixelTheme,
  PixelTheme,
  ProfileCard,
  PxAppPage,
  ProfileInfo,
} from "@systemic-games/react-native-pixels-components";
import { Box, Center, HStack, VStack, Text } from "native-base";

const paleBluePixelThemeParams = {
  theme: PixelTheme,
  primaryColors: {
    "50": "#1b94ff",
    "100": "#0081f2",
    "200": "#006cca",
    "300": "#0256a0",
    "400": "#024178",
    "500": "#04345e",
    "600": "#062846",
    "700": "#051b2e",
    "800": "#040f18",
    "900": "#010204",
  },
};
const paleBluePixelTheme = createPixelTheme(paleBluePixelThemeParams);

export function ProfilesScreen() {
  const profiles: ProfileInfo[] = [
    { profileName: "test" },
    { profileName: "test2" },
    { profileName: "test3" },
    { profileName: "test4" },
    { profileName: "test5" },
    { profileName: "test6" },
    { profileName: "test7" },
    { profileName: "test8" },
    { profileName: "test9" },
    { profileName: "test10" },
    { profileName: "test11" },
    { profileName: "test12" },
    { profileName: "test13" },
    { profileName: "test14" },
    { profileName: "test15" },
  ];
  return (
    <PxAppPage theme={paleBluePixelTheme}>
      <VStack space={2}>
        <Text bold fontSize="md">
          Profiles :
        </Text>
        <Center width="100%" alignSelf="center">
          <HStack flexWrap="wrap" space={5} paddingLeft={2}>
            {profiles.map((profileInfo) => (
              <Box py={2}>
                <ProfileCard
                  w="170px"
                  h="130px"
                  imageSize={70}
                  textSize="md"
                  profileName={profileInfo.profileName}
                  borderWidth={1}
                />
              </Box>
            ))}
          </HStack>
        </Center>
      </VStack>
    </PxAppPage>
  );
}
