import Slider from "@react-native-community/slider";
import { assertNever, range } from "@systemic-games/pixels-core-utils";
import {
  loadAppDataSet,
  AppDataSet,
  EditAnimation,
  EditAnimationSimple,
  EditAnimationGradient,
  EditAnimationGradientPattern,
  EditAnimationKeyframed,
  EditAnimationRainbow,
  EditAnimationNoise,
  EditColor,
  EditPattern,
  EditRgbGradient,
  EditRgbKeyframe,
  EditWidgetData,
  getEditWidgetsData,
  createDataSetForAnimation,
} from "@systemic-games/pixels-edit-animation";
import {
  Color,
  AnimConstants,
  getPixel,
  usePixelConnect,
  ScannedPixel,
  useForceUpdate,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { FlatList, StyleSheet } from "react-native";
import { Button, Divider, Text } from "react-native-paper";

import standardProfilesJson from "!/profiles/standard-profiles.json";
import { AppStyles } from "~/AppStyles";
import { AppPage } from "~/components/AppPage";
import { BaseHStack } from "~/components/BaseHStack";
import { BaseVStack } from "~/components/BaseVStack";
import { ScannedPixelsList } from "~/components/ScannedPixelsList";
import { useErrorWithHandler } from "~/hooks/useErrorWithHandler";

// function test() {
//   try {
//     const msgBlink = new Blink();
//     msgBlink.count = 1;
//     msgBlink.color = 2;
//     msgBlink.duration = 3;
//     const arrBlink = new Uint8Array(serializeMessage(msgBlink)!);
//     console.log("serializeMessage", [...arrBlink]);

//     // IAmADie
//     const dataIAmADie = [2, 1, 3, 0, 4, 0, 0, 0, 5, 0, 0, 0, 6, 0, 7, 0, 0, 0];
//     const msgIAmADie = deserializeMessage(new Uint8Array(dataIAmADie).buffer);
//     console.log("deserializeMessage", msgIAmADie);
//     const arrIAmADie = [...new Uint8Array(serializeMessage(msgIAmADie)!)];
//     assert(JSON.stringify(dataIAmADie) === JSON.stringify(arrIAmADie));
//   } catch (e) {
//     console.log("My error!!");
//     console.error(e);
//   }
// }

// function printInfo(anim: EditAnimation) {
//   const testAnimSet = extractForAnimation(anim).toDataSet();
//   console.log("keyframes", testAnimSet.animationBits.keyframes.length);
//   console.log("palette", testAnimSet.animationBits.palette.length);
//   console.log("rgbKeyframes", testAnimSet.animationBits.rgbKeyframes.length);
//   console.log("rgbTracks", testAnimSet.animationBits.rgbTracks.length);
//   console.log("tracks", testAnimSet.animationBits.tracks.length);
//   console.log(testAnimSet.animationBits.palette);
//   console.log(testAnimSet.toTestAnimationByteArray().byteLength);
//   console.log(
//     testAnimSet.animationBits.rgbKeyframes
//       .map((kf) => kf.timeAndColor.toString())
//       .join(",")
//   );
//   console.log(JSON.stringify(testAnimSet));
//   console.log(testAnimSet.toTestAnimationByteArray());
// }

// Available animation types
const editAnimationTypes = [
  EditAnimationSimple,
  EditAnimationGradient,
  EditAnimationGradientPattern,
  EditAnimationKeyframed,
  EditAnimationRainbow,
  EditAnimationNoise,
] as const;

// Available colors
const colorMap: readonly Readonly<{ name: string; color: Color }>[] =
  Object.entries(Color)
    .filter((e) => e[1] instanceof Color)
    .map((e) => ({ name: e[0], color: e[1] as Color }));

// Load default app profiles
const defaultProfilesAppDataSet: Readonly<AppDataSet> =
  loadAppDataSet(standardProfilesJson);

// Available patterns from JSON file
const patterns: readonly Readonly<EditPattern>[] =
  defaultProfilesAppDataSet.patterns;

// Some gradients
const gradients: readonly Readonly<{
  name: string;
  gradient: EditRgbGradient;
}>[] = [
  {
    name: "Red To Blue",
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.15, color: Color.fromBytes(89, 0, 17) }),
        new EditRgbKeyframe({ time: 0.5, color: Color.fromBytes(61, 0, 89) }),
        new EditRgbKeyframe({ time: 0.85, color: Color.fromBytes(0, 6, 89) }),
        new EditRgbKeyframe({ time: 1, color: Color.black }),
      ],
    }),
  },
  {
    name: "Velvet To Blue",
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0, color: Color.black }),
        new EditRgbKeyframe({
          time: 0.15,
          color: Color.fromBytes(175, 0, 255),
        }),
        new EditRgbKeyframe({
          time: 0.85,
          color: Color.fromBytes(98, 108, 255),
        }),
        new EditRgbKeyframe({ time: 1, color: Color.black }),
      ],
    }),
  },
  {
    name: "Multicolors",
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.2, color: Color.blue }),
        new EditRgbKeyframe({ time: 0.4, color: Color.red }),
        new EditRgbKeyframe({ time: 0.6, color: Color.cyan }),
        new EditRgbKeyframe({ time: 0.8, color: Color.green }),
        new EditRgbKeyframe({ time: 1, color: Color.black }),
      ],
    }),
  },
  {
    name: "Fade In And Out",
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.5, color: Color.white }),
        new EditRgbKeyframe({ time: 1, color: Color.black }),
      ],
    }),
  },
  {
    name: "Two Hills",
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.3, color: Color.white }),
        new EditRgbKeyframe({ time: 0.6, color: Color.black }),
        new EditRgbKeyframe({ time: 0.8, color: new Color(0.7, 0.7, 0.7) }),
        new EditRgbKeyframe({ time: 1, color: Color.black }),
      ],
    }),
  },
];

