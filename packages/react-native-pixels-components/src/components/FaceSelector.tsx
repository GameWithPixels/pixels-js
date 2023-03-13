import {
  FastButton,
  FastVStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import { Actionsheet, IActionsheetProps, ScrollView, Text } from "native-base";
import React from "react";

export interface FaceSelectorProps {
  title?: string;
  faceCount: number;
  value: number;
  onChange?: (faceIndex: number) => void;
  disabled?: boolean;
}

export function FaceSelector({
  title,
  faceCount,
  value,
  onChange,
  disabled,
}: FaceSelectorProps) {
  const faces = React.useMemo(
    () => Array.from({ length: faceCount }, (_, i) => i + 1),
    [faceCount]
  );
  const textStyle = React.useMemo(
    () => ({ color: disabled ? "gray.400" : undefined }),
    [disabled]
  );
  const { isOpen, onOpen, onClose } = useDisclose();
  const onSelect = React.useCallback(
    (face: number) => {
      onChange?.(face);
      onClose();
    },
    [onChange, onClose]
  );
  return (
    <>
      <FastVStack w="100%">
        {title && <Text bold>{title}</Text>}
        <FastButton
          onPress={onOpen}
          disabled={disabled}
          bg={disabled ? "gray.600" : undefined}
          _text={textStyle}
        >
          {value}
        </FastButton>
      </FastVStack>

      <FacesActionsheet
        isOpen={isOpen}
        onClose={onClose}
        faces={faces}
        onSelect={onSelect}
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
  ...actionsheetProps
}: FacesActionsheetProps) {
  return (
    <Actionsheet {...actionsheetProps}>
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
