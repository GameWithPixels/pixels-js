import {
  FastButton,
  FastHStack,
  FastVStack,
  Toggle,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import { Actionsheet, IActionsheetProps, ScrollView, Text } from "native-base";
import React from "react";

export interface FaceIndexProps {
  faceCount: number;
  initialFace?: number;
  disabled?: boolean;
  onSelect?: (faceIndex: number) => void;
}

export function FaceSelector({
  faceCount,
  initialFace,
  disabled,
  onSelect,
}: FaceIndexProps) {
  const [face, setFace] = React.useState(initialFace ?? 0);
  const faces = React.useMemo(
    () => Array.from({ length: faceCount }, (_, i) => i + 1),
    [faceCount]
  );
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <FastButton
        onPress={onOpen}
        disabled={disabled}
        bg={disabled ? "gray.600" : undefined}
        _text={{ color: disabled ? "gray.400" : undefined }}
      >
        {face}
      </FastButton>

      <FacesActionsheet
        isOpen={isOpen}
        onClose={onClose}
        faces={faces}
        onSelect={(face) => {
          setFace(face);
          onSelect?.(face);
          onClose();
        }}
      />
    </>
  );
}

interface FacesActionsheetProps extends IActionsheetProps {
  faces: number[];
  onSelect?: (face: number) => void;
}

function FacesActionsheet({
  faces,
  onSelect,
  ...props
}: FacesActionsheetProps) {
  return (
    <Actionsheet {...props}>
      <Actionsheet.Content maxHeight={400} minHeight={200}>
        <ScrollView h="100%" w="100%">
          {faces.map((face) => (
            <Actionsheet.Item
              onPress={() => onSelect?.(face)}
              alignItems="center"
              key={face}
            >
              <Text fontSize="2xl">{face}</Text>
            </Actionsheet.Item>
          ))}
        </ScrollView>
      </Actionsheet.Content>
    </Actionsheet>
  );
}

export interface PlayBackFaceProps {
  title?: string;
  initialFaceIndex: number;
  faceCount: number;
  onValueChange?: (value: number) => void;
}

export function PlayBackFace(props: PlayBackFaceProps) {
  const initiallyDisabled = props.initialFaceIndex < 0;
  const [disableFaceIndex, setDisableFaceIndex] =
    React.useState(initiallyDisabled);
  const faceIndexRef = React.useRef(
    initiallyDisabled ? 0 : props.initialFaceIndex
  );

  return (
    <FastVStack w="100%">
      <Text bold>{props.title}</Text>
      <FastHStack alignItems="center">
        <Toggle
          defaultIsChecked={initiallyDisabled}
          // value={!disableFaceIndex}
          title="Select face"
          onValueChange={() => {
            setDisableFaceIndex((wasDisabled) => {
              props.onValueChange?.(wasDisabled ? faceIndexRef.current : -1);
              return !wasDisabled;
            });
          }}
        />
        <FaceSelector
          initialFace={initiallyDisabled ? 0 : props.initialFaceIndex}
          faceCount={props.faceCount}
          disabled={disableFaceIndex}
          onSelect={(index) => {
            faceIndexRef.current = index;
            props.onValueChange?.(index);
          }}
        />
      </FastHStack>
    </FastVStack>
  );
}
