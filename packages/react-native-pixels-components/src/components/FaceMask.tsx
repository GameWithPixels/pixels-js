import { bitsToIndices, combineFlags } from "@systemic-games/pixels-core-utils";
import { getFaceMask } from "@systemic-games/pixels-edit-animation";
import {
  FastButton,
  FastHStack,
  FastVStack,
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
  View,
} from "native-base";
import React from "react";

/**
 * Props for {@link FaceMask} component.
 */
interface FaceMaskProps extends IModalProps {
  dieFaces: number; // Number of faces on the die
  maskNumber: number;
  onCloseAction?: ((value: any) => void) | null | undefined; // Function to be executed when the facemask window is closed
}

function bitsToFaceIndex(maskNumber: number) {
  return bitsToIndices(maskNumber).map((n) => (n + 1).toString());
}

/**
 * Display die faces and select which faces will be used with lighting animations.
 * @param props See {@link FaceMaskProps} for props parameters.
 */
export function FaceMask(props: FaceMaskProps) {
  const facesArray = Array.from({ length: props.dieFaces }, (_, i) => i + 1);
  const resolvedProps = usePropsResolution("FaceMask", props);
  const [showModal, setShowModal] = React.useState(false);
  const [groupValue, setGroupValue] = React.useState<string[]>(
    bitsToFaceIndex(props.maskNumber)
  );
  return (
    <>
      <FastVStack>
        <Text bold> Face mask</Text>
        <Pressable
          onPress={() => {
            setShowModal(true);
          }}
        >
          <View
            p="1"
            minH={resolvedProps.boxMinH}
            w={resolvedProps.boxW}
            rounded={resolvedProps.boxRounded}
            bg={resolvedProps.boxBg}
            alignContent="center"
          >
            <FastHStack alignSelf="center" flexWrap="wrap">
              {groupValue.length === 0 ? (
                <Text>No faces selected</Text>
              ) : (
                <Text fontSize="md">
                  {groupValue
                    .sort((n1, n2) => Number(n1) - Number(n2))
                    .join(" / ")}
                </Text>
              )}
            </FastHStack>
          </View>
        </Pressable>
      </FastVStack>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          // Combine the selected face into one maskValue
          const maskValue = combineFlags(
            groupValue.map((f) => getFaceMask(Number(f)))
          );
          if (props.onCloseAction) props.onCloseAction(maskValue);
        }}
      >
        <Modal.Content bg={resolvedProps.bg}>
          <Center>
            <Modal.Header bg={resolvedProps.bg} fontSize={20}>
              Select Faces
            </Modal.Header>
          </Center>
          <Modal.Body bg={resolvedProps.bg}>
            <Center>
              <Checkbox.Group
                defaultValue={groupValue.map((n) => n.toString())}
                onChange={(values: string[]) => {
                  setGroupValue(values || []);
                }}
              >
                <FastHStack flexWrap="wrap">
                  {facesArray.map((f) => (
                    <Checkbox
                      key={f}
                      ml={f > 1 ? 2 : 0}
                      m={resolvedProps.checkBoxMargin}
                      w={50}
                      size={resolvedProps.checkBoxSize}
                      alignSelf="center"
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
            <Modal.Footer bg={resolvedProps.bg}>
              <Button.Group space={2}>
                <FastButton
                  h={10}
                  w={60}
                  onPress={() => {
                    setShowModal(false);
                    setGroupValue(facesArray.map((n) => n.toString()));
                    // Combine the selected face into one maskValue
                    const maskValue = combineFlags(
                      facesArray.map((f) => getFaceMask(f))
                    );
                    props.onCloseAction?.(maskValue);
                  }}
                >
                  All
                </FastButton>
                <FastButton
                  h={10}
                  w={60}
                  onPress={() => {
                    setShowModal(false);
                    setGroupValue([]);
                    props.onCloseAction?.(0);
                  }}
                >
                  None
                </FastButton>
              </Button.Group>
            </Modal.Footer>
          </Center>
        </Modal.Content>
      </Modal>
    </>
  );
}
