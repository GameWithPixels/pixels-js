import { Ionicons } from "@expo/vector-icons";
import { EditRgbKeyframe } from "@systemic-games/pixels-edit-animation";
import {
  ColorWheel,
  ColorWheelColorType,
} from "@systemic-games/react-native-base-components";
import {
  Text,
  HStack,
  VStack,
  Button,
  usePropsResolution,
  IModalProps,
  Actionsheet,
  Box,
  ScrollView,
} from "native-base";
import {
  ColorType,
  SizeType,
} from "native-base/lib/typescript/components/types";
import React from "react";
// eslint-disable-next-line import/namespace
import { GestureResponderEvent, Pressable } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";

interface SimpleColorButtonProps {
  color: ColorType;
  onPress: ((event: GestureResponderEvent) => void) | null | undefined;
}
/**
 * Simple button for selecting basic color shade
 */
function SimpleColorButton(props: SimpleColorButtonProps) {
  return <Button h={8} w={8} bg={props.color} onPress={props.onPress} />;
}

/**
 * Props for customizing elements and behavior of a ColorSelection or GradientColorSelection component.
 */
interface ColorSelectionProps extends IModalProps {
  initialColor?: string;
  modalBg?: ColorType; // modal general background color
  triggerBg?: ColorType; // modal trigger element initial background color
  triggerH?: SizeType; // trigger element height
  triggerW?: SizeType; // trigger element width
  onColorSelected?: ((value: string) => void) | null | undefined; // action when a color was selected trough the color selection component
}
/**
 * Props for customizing elements and behavior of a ColorSelection or GradientColorSelection component.
 */
interface GradientColorSelectionProps extends IModalProps {
  initialColor?: string;
  initialKeyFrames?: EditRgbKeyframe[];
  modalBg?: ColorType; // modal general background color
  triggerBg?: ColorType; // modal trigger element initial background color
  triggerH?: SizeType; // trigger element height
  triggerW?: SizeType; // trigger element width
  onColorSelected?: ((keyframes: EditRgbKeyframe[]) => void) | null | undefined; // action when a color was selected trough the color selection component
}
/**
 * Color selection component used for selecting a single color shade from a color wheel / color picker.
 * {@link ColorSelectionProps} for the component props to customize some elements.
 * @return A ColorSelection JSX element.
 */
