import {
  FontAwesome5,
  AntDesign,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import {
  BatteryLevel,
  Card,
  createPixelTheme,
  PixelTheme,
  ProfilesScrollList,
  PxAppPage,
  RSSIStrength,
} from "@systemic-games/react-native-pixels-components";
import {
  Box,
  Center,
  Text,
  VStack,
  Image,
  HStack,
  Input,
  Spacer,
  Divider,
  Button,
  ChevronRightIcon,
  Pressable,
} from "native-base";

import { PixelDetailScreenRouteProp } from "~/Navigation";

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

export default function PixelDetailScreen() {
  //Will be used when the correct nested screen are in place
  // const navigation =
  //   useNavigation<StackNavigationProp<PixelDetailScreenParamList>>();
  const route = useRoute<PixelDetailScreenRouteProp>();
  const { pixelName } = route.params;
  return (
    <PxAppPage theme={paleBluePixelTheme}>
      <VStack space={6} width="100%" maxW="100%">
        <Center bg="white" rounded="lg" px={2}>
          <Input
            InputRightElement={
              <FontAwesome5 name="pen" size={20} color="black" />
            }
            size="2xl"
            variant="unstyled"
            placeholder={pixelName}
            color="black"
          />
        </Center>
        <Center>
          <HStack space={12} alignItems="center">
            {/* PlaceHolderImage : would be replaced by 3d render of dice */}
            <Image
              size={40}
              source={require("../../../../assets/DieImageTransparent.png")}
              alt="placeHolder"
            />
            <VStack space={3} p={2} rounded="md" w="40%">
              <VStack bg="pixelColors.highlightGray" rounded="md">
                <BatteryLevel iconSize="50" textSize="lg" percentage={0.8} />
                <RSSIStrength iconSize="50" textSize="lg" percentage={-40} />
              </VStack>
              <Box bg="pixelColors.highlightGray" rounded="md" p={2}>
                <VStack space={2}>
                  <HStack>
                    <Text bold>Face up : </Text>
                    <Spacer />
                    <Text>10</Text>
                  </HStack>
                  <HStack>
                    <Text bold>Status : </Text>
                    <Spacer />
                    <Text>on face</Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </HStack>
        </Center>
        <ProfilesScrollList
          availableProfiles={[
            { profileName: "Rainbow" },
            { profileName: "Waterfall" },
            { profileName: "Red to Blue" },
            { profileName: "Speak Numbers" },
            { profileName: "Custom Profile" },
            { profileName: "Flashy" },
            { profileName: "Explosion" },
          ]}
        />

        {/* {DiceStats} */}
        <Center width="100%" maxW="100%" h="150px">
          <HStack space={4}>
            <Card
              minW={10}
              w="180px"
              maxW="200px"
              verticalSpace={2}
              alignItems="center"
              bg="primary.300"
            >
              <HStack alignItems="center" space={3}>
                <FontAwesome5 name="dice" size={24} color="black" />
                <Text bold fontSize="xl">
                  Rolls
                </Text>
              </HStack>
              <HStack space={2} alignItems="center" p={2}>
                <Box w="50%">
                  <Text>Session</Text>
                  <Divider bg="white" />
                  <Text fontSize="xl">26</Text>
                </Box>
                <Box w="50%">
                  <Text>Lifetime</Text>
                  <Divider bg="white" />
                  <Text isTruncated fontSize="xl">
                    285
                  </Text>
                </Box>
              </HStack>
            </Card>
            <Card
              minW={10}
              w="180px"
              maxW="200px"
              verticalSpace={2}
              alignItems="center"
              bg="primary.300"
            >
              <HStack alignItems="center" space={3}>
                <MaterialCommunityIcons name="clock" size={24} color="black" />
                <Text bold fontSize="xl">
                  Use Time
                </Text>
              </HStack>
              <HStack space={2} alignItems="center" p={2}>
                <Box w="50%">
                  <Text>Session</Text>
                  <Divider bg="white" />
                  <HStack alignItems="baseline">
                    <Text fontSize="xl">32 </Text>
                    <Text>min</Text>
                  </HStack>
                </Box>
                <Box w="50%">
                  <Text>Lifetime</Text>
                  <Divider bg="white" />
                  <HStack alignItems="baseline">
                    <Text fontSize="xl">3.5 </Text>
                    <Text>h</Text>
                  </HStack>
                </Box>
              </HStack>
            </Card>
          </HStack>
        </Center>

        {/* {Firmware infos} */}
        <Divider bg="primary.200" width="90%" alignSelf="center" />
        <Box maxWidth="100%">
          <VStack space={4} p={3} rounded="md" maxWidth="100%">
            <HStack
              alignItems="center"
              rounded="md"
              flex={1}
              space={2}
              maxW="100%"
            >
              <Text isTruncated bold>
                Firmware date :
              </Text>
              <Spacer />
              <Box bg="gray.400" rounded="md" p={2} maxW="100%">
                <Text isTruncated>{new Date().toUTCString()}</Text>
              </Box>
            </HStack>
            <Button
              leftIcon={
                <MaterialCommunityIcons name="update" size={24} color="white" />
              }
            >
              <Text bold>Update firmware</Text>
            </Button>
          </VStack>
        </Box>

        {/* {Advanced Settings infos} */}
        <Divider bg="primary.200" width="90%" alignSelf="center" />
        <Pressable>
          <HStack
            alignItems="center"
            bg="primary.500"
            p={3}
            rounded="md"
            w="90%"
            alignSelf="center"
          >
            <Text bold>Advanced Settings</Text>
            <Spacer />
            <ChevronRightIcon />
          </HStack>
        </Pressable>

        <Divider bg="primary.200" width="90%" alignSelf="center" />
        <Button
          leftIcon={<AntDesign name="disconnect" size={24} color="white" />}
          w="90%"
          alignSelf="center"
        >
          <Text bold>Unpair Dice</Text>
        </Button>
      </VStack>
    </PxAppPage>
  );
}
