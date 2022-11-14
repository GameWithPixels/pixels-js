import { FontAwesome5 } from "@expo/vector-icons";
import {
  BatteryLevel,
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
} from "native-base";

export default function PixelDetailScreen() {
  return (
    <PxAppPage theme={PixelTheme}>
      <VStack space={5}>
        <Center bg="white" rounded="lg" px={2}>
          <Input
            InputRightElement={
              <FontAwesome5 name="pen" size={20} color="black" />
            }
            size="2xl"
            variant="unstyled"
            placeholder="DICE NAME"
            color="black"
          />
        </Center>
        <Center>
          <HStack space={20} alignItems="center">
            {/* PlaceHolderImage : would be replaced by 3d render of dice */}
            <Image
              size={40}
              source={require("../../../../apps/pixels-app/assets/DieImageTransparent.png")}
              alt="placeHolder"
            />
            <VStack space={2}>
              <BatteryLevel iconSize="50" textSize="lg" percentage={0.8} />
              <RSSIStrength iconSize="50" textSize="lg" percentage={-40} />
            </VStack>
          </HStack>
        </Center>
        <ProfilesScrollList
          availableProfiles={[
            { profileName: "Rainbow" },
            { profileName: "Waterfall" },
            { profileName: "Red to Blue" },
            { profileName: "My favorite profile" },
            { profileName: "customProfile" },
          ]}
        />
        <Divider />
        <VStack space={2}>
          <HStack alignItems="center" rounded="md" maxW="100%" space={2}>
            <Text bold>Firmware date :</Text>
            <Spacer />
            <Box bg="gray.500" rounded="lg" p={2}>
              <Text>{new Date().toUTCString()}</Text>
            </Box>
          </HStack>
          <Button>Update</Button>
        </VStack>
        <Divider />
      </VStack>
    </PxAppPage>
  );
}
