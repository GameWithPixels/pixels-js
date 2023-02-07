import {
  EditAnimation,
  EditPattern,
} from "@systemic-games/pixels-edit-animation";
import {
  Actionsheet,
  Box,
  HStack,
  Pressable,
  ScrollView,
  Text,
  useDisclose,
} from "native-base";
import React, { useEffect } from "react";

import { PatternCard } from "./PatternCards";

/**
 * Props for PatternsActionSheet component.
 */
export interface PatternsActionsheetProps {
  trigger?: React.ReactNode;
  drawerTitle?: string;
  patterns: EditPattern[];
  dieRenderer?: (pattern: EditPattern) => React.ReactNode;
  onSelectPattern?: ((editPattern: EditPattern) => void) | null | undefined;
  initialPattern?: EditPattern;
}

/**
 * Actionsheet drawer of patterns to be opened to display a vertical scroll view of pressables and selectables pattern cards.
 * @param props See {@link PatternsActionsheetProps} for props parameters.
 */
export function PatternActionSheet({
  trigger,
  drawerTitle,
  patterns,
  dieRenderer,
  onSelectPattern,
  initialPattern,
}: PatternsActionsheetProps) {
  const [patternToHighlight, setPatternToHighlight] = React.useState<number>();
  const { isOpen, onOpen, onClose } = useDisclose();
  const [selectedPattern, setSelectedPattern] = React.useState<EditPattern>(
    initialPattern ? initialPattern : new EditPattern()
  );

  return (
    <>
      {/* Trigger of the actionsheet drawer */}
      <Pressable
        onPress={() => {
          onOpen();
        }}
      >
        {!trigger ? (
          <Box w="100%" p={2} bg="primary.700" rounded="lg">
            <HStack space={2} alignItems="center">
              <Text>{selectedPattern?.name ?? "No led pattern selected"}</Text>
            </HStack>
          </Box>
        ) : (
          trigger
        )}
      </Pressable>

      {/* Actionsheet drawer */}
      <Actionsheet isOpen={isOpen} onClose={onClose} alignContent="center">
        <Actionsheet.Content maxH="100%" h={600}>
          <Text bold paddingBottom={5}>
            {drawerTitle ? drawerTitle : "Available Patterns"}
          </Text>
          <ScrollView>
            <HStack flexWrap="wrap" w="100%">
              {patterns?.map((pattern, i) => (
                <Box key={i} p={1}>
                  <PatternCard
                    w="105px"
                    h="130px"
                    verticalSpace={1}
                    imageSize={70}
                    selectable
                    patternIndexInList={i}
                    selectedPatternIndex={patternToHighlight}
                    onSelected={() => {
                      setPatternToHighlight(i);
                      setSelectedPattern(pattern);
                      onSelectPattern?.(pattern);
                      onClose();
                    }}
                    patternName={pattern.name}
                    dieRenderer={
                      dieRenderer ? () => dieRenderer(pattern) : undefined
                    }
                  />
                </Box>
              ))}
            </HStack>
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}

/**
 * Props for ProfilesActionSheet component.
 */
export interface AnimationActionsheetProps {
  trigger?: React.ReactNode;
  drawerTitle?: string;
  animations: EditAnimation[];
  dieRenderer?: (anim: EditAnimation) => React.ReactNode;
  onSelectAnimation?: (editAnimation: EditAnimation) => void;
  initialAnimation?: EditAnimation;
}
/**
 * Actionsheet drawer of profiles to be opened to display a vertical scroll view of pressable and selectable profile cards.
 * @param props See {@link PatternsActionsheetProps} for props parameters.
 */
export function AnimationsActionSheet({
  trigger,
  drawerTitle,
  animations,
  dieRenderer,
  onSelectAnimation,
  initialAnimation,
}: AnimationActionsheetProps) {
  const [animationName, setAnimationName] = React.useState<string>();
  const [animationsList, setAnimationsList] = React.useState<EditAnimation[]>(
    []
  );
  const { isOpen, onOpen, onClose } = useDisclose();

  // const [patternsInfo, setPatternsInfo] = React.useState<PatternInfo[]>([]);

  const [_selectedAnimation, setSelectedAnimation] =
    React.useState<EditAnimation>();

  useEffect(() => {
    setAnimationsList(animations);
    const initialAnim = initialAnimation;

    setAnimationName(initialAnim ? initialAnim.name : "undefined");
  }, [animations, initialAnimation]);

  return (
    <>
      {/* Trigger of the actionsheet drawer */}
      <Pressable
        onPress={() => {
          onOpen();
        }}
      >
        {!trigger ? (
          <Box w="100%" p={2} bg="primary.700" rounded="lg">
            <HStack space={2} alignItems="center">
              <Text>
                {animationName ? animationName : "No led pattern selected"}
              </Text>
            </HStack>
          </Box>
        ) : (
          trigger
        )}
      </Pressable>

      {/* Actionsheet drawer */}
      <Actionsheet isOpen={isOpen} onClose={onClose} alignContent="center">
        <Actionsheet.Content maxH="100%" h={600}>
          <Text bold paddingBottom={5}>
            {drawerTitle ? drawerTitle : "Available Animations"}
          </Text>
          <ScrollView>
            <HStack flexWrap="wrap" w="100%">
              {animationsList?.map((animation, i) => (
                <Box key={i} p={1}>
                  {/* Pattern card use as an animation card */}

                  <PatternCard
                    w="105px"
                    h="130px"
                    verticalSpace={1}
                    imageSize={70}
                    selectable
                    patternIndexInList={i}
                    onSelected={() => {
                      setAnimationName(animation.name);
                      setSelectedAnimation(animation);
                      onSelectAnimation?.(animation);
                      onClose();
                    }}
                    patternName={animation.name}
                    dieRenderer={
                      dieRenderer ? () => dieRenderer(animation) : undefined
                    }
                  />
                </Box>
              ))}
            </HStack>
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}
