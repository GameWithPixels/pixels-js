import { EditPattern } from "@systemic-games/pixels-edit-animation";
import { EditAnimation } from "@systemic-games/pixels-edit-animation/dist/types";
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
// eslint-disable-next-line import/namespace
import { ImageSourcePropType } from "react-native";

import { PatternCard } from "./PatternCards";

/**
 * Props for PatternsActionSheet component.
 */
export interface PatternsActionsheetProps {
  trigger?: React.ReactNode;
  drawerTitle?: string;
  patterns: EditPattern[];
  dieRenderer: (pattern: EditPattern) => React.ReactNode;
  w?: number;
  h?: number;
  onSelectPattern?: ((editPattern: EditPattern) => void) | null | undefined;
  initialPattern?: EditPattern;
}
/**
 * Actionsheet drawer of patterns to be opened to display a vertical scroll view of pressables and selectables pattern cards.
 * @param props See {@link PatternsActionsheetProps} for props parameters.
 */
export function PatternActionSheet(props: PatternsActionsheetProps) {
  const [patternToHighlight, setPatternToHighlight] = React.useState<number>();
  const { isOpen, onOpen, onClose } = useDisclose();
  const [selectedPattern, setSelectedPattern] = React.useState<EditPattern>(
    props.initialPattern ? props.initialPattern : new EditPattern()
  );

  return (
    <>
      {/* Trigger of the actionsheet drawer */}
      <Pressable
        onPress={() => {
          onOpen();
        }}
      >
        {!props.trigger ? (
          <Box w="100%" p={2} bg="primary.700" rounded="lg">
            <HStack space={2} alignItems="center">
              <Text>{selectedPattern?.name ?? "No led pattern selected"}</Text>
            </HStack>
          </Box>
        ) : (
          props.trigger
        )}
      </Pressable>

      {/* Actionsheet drawer */}
      <Actionsheet isOpen={isOpen} onClose={onClose} alignContent="center">
        <Actionsheet.Content maxH="100%" h={600}>
          <Text bold paddingBottom={5}>
            {props.drawerTitle ? props.drawerTitle : "Available Patterns"}
          </Text>
          <ScrollView>
            <HStack flexWrap="wrap" w="100%">
              {props.patterns?.map((pattern, i) => (
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
                      props.onSelectPattern?.(pattern);
                      onClose();
                    }}
                    patternName={pattern.name}
                    dieRenderer={() => props.dieRenderer(pattern)}
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
  dieRenderer: (anim: EditAnimation) => React.ReactNode;
  w?: number;
  h?: number;
  onSelectAnimation?: (editAnimation: EditAnimation) => void;
  initialAnimation?: EditAnimation;
  imageRequirePath?: ImageSourcePropType;
}
/**
 * Actionsheet drawer of profiles to be opened to display a vertical scroll view of pressable and selectable profile cards.
 * @param props See {@link PatternsActionsheetProps} for props parameters.
 */
export function AnimationsActionSheet(props: AnimationActionsheetProps) {
  // const [patternToHighlight, setPatternToHighlight] = React.useState<number>();

  const [animationName, setAnimationName] = React.useState<string>();
  const [animationsList, setAnimationsList] = React.useState<EditAnimation[]>(
    []
  );
  const { isOpen, onOpen, onClose } = useDisclose();

  // const [patternsInfo, setPatternsInfo] = React.useState<PatternInfo[]>([]);

  const [_selectedAnimation, setSelectedAnimation] =
    React.useState<EditAnimation>();

  useEffect(() => {
    setAnimationsList(props.animations);
    const initialAnim = props.initialAnimation;

    setAnimationName(initialAnim ? initialAnim.name : "undefined");
  }, [props.animations, props.initialAnimation]);

  // useEffect(() => {
  //   const infos: PatternInfo[] = [];
  //   animationsList.map((pattern) =>
  //     infos.push({
  //       editPattern: pattern,
  //       imageRequirePath: defaultImageRequirePath,
  //     })
  //   );
  //   setPatternsInfo(infos);
  // }, [animationsList]);

  return (
    <>
      {/* Trigger of the actionsheet drawer */}
      <Pressable
        onPress={() => {
          onOpen();
        }}
      >
        {!props.trigger ? (
          <Box w="100%" p={2} bg="primary.700" rounded="lg">
            <HStack space={2} alignItems="center">
              <Text>
                {animationName ? animationName : "No led pattern selected"}
              </Text>
            </HStack>
          </Box>
        ) : (
          props.trigger
        )}
      </Pressable>

      {/* Actionsheet drawer */}
      <Actionsheet isOpen={isOpen} onClose={onClose} alignContent="center">
        <Actionsheet.Content maxH="100%" h={600}>
          <Text bold paddingBottom={5}>
            {props.drawerTitle ? props.drawerTitle : "Available Animations"}
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
                      props.onSelectAnimation?.(animation);
                      onClose();
                    }}
                    patternName={animation.name}
                    dieRenderer={() => props.dieRenderer(animation)}
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
