import {
  PixelTheme,
  createPixelTheme,
  PxAppPage,
  RuleComparisonWidget,
  RuleConditionSelection,
  ProfilesActionSheet,
  PlayBackFace,
  SliderComponent,
  FaceIndex2,
} from "@systemic-games/react-native-pixels-components";
import {
  Box,
  ChevronDownIcon,
  HStack,
  Spacer,
  VStack,
  Text,
  Button,
} from "native-base";
import React from "react";

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

const conditions = [
  "Pixel roll is...",
  "Pixel wakes up/sleep",
  "Pixel is picked up",
  "Pixel is rolling",
  "Pixel is crooked",
  "Bluetooth Event...",
  "Battery Event...",
  "Pixel is idle for...",
];

const conditions2 = ["Trigger Pattern", "Play Audio CLip"];

const Patterns = [
  {
    profileName: "Pattern 1",
    imageRequirePath: require("~/../assets/YellowDice.png"),
  },
  {
    profileName: "Pattern 2",
    imageRequirePath: require("~/../assets/BlueDice.png"),
  },
  {
    profileName: "Pattern 3",
    imageRequirePath: require("~/../assets/BlueDice.png"),
  },
  {
    profileName: "Pattern 4",
    imageRequirePath: require("~/../assets/RainbowDice.png"),
  },
  {
    profileName: "Pattern 5",
    imageRequirePath: require("~/../assets/DieImageTransparent.png"),
  },
  {
    profileName: "Pattern 6",
    imageRequirePath: require("~/../assets/DieImageTransparent.png"),
  },
  {
    profileName: "Pattern 7",
    imageRequirePath: require("~/../assets/BlueDice.png"),
  },
  {
    profileName: "Pattern 8",
    imageRequirePath: require("~/../assets/YellowDice.png"),
  },
  {
    profileName: "Pattern 9",
    imageRequirePath: require("~/../assets/DieImageTransparent.png"),
  },
  {
    profileName: "Pattern 10",
    imageRequirePath: require("~/../assets/RainbowDice.png"),
  },
  {
    profileName: "Pattern 11",
    imageRequirePath: require("~/../assets/DieImageTransparent.png"),
  },
  {
    profileName: "Pattern 12",
    imageRequirePath: require("~/../assets/RainbowDice.png"),
  },
  {
    profileName: "Pattern 13",
    imageRequirePath: require("~/../assets/BlueDice.png"),
  },
  {
    profileName: "Pattern 14",
    imageRequirePath: require("~/../assets/DieImageTransparent.png"),
  },
  {
    profileName: "Pattern 15",
    imageRequirePath: require("~/../assets/YellowDice.png"),
  },
];

interface RuleWidgetInfo {
  widgetIndex: number;
}
interface RuleWidgetProps {
  //Temporary
  ruleInfo: RuleWidgetInfo;
  children?: React.ReactNode | React.ReactNode[];
  onDelete?: (() => void) | null | undefined;
}
function RuleWidget(props: RuleWidgetProps) {
  return (
    <VStack space={2} p={4} borderWidth={1} borderColor="gray.300" rounded="lg">
      <HStack space={2} width="100%" alignItems="center">
        <Box flex={10} w="100%">
          <RuleConditionSelection
            widgetIndexInList={props.ruleInfo.widgetIndex}
            conditions={conditions2}
            conditionIndex={0}
          />
        </Box>
        <Button
          onPress={() => {
            props.onDelete?.();
          }}
          flex={1}
        >
          <Text fontSize="xl">X</Text>
        </Button>
      </HStack>
      {props.children}
    </VStack>
  );
}

