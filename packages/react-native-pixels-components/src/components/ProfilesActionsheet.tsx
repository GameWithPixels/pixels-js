import { Feather } from "@expo/vector-icons";
import { EditProfile } from "@systemic-games/pixels-edit-animation";
import {
  Card,
  CardProps,
  FastHStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import { Actionsheet, Center, Pressable, ScrollView, Text } from "native-base";
import React from "react";

import { ProfileCard } from "./ProfileCard";

/**
 * Props for ProfilesActionsheet component.
 */
export interface ProfilesActionsheetProps extends CardProps {
  trigger?: React.ReactNode;
  drawerTitle?: string;
  profiles: Readonly<EditProfile>[]; // array of profiles information to be displayed inside the component
  dieRenderer?: (profile: Readonly<EditProfile>) => React.ReactNode;
}

/**
 * Actionsheet drawer of profiles to be opened to display a vertical scroll view of pressable and selectable profile cards.
 * @param props See {@link ProfilesActionsheetProps} for props parameters.
 */
export function ProfilesActionsheet({
  trigger,
  drawerTitle,
  profiles,
  dieRenderer,
  ...flexProps
}: ProfilesActionsheetProps) {
  const [selectedProfile, setSelectedProfile] = React.useState<number>();
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      {/* Trigger of the actionsheet drawer */}
      <Pressable onPress={onOpen}>
        {!trigger ? (
          <Card
            minW="10px"
            minH="10px"
            p={1}
            alignItems="center"
            {...flexProps}
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
          trigger
        )}
      </Pressable>

      {/* Actionsheet drawer */}
      <Actionsheet alignContent="center" isOpen={isOpen} onClose={onClose}>
        <Actionsheet.Content maxH="100%" h="630px">
          <Text bold paddingBottom={5}>
            {drawerTitle ?? "Available Profiles"}
          </Text>
          <ScrollView>
            <FastHStack flexWrap="wrap" w="100%">
              {profiles?.map((profile, i) => (
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
                  dieRenderer={
                    dieRenderer ? () => dieRenderer(profile) : undefined
                  }
                />
              ))}
            </FastHStack>
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}
