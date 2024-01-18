import { createDataSetForProfile } from "@systemic-games/pixels-edit-animation";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { View, ViewProps } from "react-native";
import { Text } from "react-native-paper";

export function ProfileUsage({
  profile,
  style,
  ...props
}: {
  profile: Readonly<Profiles.Profile>;
} & ViewProps) {
  const size = createDataSetForProfile(profile)
    .toDataSet()
    .computeDataSetByteSize();
  const patternsCount = new Set(
    profile
      .collectAnimations()
      .map((a) => a.collectPatterns())
      .flat()
  ).size;
  return (
    <View style={[{ gap: 5 }, style]} {...props}>
      <Text>Date created: {profile.creationDate.toLocaleString()}</Text>
      <Text>Last modified: {profile.lastChanged.toLocaleString()}</Text>
      {profile.lastUsed && (
        <Text>Last used: {profile.lastUsed.toLocaleString()}</Text>
      )}
      <Text>Memory footprint: {size} bytes</Text>
      <Text>Number of unique Color Designs: {patternsCount}</Text>
      {/* <Text>Number Of Sequences: 12</Text>
      <Text>Number Of Animations: 12</Text>
      <Text>Number Of Gradients: 12</Text>
      <Text>Number Of Curves: 12</Text>
      <Text>Number Of Colors: 12</Text>
      <Text>Number Of Scalars: 12</Text> */}
    </View>
  );
}
