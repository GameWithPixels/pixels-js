import { IColor } from "@systemic-games/pixels-core-animation";
import {
  findColorWheelSlice,
  generateColorWheel,
  Point,
} from "@systemic-games/react-native-base-components";
import {
  Text,
  HStack,
  Center,
  VStack,
  Modal,
  Button,
  AddIcon,
  usePropsResolution,
  IModalProps,
} from "native-base";
import {
  ColorType,
  SizeType,
} from "native-base/lib/typescript/components/types";
import React, { useState } from "react";
// eslint-disable-next-line import/namespace
import { GestureResponderEvent } from "react-native";
import Svg, { Polygon } from "react-native-svg";

/**
 * Transform coordinate points into a single string for svg path.
 * @param points Array of points representing a 2D shape
 */
function toStringPath(points?: Point[]) {
  return points?.map(({ x, y }) => `${x},${y}`).join(" ");
}
export function toStringColor(color: IColor): string {
  function toHex(v: number) {
    const byte = Math.max(0, Math.min(255, Math.round(255 * v)));
    return ("0" + byte.toString(16)).slice(-2);
  }
  return "#" + toHex(color.r) + toHex(color.g) + toHex(color.b);
}

/**
 * Props for customizing the colorWheel and its behavior
 */
interface ColorWheelProps {
  onSelectColor: React.Dispatch<React.SetStateAction<string>>; // action to initiate after selecting a color on the wheel
}
/**
 * Generate the color wheel by drawing the colors polygons and the selector
 */
function ColorWheel(props: ColorWheelProps) {
  const [selectedColor, setSelectedColor] = React.useState<IColor>();
  const wheelParams = {
    x: 50,
    y: 50,
    radius: 49,
    startRadius: 10,
    sliceCount: 16,
    layerCount: 3,
    segmentCount: 16,
    brightness: 1,
    dimBrightness: 0.35,
  };

  /**
   * Create each polygon representing the colors on the wheel based on the generated shapes
   */
  const polygons = () => {
    const shapes = generateColorWheel(wheelParams);
    return (
      <>
        {shapes.map((s) => (
          <Polygon
            points={toStringPath(s.points)}
            fill={toStringColor(s.color)}
            onPress={() => {
              setSelectedColor(s.color);
              console.log(toStringColor(s.color));
              props.onSelectColor(toStringColor(s.color));
            }}
          />
        ))}
      </>
    );
  };

  /**
   * Create the selector polygon highlighting the selected color
   */
  const selector = () => {
    return (
      selectedColor && (
        <Polygon
          points={toStringPath(findColorWheelSlice(selectedColor, wheelParams))}
          fill="none"
          stroke="black"
          strokeWidth="1"
        />
      )
    );
  };
  const [wheel] = useState(() => polygons());
  return (
    <Center>
      <Svg height={300} width={300} viewBox="0 0 100 100">
        {wheel}
        {selector()}
      </Svg>
    </Center>
  );
}

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
 * Props for customizing elements and behavior of a ColorSelection component.
 */
interface ColorSelectionProps extends IModalProps {
  modalBg?: ColorType; // modal general background color
  triggerBg?: ColorType; // modal trigger element initial background color
  triggerH?: SizeType; // trigger element height
  triggerW?: SizeType; // trigger element width
  OnColorSelected?: () => void | null | undefined; // action when a color was selected trough the color selection component
}
/**
 * Color selection component used for selecting a single color shade from a color wheel / color picker.
 * @see ColorSelectionProps for the component props to customize some elements.
 * @return A ColorSelection JSX element.
 */
export function ColorSelection(props: ColorSelectionProps) {
  const resolvedProps = usePropsResolution("ColorSelection", props);
  const [showModal, setShowModal] = React.useState(false);
  const [SelectedColor, setSelectedColor] = React.useState("red.500");
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
            <HStack space={2} alignItems="center">
              <AddIcon size="md" color="black" />
            </HStack>
          </Button>
        </HStack>
        {/* CheckBox override face component would be here */}
      </VStack>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <Modal.Content
          minH={resolvedProps.modalMinH}
          minW={resolvedProps.modalMinW}
          h={resolvedProps.h}
          w={resolvedProps.w}
          bg={resolvedProps.bg}
        >
          <Center>
            <Modal.Header
              bg={resolvedProps.bg}
              fontSize={resolvedProps.headerFontSize}
            >
              Select Color
            </Modal.Header>
            <Modal.CloseButton />
          </Center>
          <Modal.Body bg={resolvedProps.bg}>
            <VStack space={2}>
              <ColorWheel onSelectColor={setSelectedColor} />
            </VStack>
          </Modal.Body>
          <Center>
            <Modal.Footer bg={resolvedProps.bg}>
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
            </Modal.Footer>
          </Center>
        </Modal.Content>
      </Modal>
    </>
  );
}