function getPropValueString(
  editAnim: EditAnimation,
  propertyKey: string
): string {
  function colorToString(color: Color): string {
    return `${color.rByte} / ${color.gByte} / ${color.bByte}`;
  }

  function keyframesToString(keyframes: EditRgbKeyframe[]) {
    return keyframes
      .map((kf) => `${kf.time}: ${colorToString(kf.color)}`)
      .join("\n");
  }

  const entry = Object.entries(editAnim).find((e) => e[0] === propertyKey);
  if (entry) {
    if (entry[1] instanceof EditColor && entry[1].color) {
      return colorToString(entry[1].color);
    } else if (entry[1] instanceof EditRgbGradient) {
      return keyframesToString(entry[1].keyframes);
    } else if (entry[1] instanceof EditPattern) {
      return entry[1].name;
    } else {
      // TODO check type or undefined
      return `${entry[1]}`;
    }
  } else if (propertyKey === "duration") {
    return editAnim.duration.toString();
  }
  throw new Error(`Unsupported animation property key: ${propertyKey}`);
}

function RenderAnimWidget({ widget }: { widget: EditWidgetData }) {
  const forceUpdate = useForceUpdate();
  function update<T>(value: T) {
    (widget.update as (v: T) => void)(value);
    forceUpdate();
  }
  const type = widget.type;
  switch (type) {
    case "count":
    case "slider": {
      return (
        <>
          <Text style={AppStyles.bold}>{`${
            widget.displayName
          }: ${widget.getValue()}`}</Text>
          <Slider
            style={styles.slider}
            value={widget.getValue()}
            minimumValue={widget?.min ?? 0}
            maximumValue={widget?.max ?? 1}
            step={widget.step ?? 0.1}
            onValueChange={update}
          />
        </>
      );
    }

    case "toggle":
    case "string":
    case "face":
    case "playbackFace":
    case "bitField": {
      return (
        <Text style={AppStyles.bold}>{`No editor for ${
          widget.displayName
        }: ${widget.getValue()}`}</Text>
      );
    }

    case "faceMask": {
      const facesGroups = [
        range(1, 8),
        range(8, 15),
        [...range(15, 20), AnimConstants.faceMaskAll],
      ];
      return (
        <>
          <Text style={AppStyles.bold}>{widget.displayName}</Text>
          {facesGroups.map((faces, i) => (
            <BaseHStack key={i}>
              {faces.map((face) => (
                <Button
                  key={face}
                  mode="contained-tonal"
                  onPress={() => update(face)}
                >
                  {face.toString()}
                </Button>
              ))}
            </BaseHStack>
          ))}
        </>
      );
    }

    case "color": {
      return (
        <FlatList
          data={colorMap}
          renderItem={(itemInfo) => (
            <Button
              mode="contained-tonal"
              key={itemInfo.item.name}
              style={AppStyles.mv3}
              onPress={() => update(itemInfo.item.color)}
            >
              {itemInfo.item.name}
            </Button>
          )}
          contentContainerStyle={AppStyles.spacer}
        />
      );
    }

    case "gradient":
      return (
        <FlatList
          data={gradients}
          renderItem={(itemInfo) => (
            <Button
              key={itemInfo.item.name}
              mode="contained-tonal"
              style={AppStyles.mv3}
              onPress={() => update(itemInfo.item.gradient)}
            >
              {itemInfo.item.name}
            </Button>
          )}
          contentContainerStyle={AppStyles.spacer}
        />
      );

    case "grayscalePattern":
    case "rgbPattern":
      return (
        <FlatList
          data={patterns}
          renderItem={(itemInfo) => (
            <Button
              key={itemInfo.item.name}
              mode="contained-tonal"
              style={AppStyles.mv3}
              onPress={() => update(itemInfo.item)}
            >
              {itemInfo.item.name}
            </Button>
          )}
          contentContainerStyle={AppStyles.spacer}
        />
      );

    case "animation":
      return <Text>Animation Selector Placeholder</Text>;

    case "audioClip":
      return <Text>Audio Clip Selector Placeholder</Text>;

    case "userText":
      return <Text>User Text Editor Placeholder</Text>;

    default:
      assertNever(type);
  }
}

