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

import { PatternCard, PatternInfo } from "./PatternCards";

//Temporary default image require path
const defaultImageRequirePath = require("~/../assets/RainbowDice.png");

/**
 * Props for PatternsActionSheet component.
 */
export interface PatternsActionsheetProps {
  trigger?: React.ReactNode;
  drawerTitle?: string;
  Patterns: EditPattern[];
  PatternInfo?: PatternInfo[]; // array of patterns informations to be displayed inside the component
  w?: number;
  h?: number;
  onSelectPattern?: ((editPattern: EditPattern) => void) | null | undefined;
  initialPattern?: EditPattern;
}
/**
 * Actionsheet drawer of profiles to be opened to display a vertical scroll view of pressable and selectable profile cards.
 * @param props See {@link PatternsActionsheetProps} for props parameters.
 */
export function PatternActionSheet(props: PatternsActionsheetProps) {
  const [patternToHighlight, setPatternToHighlight] = React.useState<number>();

  const [patternName, setPatternName] = React.useState<string>();
  const [patternList, setPatternList] = React.useState<EditPattern[]>([]);
  const { isOpen, onOpen, onClose } = useDisclose();

  const [patternsInfo, setPatternsInfo] = React.useState<PatternInfo[]>([]);

  const [_selectedPattern, setSelectedPattern] = React.useState<EditPattern>(
    new EditPattern()
  );

  useEffect(() => {
    setPatternList(props.Patterns);
    const initialPattern = props.initialPattern
      ? props.initialPattern
      : new EditPattern();
    setSelectedPattern(initialPattern);
    setPatternName(initialPattern.name);
  }, [props.Patterns, props.initialPattern]);

  useEffect(() => {
    const infos: PatternInfo[] = [];
    patternList.map((pattern) =>
      infos.push({
        editPattern: pattern,
        imageRequirePath: defaultImageRequirePath,
      })
    );
    setPatternsInfo(infos);
  }, [patternList]);

  function onPatternSelected(patternInfo: PatternInfo) {
    const patternName = patternInfo.editPattern.name;
    setPatternName(patternName);
  }

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
                {patternName ? patternName : "No led pattern selected"}
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
            {props.drawerTitle ? props.drawerTitle : "Available Patterns"}
          </Text>
          <ScrollView>
            <HStack flexWrap="wrap" w="100%">
              {patternsInfo?.map((patternInfo, i) => (
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
                      onPatternSelected(patternInfo);
                      setSelectedPattern(patternInfo.editPattern);
                      props.onSelectPattern?.(patternInfo.editPattern);
                      onClose();
                    }}
                    patternInfo={patternInfo}
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
  // AnimationInfo?: PatternInfo[]; // array of profiles informations to be displayed inside the component
  w?: number;
  h?: number;
  onSelectAnimation?:
    | ((editAnimation: EditAnimation) => void)
    | null
    | undefined;
  initialAnimation: EditAnimation;
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

    setAnimationName(initialAnim.name);
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
            {props.drawerTitle ? props.drawerTitle : "Available Patterns"}
          </Text>
          <ScrollView>
            <HStack flexWrap="wrap" w="100%">
              {animationsList?.map((animation, i) => (
                <Box key={i} p={1}>
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
                    name={animation.name}
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
