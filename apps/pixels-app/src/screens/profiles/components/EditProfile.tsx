import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import React from "react";
import { Pressable, View, ViewProps } from "react-native";
import { Text, TextInput, useTheme } from "react-native-paper";
import Animated, {
  CurvedTransition,
  FadeIn,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import AnimationsIcon from "#/icons/navigation/animations";
import CaretRightIcon from "#/icons/profiles/caret-right";
import SpeakIcon from "#/icons/profiles/speak";
import { TouchableCardProps, TouchableCard } from "@/components/TouchableCard";
import { Banner } from "@/components/banners";
import {
  GradientButton,
  OutlineButton,
  TightTextButton,
} from "@/components/buttons";
import { getConditionTypeLabel } from "@/descriptions";
import { useConfirmActionSheet, useProfile, useProfiles } from "@/hooks";
import { ProfilesStackParamList } from "@/navigation";
import { DieRenderer } from "@/render3d/DieRenderer";
import { ConditionType } from "@/temp";
import { Colors } from "@/themes";

function SectionTitle({ children }: React.PropsWithChildren) {
  return <Text variant="titleMedium">{children}</Text>;
}

function RuleMenuButton({
  children,
  style,
  condition,
  option,
  ...props
}: {
  condition?: ConditionType;
  option?: string;
} & TouchableCardProps) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  const ruleIconStyle = {
    width: 20,
    alignItems: "center",
  } as const;
  const ruleTextStyle = {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  } as const;
  const rulesGroupStyle = {
    ...ruleTextStyle,
    width: "100%",
    paddingLeft: condition === "rolled" ? 10 : 0,
    gap: 5,
  } as const;
  const facesStyle = { paddingTop: 5 };
  const [expandedToggle, setExpandedToggle] = React.useState(false);
  const expanded = useSharedValue(0);
  const animChevronStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          rotate: expanded
            ? withTiming(expanded.value ? "180deg" : "0deg")
            : "0deg",
        },
      ],
    }),
    [expanded]
  );
  return (
    <>
      <Animated.View layout={CurvedTransition.duration(300)}>
        <TouchableCard
          noBorder
          frameless
          contentStyle={[
            {
              flexDirection: "row",
              paddingHorizontal: 10,
              paddingVertical: 12,
              gap: 5,
            },
            style,
          ]}
          {...props}
        >
          <>
            <Text
              style={{ flexGrow: 1, textAlign: "center" }}
              variant="bodyLarge"
            >
              {children}
            </Text>
            <CaretRightIcon size={16} color={colors.onSurface} />
          </>
        </TouchableCard>
      </Animated.View>
      <Animated.View
        style={{
          marginTop: -20,
          marginBottom: 10,
          paddingTop: 20,
          paddingLeft: 20,
          paddingVertical: 10,
          borderWidth: 1,
          borderTopWidth: 0,
          borderRadius,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderColor: colors.outline,
        }}
        layout={CurvedTransition.duration(300)}
      >
        <Pressable
          onPress={() => {
            setExpandedToggle((b) => !b);
            expanded.value = 1 - expanded.value;
          }}
        >
          {condition === "rolled" && (
            <Text
              style={[facesStyle, { paddingTop: 0, paddingBottom: 5 }]}
              variant="bodyMedium"
            >
              On face 20
            </Text>
          )}
          <View style={rulesGroupStyle}>
            {condition === "bluetoothEvent" ||
            condition === "helloGoodbye" ||
            condition === "handling" ||
            condition === "rolling" ||
            condition === "rolled" ? (
              <>
                <View style={ruleIconStyle}>
                  <AnimationsIcon size={16} color={Colors.grey500} />
                </View>
                <View style={ruleTextStyle}>
                  <Text style={{ color: Colors.grey500 }}>
                    {condition === "handling"
                      ? `Play "Picked Up Solid" with color`
                      : condition === "rolling"
                      ? `Play "Rolling Sparkles" twice for 3s`
                      : condition === "rolled"
                      ? `Play "Rainbow"`
                      : condition === "helloGoodbye"
                      ? `Play "Three Blue Blinks"`
                      : option === "Connect"
                      ? `Play "Blue Blink" 3 times for 1s`
                      : `Play "Quick Disconnect"`}
                  </Text>
                  {condition === "handling" && (
                    <View
                      style={{
                        width: 16,
                        aspectRatio: 1,
                        borderRadius: 5,
                        backgroundColor: "orange",
                      }}
                    />
                  )}
                </View>
              </>
            ) : (
              <Text style={{ color: Colors.grey500 }}>No action</Text>
            )}
          </View>
          {condition === "rolled" && (
            <View style={rulesGroupStyle}>
              <View style={ruleIconStyle}>
                <MaterialCommunityIcons
                  name="web"
                  size={16}
                  color={Colors.grey500}
                />
              </View>
              <View style={ruleTextStyle}>
                <Text style={{ color: Colors.grey500 }}>
                  Make request to "ifttt.com"
                </Text>
              </View>
            </View>
          )}
          {option === "Wave" && (
            <View style={rulesGroupStyle}>
              <View style={ruleIconStyle}>
                <SpeakIcon size={16} color={Colors.grey500} />
              </View>
              <View style={ruleTextStyle}>
                <Text style={{ color: Colors.grey500 }}>Say "Hello"</Text>
              </View>
            </View>
          )}
          {condition === "rolled" && (
            <>
              <Text style={facesStyle} variant="bodyMedium">
                On face 1
              </Text>
              <View style={rulesGroupStyle}>
                <View style={ruleIconStyle}>
                  <AnimationsIcon size={16} color={Colors.grey500} />
                </View>
                <View style={{ flex: 1, flexGrow: 1 }}>
                  <Text
                    numberOfLines={expandedToggle ? 0 : 1}
                    style={{ color: Colors.grey500, marginRight: 1 }} // Weird bug that clip the text
                  >
                    Play "Three Red Blinks" twice for 3s with fading set to 0.5
                  </Text>
                </View>
              </View>
              {expandedToggle && (
                <Animated.View entering={FadeIn.duration(300)}>
                  <Text style={facesStyle} variant="bodyMedium">
                    On faces 2 to 19
                  </Text>
                  <View style={rulesGroupStyle}>
                    <View style={ruleIconStyle}>
                      <AnimationsIcon size={16} color={Colors.grey500} />
                    </View>
                    <Text style={{ color: Colors.grey500 }}>
                      Play "Waterfall" for 5s
                    </Text>
                  </View>
                  <Text style={facesStyle} variant="bodyMedium">
                    On all faces
                  </Text>
                  <View style={rulesGroupStyle}>
                    <View style={ruleIconStyle}>
                      <SpeakIcon size={16} color={Colors.grey500} />
                    </View>
                    <Text style={{ color: Colors.grey500 }}>Speak Number</Text>
                  </View>
                </Animated.View>
              )}
              {/* <Animated.View
              layout={CurvedTransition.easingY(Easing.linear).duration(100)}
            >
              <Chip
                style={{ marginTop: 10, width: 150 }}
                onPress={() => {
                  setExpanded((b) => !b);
                }}
              >
                {expanded ? "Show Less" : "Show More"}
              </Chip>
            </Animated.View> */}
              <Text
                variant="labelSmall"
                style={{ marginTop: 10, color: colors.onSurfaceDisabled }}
              >
                Tap to see {expandedToggle ? "less" : "more"}
              </Text>
              <Animated.View
                style={[
                  { position: "absolute", bottom: -3, right: 5 },
                  animChevronStyle,
                ]}
              >
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={24}
                  color={colors.onSurface}
                />
              </Animated.View>
            </>
          )}
        </Pressable>
      </Animated.View>
    </>
  );
}