function AnimationPage() {
  const [status, pixel, connectDispatch, lastError] = usePixelConnect();
  const [animList, setAnimList] = React.useState<EditAnimation[]>([]);
  const [editAnim, setEditAnim] = React.useState<EditAnimation | undefined>();
  const [widget, setWidget] = React.useState<EditWidgetData>();
  const animWidgets = React.useMemo(() => {
    if (editAnim) {
      return getEditWidgetsData(editAnim);
    }
  }, [editAnim]);

  useErrorWithHandler(lastError);

  const onSelect = React.useCallback(
    (sp: ScannedPixel) => connectDispatch("connect", getPixel(sp.systemId)),
    [connectDispatch]
  );

  return (
    <>
      {!pixel ? (
        <ScannedPixelsList onSelect={onSelect} />
      ) : (
        <BaseVStack gap={5}>
          <Text>{`Connection status: ${status}`}</Text>
          <Button
            mode="contained-tonal"
            onPress={() => connectDispatch("disconnect")}
          >
            Disconnect
          </Button>
          <Button
            mode="contained-tonal"
            onPress={() => {
              if (animList.length) {
                pixel.playTestAnimation(
                  createDataSetForAnimation(animList[0]).toDataSet()
                );
              }
            }}
          >
            Play
          </Button>
          {editAnim && widget ? (
            <>
              <Text
                style={AppStyles.bold}
              >{`Editing ${widget.displayName}`}</Text>
              <Button onPress={() => setWidget(undefined)}>Back</Button>
              <RenderAnimWidget widget={widget} />
            </>
          ) : editAnim ? (
            <>
              <Text style={AppStyles.bold}>{`Editing ${editAnim.name}`}</Text>
              <Button
                mode="contained-tonal"
                onPress={() => setEditAnim(undefined)}
              >
                Back
              </Button>
              <Button
                mode="contained-tonal"
                onPress={() => {
                  setEditAnim(undefined);
                  setAnimList((animList) => {
                    const i = animList.indexOf(editAnim);
                    if (i >= 0) {
                      animList.splice(i, 1);
                      return [...animList];
                    }
                    return animList;
                  });
                }}
              >
                Remove
              </Button>
              <FlatList
                data={animWidgets}
                renderItem={(itemInfo) => (
                  <Button
                    mode="contained-tonal"
                    style={AppStyles.mv3}
                    onPress={() => setWidget(itemInfo.item)}
                  >
                    {`${itemInfo.item.displayName}: ${getPropValueString(
                      editAnim,
                      itemInfo.item.propertyKey
                    )}`}
                  </Button>
                )}
                contentContainerStyle={AppStyles.spacer}
              />
            </>
          ) : (
            <>
              <Divider style={{ marginVertical: 5 }} />
              <Text style={AppStyles.bold}>Effects:</Text>
              <FlatList
                data={animList}
                renderItem={(itemInfo) => (
                  <Button
                    mode="contained-tonal"
                    style={AppStyles.mv3}
                    onPress={() => {
                      setEditAnim(itemInfo.item);
                    }}
                  >
                    {`Edit ${itemInfo.item.name}`}
                  </Button>
                )}
                contentContainerStyle={AppStyles.spacer}
              />
            </>
          )}
          <Divider style={{ marginVertical: 5 }} />
          <Text style={AppStyles.bold}>Add Effect:</Text>
          <FlatList
            data={editAnimationTypes}
            renderItem={(itemInfo) => (
              <Button
                mode="contained-tonal"
                style={AppStyles.mv3}
                onPress={() => {
                  setAnimList((anims) => {
                    const anim = new itemInfo.item();
                    anim.name = `${anim.type} #${anims.length}`;
                    return [...anims, anim];
                  });
                }}
              >
                {itemInfo.item.name.replace(EditAnimation.name, "")}
              </Button>
            )}
            contentContainerStyle={AppStyles.spacer}
          />
        </BaseVStack>
      )}
    </>
  );
}

export function AnimationsScreen() {
  return (
    <AppPage>
      <AnimationPage />
    </AppPage>
  );
}

const styles = StyleSheet.create({
  slider: {
    width: "80%",
    height: 40,
  },
});
