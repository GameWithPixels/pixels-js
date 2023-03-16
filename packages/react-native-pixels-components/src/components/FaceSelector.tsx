import {
  FastBoxProps,
  FastButton,
  FastVStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import { Actionsheet, IActionsheetProps, ScrollView, Text } from "native-base";
import React from "react";

export interface FaceSelectorProps extends FastBoxProps {
  title?: string;
  value: number;
  onFaceChange: (faceIndex: number) => void;
  faceCount: number;
  disabled?: boolean;
}

export function FaceSelector({
  title,
  value,
  onFaceChange: onChange,
  faceCount,
  disabled,
  ...flexProps
}: FaceSelectorProps) {
  const textStyle = React.useMemo(
    () => ({ color: disabled ? "gray.400" : null }),
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
      <FastVStack {...flexProps}>
        {title && <Text bold>{title}</Text>}
        <FastButton
          onPress={onOpen}
          disabled={disabled}
          bg={disabled ? "gray.600" : null}
          _text={textStyle}
        >
          {/* When no value render a space character so button doesn't change size */}
          {value > 0 ? value : " "}
        </FastButton>
      </FastVStack>

      <FacesActionsheet
        isOpen={isOpen}
        onClose={onClose}
        faceCount={faceCount}
        onSelect={onSelect}
      />
    </>
  );
}

function FacesActionsheet({
  onSelect,
  faceCount,
  ...actionsheetProps
}: { onSelect: (face: number) => void } & Pick<FaceSelectorProps, "faceCount"> &
  IActionsheetProps) {
  const allFaces = React.useMemo(
    () => Array.from({ length: faceCount }, (_, i) => i + 1),
    [faceCount]
  );
  return (
    <Actionsheet {...actionsheetProps}>
      <Actionsheet.Content maxHeight={400} minHeight={200}>
        <ScrollView h="100%" w="100%">
          {allFaces.map((face) => (
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