export default function ProfileEditRuleScreen() {
  const [rulesWidgetList, setRulesWidgetList] = React.useState<
    RuleWidgetInfo[]
  >([]);
  const [pattern, _setPattern] = React.useState(
    "-- Select a Lighting Pattern --"
  );
  const [_audioClip, _setAudioClip] = React.useState("-- Select Audio Clip --");

  //   function arddRule(rule: PixelInfo) {
  //     const pixelName = pixelToAdd.name;
  //     scannedPixels.splice(
  //       scannedPixels.findIndex((pixel) => {
  //         return pixel.name === pixelName;
  //       }),
  //       1
  //     );
  //     setPairedPixels([...pairedPixels, pixelToAdd]);
  //   }

  function addRule() {
    let widgetIndex = rulesWidgetList.length + 1;
    widgetIndex = widgetIndex === 0 ? 1 : widgetIndex;
    const ruleWidgetInfo: RuleWidgetInfo = { widgetIndex };
    setRulesWidgetList([...rulesWidgetList, ruleWidgetInfo]);
    console.log(rulesWidgetList);
  }

  function removeRule(widgetIndex: number) {
    rulesWidgetList.splice(
      rulesWidgetList.findIndex((widget) => {
        return widget.widgetIndex === widgetIndex;
      }),
      1
    );
    setRulesWidgetList([...rulesWidgetList]);
  }
  return (
    <PxAppPage theme={paleBluePixelTheme} scrollable>
      <VStack space={2}>
        <VStack
          space={2}
          p={4}
          borderWidth={1}
          borderColor="gray.300"
          rounded="lg"
        >
          <RuleConditionSelection
            widgetIndexInList={0}
            conditions={conditions}
            conditionIndex={0}
          />
          <RuleComparisonWidget
            borderWidth={2}
            title="Comparison"
            items={[
              { title: "Less" },
              { title: "Equal" },
              { title: "Greater" },
            ]}
          />
          {/* <FaceIndex faces={20} /> */}
          <FaceIndex2 faces={20} />
        </VStack>

        {rulesWidgetList.map((ruleWidgetInfo, key) => (
          <RuleWidget
            key={key}
            ruleInfo={ruleWidgetInfo}
            onDelete={() => {
              removeRule(ruleWidgetInfo.widgetIndex);
            }}
            children={[
              <Text bold>Lighting Pattern</Text>,
              <ProfilesActionSheet
                trigger={
                  <HStack
                    p={3}
                    paddingLeft={4}
                    flex={2}
                    w="100%"
                    alignItems="center"
                    rounded="lg"
                    bg="darkBlue.800"
                  >
                    <Box flex={2}>
                      <Text fontSize="md">{pattern}</Text>
                    </Box>
                    <Spacer />
                    <Box>
                      <ChevronDownIcon />
                    </Box>
                  </HStack>
                }
                drawerTitle="Select Pattern"
                ProfilesInfo={Patterns}
              />,
              <PlayBackFace title="Play on Face" />,
              <SliderComponent sliderTitle="Repeat Count" step={1} />,
            ]}
          />
        ))}

        {/* <VStack
          space={2}
          p={4}
          borderWidth={1}
          borderColor="gray.300"
          rounded="lg"
        >
          <RuleConditionSelection
            title="Then"
            conditions={conditions2}
            conditionIndex={0}
          />
          <Text bold>Lighting Pattern</Text>
          <ProfilesActionSheet
            trigger={
              <HStack
                p={3}
                paddingLeft={4}
                flex={2}
                w="100%"
                alignItems="center"
                rounded="lg"
                bg="darkBlue.800"
              >
                <Box flex={2}>
                  <Text fontSize="md">{pattern}</Text>
                </Box>
                <Spacer />
                <Box>
                  <ChevronDownIcon />
                </Box>
              </HStack>
            }
            drawerTitle="Select Pattern"
            ProfilesInfo={Patterns}
          />
          <PlayBackFace title="Play on Face" />
          <SliderComponent sliderTitle="Repeat Count" step={1} />
        </VStack>

        <VStack
          space={2}
          p={4}
          borderWidth={1}
          borderColor="gray.300"
          rounded="lg"
        >
          <RuleConditionSelection
            title="And"
            conditions={conditions2}
            conditionIndex={1}
          />
          <Text bold>Audio Clip</Text>
          <ProfilesActionSheet
            trigger={
              <HStack
                p={3}
                paddingLeft={4}
                flex={2}
                w="100%"
                alignItems="center"
                rounded="lg"
                bg="darkBlue.800"
              >
                <Box flex={2}>
                  <Text fontSize="md">{audioClip}</Text>
                </Box>
                <Spacer />
                <Box>
                  <ChevronDownIcon />
                </Box>
              </HStack>
            }
            drawerTitle="Select Audio Clip"
            ProfilesInfo={Patterns}
          />
        </VStack> */}
        <Button onPress={() => addRule()}>ADD RULE</Button>
      </VStack>
    </PxAppPage>
  );
}
