import {
  FastBoxProps,
  FastButton,
  FastHStack,
  FastVStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import {
  Text,
  Center,
  Pressable,
  Modal,
  Checkbox,
  usePropsResolution,
  IModalProps,
  Button,
  ICheckboxProps,
  ITextProps,
} from "native-base";
import React from "react";

/**
 * Props for {@link FaceMaskWidget} component.
 */
interface FaceMaskWidgetProps extends FastBoxProps {
  faces: number[];
  onFaceMaskChange: (faces: number[]) => void; // Function to be executed when the face selection is changed
  faceCount: number; // Number of faces on the die
  _text?: ITextProps;
  modalBg?: IModalProps["bg"];
  _checkBox?: ICheckboxProps;
}

/**
 * Display die faces and select which faces will be used with lighting animations.
 * @param props See {@link FaceMaskWidgetProps} for props parameters.
 */
export function FaceMaskWidget({
  faces,
  onFaceMaskChange,
  faceCount,
  ...props
}: FaceMaskWidgetProps) {
  const { modalBg, _text, _checkBox, ...resolvedProps } = usePropsResolution(
    "FaceMask",
    props
  );
  const faceList = React.useMemo(
    () => faces.sort((n1, n2) => n1 - n2).join(" / "),
    [faces]
  );
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <FastVStack {...resolvedProps}>
        <Text bold> Face mask</Text>
        <Pressable
          p="1"
          rounded="lg"
          bg="primary.700"
          alignContent="center"
          onPress={onOpen}
        >
          <Text {..._text}>
            {faces.length ? faceList : "No faces selected"}
          </Text>
        </Pressable>
      </FastVStack>

      <SelectFacesModal
        bg={modalBg}
        _checkBox={_checkBox}
        isOpen={isOpen}
        onClose={onClose}
        faces={faces}
        onFaceMaskChange={onFaceMaskChange}
        faceCount={faceCount}
      />
    </>
  );
}

function SelectFacesModal({
  bg,
  onClose,
  faces,
  onFaceMaskChange,
  faceCount,
  _checkBox,
  ...props
}: Pick<
  FaceMaskWidgetProps,
  "faces" | "onFaceMaskChange" | "faceCount" | "_checkBox"
> &
  IModalProps) {
  const allFaces = React.useMemo(
    () => Array.from({ length: faceCount }, (_, i) => i + 1),
    [faceCount]
  );
  const onChangeMemo = React.useCallback(
    (values: string[]) => onFaceMaskChange(values.map(Number) ?? []),
    [onFaceMaskChange]
  );
  return (
    <Modal onClose={onClose} {...props}>
      <Modal.Content bg={bg}>
        <Center>
          <Modal.Header bg={bg} fontSize={20}>
            Select Faces
          </Modal.Header>
        </Center>
        <Modal.Body bg={bg}>
          <Center>
            <Checkbox.Group value={faces.map(String)} onChange={onChangeMemo}>
              <FastHStack flexWrap="wrap">
                {allFaces.map((f) => (
                  <Checkbox
                    key={f}
                    ml={f > 1 ? 2 : 0}
                    w={50}
                    alignSelf="center"
                    {..._checkBox}
                    value={f.toString()}
                  >
                    {f}
                  </Checkbox>
                ))}
              </FastHStack>
            </Checkbox.Group>
          </Center>
        </Modal.Body>
        <Center>
          <Modal.Footer bg={bg}>
            <Button.Group space={2}>
              <FastButton
                h={10}
                w={60}
                onPress={() => {
                  onFaceMaskChange(allFaces);
                  onClose();
                }}
              >
                All
              </FastButton>
              <FastButton
                h={10}
                w={60}
                onPress={() => {
                  onFaceMaskChange([]);
                  onClose();
                }}
              >
                None
              </FastButton>
            </Button.Group>
          </Modal.Footer>
        </Center>
      </Modal.Content>
    </Modal>
  );
}
