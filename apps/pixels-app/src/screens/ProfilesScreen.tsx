import {
  createPixelTheme,
  PixelTheme,
  ProfileCard,
  PxAppPage,
  ProfileInfo,
} from "@systemic-games/react-native-pixels-components";
import { Box, Center, HStack, VStack, Text, Spacer } from "native-base";

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

export function ProfilesScreen() {
  return (
    <PxAppPage theme={paleBluePixelTheme}>
      <VStack space={2}>
        <HStack alignItems="center" paddingRight={2}>
          <Text bold fontSize="md">
            Profiles :
          </Text>
          <Spacer />
          <Text fontSize="md">Edit Profiles</Text>
        </HStack>
        <Center width="100%" alignSelf="center">
          <HStack flexWrap="wrap" space={5} paddingLeft={3}>
            {profiles.map((profileInfo, i) => (
              <Box py={2} key={i}>
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
