import { Ionicons } from "@expo/vector-icons";
import { EditRgbKeyframe } from "@systemic-games/pixels-edit-animation";
import {
  ColorWheel,
  ColorWheelColorType,
  FastBoxProps,
  FastButton,
  FastButtonProps,
  FastHStack,
  FastVStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import {
  Text,
  usePropsResolution,
  IModalProps,
  Actionsheet,
  Box,
  ScrollView,
  Pressable,
  IActionsheetProps,
} from "native-base";
import React from "react";
// eslint-disable-next-line import/namespace
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";

/**
 * Simple button for selecting basic color shade
 */
function ColorButton(props: FastButtonProps) {
  return <FastButton h={8} w={8} bg={props.color} {...props} />;
}

/**
 * Props for customizing elements and behavior of a ColorSelection or GradientColorSelection component.
 */
interface ColorSelectorProps extends FastBoxProps {
  initialColor?: string;
  onColorChange?: ((value: string) => void) | null | undefined; // action when a color was selected trough the color selection component
}

/**
 * Color selection component used for selecting a single color shade from a color wheel / color picker.
 * {@link ColorSelectorProps} for the component props to customize some elements.
 * @return A ColorSelection JSX element.
 */
export function SimpleColorSelector(props: ColorSelectorProps) {
  const { initialColor, onColorSelected, ...resolvedProps } =
    usePropsResolution("ColorSelection", props);
  const { isOpen, onOpen, onClose } = useDisclose();
  const [selectedColor, setSelectedColor] = React.useState(initialColor);
  return (
    <>
      <FastVStack {...resolvedProps}>
        <Text bold textAlign="left">
          Simple color
        </Text>
        <FastButton mt={2} onPress={onOpen} bg={selectedColor}>
          <Ionicons name="color-palette-outline" size={24} color="white" />
        </FastButton>
        {/* CheckBox override face component would be here */}
      </FastVStack>

      <ColorSelectorActionsheet
        isOpen={isOpen}
        onClose={onClose}
        selectedColor={selectedColor}
        onColorSelected={onColorSelected}
        setSelectedColor={setSelectedColor}
      />
    </>
  );
}

function ColorSelectorActionsheet({
  selectedColor,
  onColorSelected,
  setSelectedColor,
  onClose,
  ...props
}: {
  selectedColor: string;
  onColorSelected: ColorSelectorProps["onColorChange"];
  setSelectedColor: (color: string) => void;
} & IActionsheetProps) {
  return (
    <Actionsheet maxHeight="95%" onClose={onClose} {...props}>
      <Actionsheet.Content maxHeight="100%" minHeight="95%">
        <FastVStack p={2} alignItems="center" w="100%">
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
          <Box mt={5} p={2}>
            <ColorWheel
              initialColor={selectedColor}
              onSelectColor={(hexColor) => {
                setSelectedColor(hexColor);
                onColorSelected?.(hexColor);
              }}
            />
          </Box>
          <FastHStack mt={5}>
            <ColorButton
              color="black"
              onPress={() => {
                setSelectedColor("black");
                onColorSelected?.("#000000");
                onClose?.();
              }}
            />
            <ColorButton
              ml={2}
              color="white"
              onPress={() => {
                setSelectedColor("white");
                onColorSelected?.("#FFFFFF");
                onClose?.();
              }}
            />
            <ColorButton
              ml={2}
              color="red.500"
              onPress={() => {
                setSelectedColor("red.500");
                onColorSelected?.("#FF0000");
                onClose?.();
              }}
            />
            <ColorButton
              ml={2}
              color="green.500"
              onPress={() => {
                setSelectedColor("green.500");
                onColorSelected?.("#00FF00");
                onClose?.();
              }}
            />
            <ColorButton
              ml={2}
              color="blue.500"
              onPress={() => {
                setSelectedColor("blue.500");
                onColorSelected?.("#0000FF");
                onClose?.();
              }}
            />
          </FastHStack>
        </FastVStack>
      </Actionsheet.Content>
    </Actionsheet>
  );
}

/**
 * Props for customizing elements and behavior of a ColorSelection or GradientColorSelection component.
 */
interface GradientColorSelectorProps extends IModalProps {
  initialColor?: string;
  initialKeyFrames?: EditRgbKeyframe[];
  onGradientChange?:
    | ((keyframes: EditRgbKeyframe[]) => void)
    | null
    | undefined; // action when a color was selected trough the color selection component
  triggerH?: FastButtonProps["h"]; // trigger element height
  triggerW?: FastButtonProps["w"]; // trigger element width
}

export function GradientColorSelector(props: GradientColorSelectorProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  const [selectedColor, setSelectedColor] = React.useState("red.500");
  const [_rgbKeyFrames, _setRgbKeyFrames] = React.useState(
    props.initialKeyFrames
  );
  return (
    <>
      <FastVStack>
        <Text bold textAlign="left">
          Gradient color
        </Text>
        <FastButton
          mt={2}
          onPress={onOpen}
          bg={selectedColor}
          w={props.triggerW}
          h={props.triggerH}
        >
          <Ionicons name="color-palette-outline" size={24} color="white" />
        </FastButton>
        {/* CheckBox override face component would be here */}
      </FastVStack>

      <GradientColorSelectorActionsheet
        isOpen={isOpen}
        onClose={onClose}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
      />
    </>
  );
}

function GradientColorSelectorActionsheet({
  selectedColor,
  setSelectedColor,
  onClose,
  ...props
}: {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
} & IActionsheetProps) {
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
  return (
    <Actionsheet maxHeight="95%" onClose={onClose} {...props}>
      <Actionsheet.Content maxHeight="95%" minHeight="95%">
        <ScrollView>
          <FastVStack p={2} alignItems="center" w="100%">
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
                    <Stop offset="100%" stopColor={keyColor8} stopOpacity="1" />
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
            <Box mt={2} w="100%" h={110} bg="pixelColors.highlightGray" p={2}>
              <FastHStack w="100%" h="100%">
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
              </FastHStack>
            </Box>
            <Box mt={2} p={2} width="100%" alignItems="center">
              <ColorWheel
                initialColor={selectedColor}
                onSelectColor={setSelectedColor}
                colorType={ColorWheelColorType.bright}
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
            <FastHStack mt={2}>
              <ColorButton
                color="black"
                onPress={() => {
                  setSelectedColor("black");
                  onClose?.();
                }}
              />
              <ColorButton
                ml={20}
                color="white"
                onPress={() => {
                  setSelectedColor("white");
                  onClose?.();
                }}
              />
              <ColorButton
                ml={2}
                color="red.500"
                onPress={() => {
                  setSelectedColor("red.500");
                  onClose?.();
                }}
              />
              <ColorButton
                ml={2}
                color="green.500"
                onPress={() => {
                  setSelectedColor("green.500");
                  onClose?.();
                }}
              />
              <ColorButton
                ml={2}
                color="blue.500"
                onPress={() => {
                  setSelectedColor("blue.500");
                  onClose?.();
                }}
              />
            </FastHStack>
          </FastVStack>
        </ScrollView>
      </Actionsheet.Content>
    </Actionsheet>
  );
}