export function SimpleColorSelection(props: ColorSelectionProps) {
  const resolvedProps = usePropsResolution("ColorSelection", props);
  const [showModal, setShowModal] = React.useState(false);
  const [SelectedColor, setSelectedColor] = React.useState(props.initialColor);
  console.log("initial color" + props.initialColor);
  // const [overridingOnFace, setOverridingOnFace] = React.useState(false);

  return (
    <>
      <VStack space={2}>
        <Text bold textAlign="left">
          Simple color
        </Text>
        <HStack space={2}>
          <Button
            onPress={() => setShowModal(true)}
            // isDisabled={overridingOnFace}
            bg={SelectedColor}
            w={resolvedProps.triggerW}
            h={resolvedProps.triggerH}
          >
            <Ionicons name="color-palette-outline" size={24} color="white" />
          </Button>
        </HStack>
        {/* CheckBox override face component would be here */}
      </VStack>
      <Actionsheet
        maxHeight="100%"
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      >
        <Actionsheet.Content maxHeight="100%" minHeight="95%">
          <VStack p={2} alignItems="center" space={5} w="100%">
            <Box
              p={2}
              rounded="2xl"
              h="35%"
              w="95%"
              bg="blueGray.700"
              alignItems="center"
              paddingBottom={10}
            >
              {/* TODO */}
              <Text>Render colored die here</Text>
              <Text>Render colored die here</Text>
              <Text>Render colored die here</Text>
              {/* <Box w={200} h={200}>
                {dieRenderer()}
              </Box> */}
            </Box>
            <Box p={2}>
              <ColorWheel
                initialColor={SelectedColor}
                onSelectColor={(hexColor) => {
                  setSelectedColor(hexColor);
                  props.onColorSelected?.(hexColor);
                }}
              />
            </Box>
            <HStack space={2}>
              <SimpleColorButton
                color="black"
                onPress={() => {
                  setSelectedColor("black");
                  props.onColorSelected?.("#000000");
                  setShowModal(false);
                }}
              />
              <SimpleColorButton
                color="white"
                onPress={() => {
                  setSelectedColor("white");
                  props.onColorSelected?.("#FFFFFF");
                  setShowModal(false);
                }}
              />
              <SimpleColorButton
                color="red.500"
                onPress={() => {
                  setSelectedColor("red.500");
                  props.onColorSelected?.("#FF0000");
                  setShowModal(false);
                }}
              />
              <SimpleColorButton
                color="green.500"
                onPress={() => {
                  setSelectedColor("green.500");
                  props.onColorSelected?.("#00FF00");
                  setShowModal(false);
                }}
              />
              <SimpleColorButton
                color="blue.500"
                onPress={() => {
                  setSelectedColor("blue.500");
                  props.onColorSelected?.("#0000FF");
                  setShowModal(false);
                }}
              />
            </HStack>
          </VStack>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}

export function GradientColorSelection(props: GradientColorSelectionProps) {
  //const resolvedProps = usePropsResolution("ColorSelection", props);
  const [showModal, setShowModal] = React.useState(false);
  const [selectedColor, setSelectedColor] = React.useState("red.500");
  const [selectedGradientKey, setSelectedGradientKey] = React.useState(0);
  //Temporary for testing
  const [keyColor1, setKeyColor1] = React.useState("black");
  const [keyColor2, setKeyColor2] = React.useState("black");
  const [keyColor3, setKeyColor3] = React.useState("black");
  const [keyColor4, setKeyColor4] = React.useState("black");
  const [keyColor5, setKeyColor5] = React.useState("black");
  const [keyColor6, setKeyColor6] = React.useState("black");
  const [keyColor7, setKeyColor7] = React.useState("black");
  const [keyColor8, setKeyColor8] = React.useState("black");

  const gradientKeylength = 100 / 7;

  const [_rgbKeyFrames, _setRgbKeyFrames] = React.useState(
    props.initialKeyFrames
  );

  return (
    <>
      <VStack space={2}>
        <Text bold textAlign="left">
          Gradient color
        </Text>
        <HStack space={2}>
          <Button
            onPress={() => setShowModal(true)}
            // isDisabled={overridingOnFace}
            bg={selectedColor}
            w={props.triggerW}
            h={props.triggerH}
          >
            <Ionicons name="color-palette-outline" size={24} color="white" />
          </Button>
        </HStack>
        {/* CheckBox override face component would be here */}
      </VStack>
      <Actionsheet
        maxHeight="95%"
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      >
        <Actionsheet.Content maxHeight="95%" minHeight="95%">
          <ScrollView>
            <VStack p={2} alignItems="center" space={2} w="100%">
              <Box width="100%" alignItems="center">
                <Svg height="200" width="100%">
                  <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                      <Stop offset="0" stopColor={keyColor1} stopOpacity="1" />
                      <Stop
                        offset={`${gradientKeylength}%`}
                        stopColor={keyColor2}
                        stopOpacity="1"
                      />
                      <Stop
                        offset={`${gradientKeylength * 2}%`}
                        stopColor={keyColor3}
                        stopOpacity="1"
                      />
                      <Stop
                        offset={`${gradientKeylength * 3}%`}
                        stopColor={keyColor4}
                        stopOpacity="1"
                      />
                      <Stop
                        offset={`${gradientKeylength * 4}%`}
                        stopColor={keyColor5}
                        stopOpacity="1"
                      />
                      <Stop
                        offset={`${gradientKeylength * 5}%`}
                        stopColor={keyColor6}
                        stopOpacity="1"
                      />
                      <Stop
                        offset={`${gradientKeylength * 6}%`}
                        stopColor={keyColor7}
                        stopOpacity="1"
                      />
                      <Stop
                        offset="100%"
                        stopColor={keyColor8}
                        stopOpacity="1"
                      />
                    </LinearGradient>
                  </Defs>
                  {/* <Ellipse cx="150" cy="100" rx="150" ry="80" fill="url(#grad)" /> */}
                  <Rect
                    x="0"
                    y="25"
                    height="150"
                    width="100%"
                    fill="url(#grad)"
                  />
                </Svg>
              </Box>
              <Box w="100%" h={110} bg="pixelColors.highlightGray" p={2}>
                <HStack w="100%" h="100%">
                  <Box flex={1}>
                    <Pressable
                      onPress={() => {
                        setSelectedGradientKey(1);
                        setKeyColor1(selectedColor);
                      }}
                    >
                      <Box
                        bg={keyColor1}
                        borderColor="white"
                        borderWidth={selectedGradientKey === 1 ? 2 : 1}
                        h="100%"
                      />
                    </Pressable>
                  </Box>
                  <Box flex={1}>
                    <Pressable
                      onPress={() => {
                        setSelectedGradientKey(2);
                        setKeyColor2(selectedColor);
                      }}
                    >
                      <Box
                        bg={keyColor2}
                        h="100%"
                        borderColor="white"
                        borderWidth={selectedGradientKey === 2 ? 2 : 1}
                      />
                    </Pressable>
                  </Box>
                  <Box flex={1}>
                    <Pressable
                      onPress={() => {
                        setSelectedGradientKey(3);
                        setKeyColor3(selectedColor);
                      }}
                    >
                      <Box
                        bg={keyColor3}
                        borderColor="white"
                        borderWidth={selectedGradientKey === 3 ? 2 : 1}
                        h="100%"
                      />
                    </Pressable>
                  </Box>
                  <Box flex={1}>
                    <Pressable
                      onPress={() => {
                        setSelectedGradientKey(4);
                        setKeyColor4(selectedColor);
                      }}
                    >
                      <Box
                        // bg={SelectedGradientKey === 1 ? SelectedColor : "black"}
                        bg={keyColor4}
                        borderColor="white"
                        borderWidth={selectedGradientKey === 4 ? 2 : 1}
                        h="100%"
                      />
                    </Pressable>
                  </Box>
                  <Box flex={1}>
                    <Pressable
                      onPress={() => {
                        setSelectedGradientKey(5);
                        setKeyColor5(selectedColor);
                      }}
                    >
                      <Box
                        // bg={SelectedGradientKey === 1 ? SelectedColor : "black"}
                        bg={keyColor5}
                        borderColor="white"
                        borderWidth={selectedGradientKey === 5 ? 2 : 1}
                        h="100%"
                      />
                    </Pressable>
                  </Box>
                  <Box flex={1}>
                    <Pressable
                      onPress={() => {
                        setSelectedGradientKey(6);
                        setKeyColor6(selectedColor);
                      }}
                    >
                      <Box
                        // bg={SelectedG"radientKey === 1 ? SelectedColor : "black"}
                        bg={keyColor6}
                        borderColor="white"
                        borderWidth={selectedGradientKey === 6 ? 2 : 1}
                        h="100%"
                      />
                    </Pressable>
                  </Box>
                  <Box flex={1}>
                    <Pressable
                      onPress={() => {
                        setSelectedGradientKey(7);
                        setKeyColor7(selectedColor);
                      }}
                    >
                      <Box
                        // bg={SelectedGradientKey === 1 ? SelectedColor : "black"}
                        bg={keyColor7}
                        borderColor="white"
                        borderWidth={selectedGradientKey === 7 ? 2 : 1}
                        h="100%"
                      />
                    </Pressable>
                  </Box>
                  <Box flex={1}>
                    <Pressable
                      onPress={() => {
                        setSelectedGradientKey(8);
                        setKeyColor8(selectedColor);
                      }}
                    >
                      <Box
                        // bg={SelectedGradientKey === 1 ? SelectedColor : "black"}
                        bg={keyColor8}
                        borderColor="white"
                        borderWidth={selectedGradientKey === 8 ? 2 : 1}
                        h="100%"
                      />
                    </Pressable>
                  </Box>

                  {/* <Pressable>
                    <Box
                      borderColor="white"
                      borderWidth={selectedGradientKey === 8 ? 2 : 1}
                      h="100%"
                    >
                      <Svg height="200" width="100%">
                        <Defs>
                          <RadialGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                           
                          </RadialGradient>
                        </Defs>
                        <Rect
                          x="0"
                          y="25"
                          height="150"
                          width="100%"
                          fill="url(#grad)"
                        />
                      </Svg>
                    </Box>
                  </Pressable> */}
                </HStack>
              </Box>
              <Box p={2} width="100%" alignItems="center">
                <ColorWheel
                  initialColor={selectedColor}
                  onSelectColor={setSelectedColor}
                  colorType={ColorWheelColorType.BRIGHT}
                  wheelParams={{
                    x: 40,
                    y: 40,
                    radius: 40,
                    innerRadius: 15,
                    sliceCount: 16,
                    layerCount: 3,
                    segmentCount: 16,
                    brightness: 1, // works
                    dimBrightness: 0.35,
                  }}
                />
              </Box>
              <HStack space={2}>
                <SimpleColorButton
                  color="black"
                  onPress={() => {
                    setSelectedColor("black");
                    setShowModal(false);
                  }}
                />
                <SimpleColorButton
                  color="white"
                  onPress={() => {
                    setSelectedColor("white");
                    setShowModal(false);
                  }}
                />
                <SimpleColorButton
                  color="red.500"
                  onPress={() => {
                    setSelectedColor("red.500");
                    setShowModal(false);
                  }}
                />
                <SimpleColorButton
                  color="green.500"
                  onPress={() => {
                    setSelectedColor("green.500");
                    setShowModal(false);
                  }}
                />
                <SimpleColorButton
                  color="blue.500"
                  onPress={() => {
                    setSelectedColor("blue.500");
                    setShowModal(false);
                  }}
                />
              </HStack>
            </VStack>
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}