function RulesSection({
  profileUuid,
  condition,
  options,
  ...props
}: {
  profileUuid: string;
  condition: ConditionType;
  options: string[];
} & ViewProps) {
  const navigation =
    useNavigation<StackNavigationProp<ProfilesStackParamList>>();
  const { profiles } = useProfiles();
  const { getOrAddRule } = useProfile(profileUuid, profiles);
  return (
    <View {...props}>
      <SectionTitle>{getConditionTypeLabel(condition)}</SectionTitle>
      {options.map((opt) => (
        <RuleMenuButton
          key={opt}
          condition={condition}
          option={opt}
          style={{ backgroundColor: "transparent" }}
          onPress={() =>
            navigation.navigate("editRule", {
              profileUuid,
              ruleIndex: getOrAddRule(condition),
            })
          }
        >
          {opt}
        </RuleMenuButton>
      ))}
    </View>
  );
}

export function EditAdvancedRules({ profileUuid }: { profileUuid: string }) {
  const [showHelpBanner, setShowHelpBanner] = React.useState(true);
  return (
    <View style={{ paddingTop: 10, paddingHorizontal: 10, gap: 10 }}>
      <Banner
        visible={showHelpBanner}
        collapsedMarginBottom={-10}
        onDismiss={() => setShowHelpBanner(false)}
      >
        Advanced rules blah blah.
      </Banner>
      <RulesSection
        style={{ gap: 10 }}
        profileUuid={profileUuid}
        condition="bluetoothEvent"
        options={["Connect", "Disconnect"]}
      />
      <RulesSection
        style={{ gap: 10 }}
        profileUuid={profileUuid}
        condition="batteryEvent"
        options={["Ok", "Low", "Charging", "Done", "Bad Charging"]}
      />
    </View>
  );
}

