import { Toggle } from "@systemic-games/react-native-base-components";
import {
  Actionsheet,
  Button,
  ScrollView,
  useDisclose,
  Text,
  HStack,
  VStack,
  Box,
} from "native-base";
import React from "react";

export interface FaceIndexProps {
  faceCount: number;
  initialFace?: number;
  disabled?: boolean;
  onSelect?: (faceIndex: number) => void;
}

export function FaceSelector(props: FaceIndexProps) {
  const [face, setFace] = React.useState(props.initialFace ?? 0);
  const faces = React.useMemo(
    () => Array.from({ length: props.faceCount }, (_, i) => i + 1),
    [props.faceCount]
  );
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <VStack>
        <Button
          onPress={onOpen}
          disabled={props.disabled}
          bg={props.disabled ? "gray.900" : undefined}
        >
          <Text color={props.disabled ? "gray.800" : undefined}>{face}</Text>
        </Button>
      </VStack>
      <Actionsheet isOpen={isOpen} onClose={onClose}>
        <Actionsheet.Content maxHeight={400} minHeight={200}>
          <ScrollView h="100%" w="100%">
            {faces.map((face) => (
              <Actionsheet.Item
                onPress={() => {
                  setFace(face);
                  props.onSelect?.(face);
                  onClose();
                }}
                alignItems="center"
                key={face}
              >
                <Text fontSize="2xl">{face}</Text>
              </Actionsheet.Item>
            ))}
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}

// export function FaceIndex2(props: FaceIndexProps) {
//   const [faceIndex, _setFaceIndex] = React.useState(props.faces);
//   const facesArray = Array(props.faces).fill(0);
//   const { isOpen, onOpen, onClose } = useDisclose();

//   const flatListRef = useRef<ReactFlatList>(null);
//   function _scrollToIndex(index: any) {
//     flatListRef?.current?.scrollToIndex({ index });
//   }

//   return (
//     <>
//       <VStack>
//         {props.showTitle ?? <Text>Than</Text>}
//         <Button
//           onPress={onOpen}
//           disabled={props.disabled}
//           bg={props.disabled ? "gray.900" : undefined}
//         >
//           <Text color={props.disabled ? "gray.800" : undefined}>
//             {faceIndex}
//           </Text>
//         </Button>
//       </VStack>

//       <Modal isOpen={isOpen} onClose={onClose} w="100%">
//         <Modal.Content h="30%" maxH="30%" width="90%">
//           <HStack w="100%" alignItems="center">
//             {/* <Box flex={1}>
//                 <ChevronLeftIcon />
//               </Box> */}
//             <Center flex={1} width="100%">
//               {/* <ScrollView>
//                   {facesArray.map((_e, i) => (
//                     <Actionsheet.Item
//                       onPress={() => {
//                         setFaceIndex(i + 1);
//                         onClose();
//                       }}
//                       alignItems="center"
//                       key={i}
//                     >
//                       <Text fontSize="2xl">{i + 1}</Text>
//                     </Actionsheet.Item>
//                   ))}
//                 </ScrollView> */}
//               <FlatList
//                 ref={flatListRef}
//                 snapToAlignment="start"
//                 decelerationRate="fast"
//                 snapToInterval={70}
//                 width="100%"
//                 data={facesArray}
//                 renderItem={({ index }) => (
//                   <Center>
//                     <Actionsheet.Item
//                       h={70}
//                       alignSelf="center"
//                       alignItems="center"
//                     >
//                       <Text fontSize="2xl">{index + 1}</Text>
//                     </Actionsheet.Item>
//                   </Center>
//                 )}
//                 initialScrollIndex={0}
//               />
//             </Center>
//             {/* <Box flex={1}>
//                 <ChevronRightIcon />
//               </Box> */}
//           </HStack>
//         </Modal.Content>
//       </Modal>
//     </>
//   );
// }

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
    <VStack w="100%">
      <Text bold>{props.title}</Text>
      <HStack alignItems="center">
        <Box flex={1}>
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
        </Box>
        <Box flex={1}>
          <FaceSelector
            initialFace={initiallyDisabled ? 0 : props.initialFaceIndex}
            faceCount={props.faceCount}
            disabled={disableFaceIndex}
            onSelect={(index) => {
              faceIndexRef.current = index;
              props.onValueChange?.(index);
            }}
          />
        </Box>
      </HStack>
    </VStack>
  );
}
