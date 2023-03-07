import { Feather } from "@expo/vector-icons";
import { EditProfile } from "@systemic-games/pixels-edit-animation";
import {
  Card,
  FastHStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import { Actionsheet, Center, Pressable, ScrollView, Text } from "native-base";
import React from "react";

import { ProfileCard } from "./ProfileCard";

/**
 * Props for ProfilesActionSheet component.
 */
export interface ProfilesActionSheetProps {
  trigger?: React.ReactNode;
  drawerTitle?: string;
  profiles: Readonly<EditProfile>[]; // array of profiles information to be displayed inside the component
  dieRenderer: (profile: Readonly<EditProfile>) => React.ReactNode;
  w?: number;
  h?: number;
}
/**
 * Actionsheet drawer of profiles to be opened to display a vertical scroll view of pressable and selectable profile cards.
 * @param props See {@link ProfilesActionSheetProps} for props parameters.
 */
export function ProfilesActionSheet(props: ProfilesActionSheetProps) {
  const [selectedProfile, setSelectedProfile] = React.useState<number>();
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      {/* Trigger of the actionsheet drawer */}
      <Pressable onPress={onOpen}>
        {!props.trigger ? (
          <Card
            minW="10px"
            minH="10px"
            w={props.w}
            p={1}
            h={props.h}
            alignItems="center"
          >
            <Center w="90%" flexWrap="wrap">
              <Text bold fontSize="sm" alignSelf="center">
                More
              </Text>
              <Text bold fontSize="sm" alignSelf="center">
                Profiles
              </Text>
            </Center>
            <Center mt={1}>
              <Feather name="more-horizontal" size={35} color="white" />
            </Center>
          </Card>
        ) : (
          props.trigger
        )}
      </Pressable>

      {/* Actionsheet drawer */}
      <Actionsheet isOpen={isOpen} onClose={onClose} alignContent="center">
        <Actionsheet.Content maxH="100%" h="630px">
          <Text bold paddingBottom={5}>
            {props.drawerTitle ? props.drawerTitle : "Available Profiles"}
          </Text>
          <ScrollView>
            <FastHStack flexWrap="wrap" w="100%">
              {props.profiles?.map((profile, i) => (
                <ProfileCard
                  key={i}
                  p={1}
                  w="105px"
                  h="130px"
                  imageSize={70}
                  selectable
                  profileIndexInList={i}
                  selectedProfileIndex={selectedProfile}
                  onSelected={setSelectedProfile}
                  name={profile.name}
                  dieRenderer={() => props.dieRenderer(profile)}
                />
              ))}
            </FastHStack>
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}