type ReactChildArray = ReturnType<typeof React.Children.toArray>;

// https://github.com/gregberge/react-flatten-children/blob/master/src/index.tsx
function flattenChildren(children: React.ReactNode): ReactChildArray {
  const childrenArray = React.Children.toArray(children);
  return childrenArray.reduce((flatChildren: ReactChildArray, child) => {
    if ((child as React.ReactElement<any>).type === React.Fragment) {
      return flatChildren.concat(
        flattenChildren((child as React.ReactElement<any>).props.children)
      );
    }
    flatChildren.push(child);
    return flatChildren;
  }, []);
}

function SlideInView({
  children,
  delay,
  ...props
}: { delay: number } & ViewProps) {
  return (
    <>
      {delay ? (
        React.Children.map(flattenChildren(children), (child, i) => (
          <Animated.View
            entering={SlideInRight.delay(delay + 30 * i)}
            key={i}
            {...props}
          >
            {child}
          </Animated.View>
        ))
      ) : (
        <View children={children} {...props} />
      )}
    </>
  );
}

export function EditProfile({
  profileUuid,
  unnamed,
  showActionButtons,
  onDelete,
  style,
  ...props
}: {
  profileUuid: string;
  unnamed?: boolean;
  showActionButtons?: boolean;
  onDelete?: () => void;
} & ViewProps) {
  const navigation =
    useNavigation<StackNavigationProp<ProfilesStackParamList>>();
  const [showHelpBanner, setShowHelpBanner] = React.useState(true);
  const { profiles } = useProfiles();
  const { name, description, group, getOrAddRule } = useProfile(
    profileUuid,
    profiles
  );
  const conditionsTypes: ConditionType[] = ["rolled", "rolling"];
  const showConfirmDelete = useConfirmActionSheet("Delete", onDelete);
  const { colors } = useTheme();
  return (
    <SlideInView
      delay={unnamed ? 0 : 50}
      style={[{ gap: 10 }, style]}
      {...props}
    >
      <View style={{ width: "50%", aspectRatio: 1, alignSelf: "center" }}>
        <DieRenderer dieType="d20" colorway="onyxBlack" />
      </View>
      {showActionButtons && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-evenly",
            marginBottom: 10,
          }}
        >
          <OutlineButton style={{ width: "40%" }} onPress={() => {}}>
            Preview
          </OutlineButton>
          <GradientButton style={{ width: "40%" }} onPress={() => {}}>
            Activate on Die
          </GradientButton>
        </View>
      )}
      <SlideInView
        delay={unnamed ? 0 : 250}
        style={{ paddingHorizontal: 10, gap: 10 }}
      >
        {unnamed && (
          <Banner
            visible={showHelpBanner}
            onDismiss={() => setShowHelpBanner(false)}
          >
            How to customize profile blah blah.
          </Banner>
        )}
        <SectionTitle>Profile Name</SectionTitle>
        <TextInput
          mode="outlined"
          dense
          style={{ backgroundColor: colors.elevation.level0 }}
          value={name}
          editable={!unnamed}
        />
        <SectionTitle>Roll Rules</SectionTitle>
        {conditionsTypes.map((ct) => (
          <RuleMenuButton
            key={ct}
            condition={ct}
            style={{ backgroundColor: "transparent" }}
            onPress={() => {
              if (ct === "rolled") {
                navigation.navigate("editRollRules", {
                  profileUuid,
                });
              } else {
                navigation.navigate("editRule", {
                  profileUuid,
                  ruleIndex: getOrAddRule(ct),
                });
              }
            }}
          >
            {getConditionTypeLabel(ct)}
          </RuleMenuButton>
        ))}
        {!unnamed && (
          <>
            <SectionTitle>Group</SectionTitle>
            <TextInput
              mode="outlined"
              style={{ backgroundColor: colors.elevation.level0 }}
              value={group}
            />
          </>
        )}
        <SectionTitle>Description</SectionTitle>
        <TextInput
          mode="outlined"
          multiline
          style={{ backgroundColor: colors.elevation.level0 }}
          value={description}
        />
        <RulesSection
          style={{ gap: 10 }}
          profileUuid={profileUuid}
          condition="helloGoodbye"
          options={["Wakes up", "Wave"]}
        />
        <SectionTitle>Profile Usage</SectionTitle>
        <View style={{ paddingLeft: 10, paddingVertical: 10, gap: 10 }}>
          {!unnamed && <Text>Currently applied to: Grok Stonebreaker</Text>}
          <Text>Date created: {new Date().toLocaleString()}</Text>
          <Text>Date last used: {new Date().toLocaleString()}</Text>
          <Text>Memory footprint: 1234 Bytes</Text>
          <Text>Number of Color Designs: 4</Text>
        </View>
        <SectionTitle>More Actions</SectionTitle>
        <View
          style={{
            alignItems: "flex-start",
            marginTop: -10,
            paddingVertical: 10,
          }}
        >
          <TightTextButton
            icon={({ size, color }) => (
              <MaterialCommunityIcons name="cog" size={size} color={color} />
            )}
            labelStyle={{ textDecorationLine: "underline" }}
            onPress={() =>
              navigation.navigate("editAdvancedRules", { profileUuid })
            }
          >
            Edit Advanced Rules
          </TightTextButton>
          <TightTextButton
            icon={({ size, color }) => (
              <MaterialCommunityIcons name="share" size={size} color={color} />
            )}
            labelStyle={{ textDecorationLine: "underline" }}
          >
            Share
          </TightTextButton>
          {unnamed && (
            <TightTextButton
              icon={({ size, color }) => (
                <MaterialCommunityIcons
                  name="content-save"
                  size={size}
                  color={color}
                />
              )}
              labelStyle={{ textDecorationLine: "underline" }}
            >
              Save as Standalone Profile
            </TightTextButton>
          )}
          {onDelete && (
            <TightTextButton
              icon={({ size, color }) => (
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={size}
                  color={color}
                />
              )}
              labelStyle={{ textDecorationLine: "underline" }}
              onPress={() => showConfirmDelete()}
            >
              Delete Profile
            </TightTextButton>
          )}
        </View>
      </SlideInView>
    </SlideInView>
  );
}
