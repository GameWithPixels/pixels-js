import { assertNever } from "@systemic-games/pixels-core-utils";
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
  Constants,
  getPixel,
  usePixelConnect,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import {
  Button,
  Box,
  FlatList,
  HStack,
  Slider,
  Text,
  VStack,
} from "native-base";
import { useCallback, useMemo, useReducer, useState } from "react";
// eslint-disable-next-line import/namespace
import { StyleSheet } from "react-native";

import standardProfilesJson from "!/profiles/standard-profiles.json";
import AppPage from "~/components/AppPage";
import PixelScanList from "~/components/PixelScanList";
import useErrorWithHandler from "~/features/hooks/useErrorWithHandler";
import range from "~/utils/range";

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
//   } catch (err) {
//     console.log("My error!!");
//     console.error(err);
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
    if (entry[1] instanceof EditColor) {
      return colorToString(entry[1].color);
    } else if (entry[1] instanceof EditRgbGradient) {
      return keyframesToString(entry[1].keyframes);
    } else if (entry[1] instanceof EditPattern) {
      return entry[1].name;
    } else {
      //TODO check type or undefined
      return `${entry[1]}`;
    }
  } else if (propertyKey === "duration") {
    return editAnim.duration.toString();
  }
  throw new Error(`Unsupported animation property key: ${propertyKey}`);
}

function Separator() {
  return <Box h={2} />;
}

function RenderAnimWidget({ widget }: { widget: EditWidgetData }) {
  const [_, triggerRender] = useReducer((b) => !b, false);
  function update<T>(value: T) {
    (widget.update as (v: T) => void)(value);
    triggerRender();
  }
  const type = widget.type;
  switch (type) {
    case "count":
    case "slider": {
      return (
        <>
          <Text bold>{`${widget.displayName}: ${widget.getValue()}`}</Text>
          <Slider
            width="80%"
            height={40}
            value={widget.getValue()}
            minValue={widget?.min ?? 0}
            maxValue={widget?.max ?? 1}
            step={widget.step ?? 0.1}
            onChange={update}
          >
            <Slider.Track>
              <Slider.FilledTrack />
            </Slider.Track>
            <Slider.Thumb />
          </Slider>
        </>
      );
    }

    case "toggle":
    case "string":
    case "face":
    case "playbackFace":
    case "bitField": {
      return (
        <Text bold>{`No editor for ${
          widget.displayName
        }: ${widget.getValue()}`}</Text>
      );
    }

    case "faceMask": {
      const facesGroups = [
        range(1, 8),
        range(8, 15),
        [...range(15, 20), Constants.faceMaskAllLEDs],
      ];
      return (
        <>
          <Text bold>{widget.displayName}</Text>
          {facesGroups.map((faces, i) => (
            <HStack key={i}>
              {faces.map((face) => (
                <Button key={face} onPress={() => update(face)}>
                  {face.toString()}
                </Button>
              ))}
            </HStack>
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
              key={itemInfo.item.name}
              onPress={() => update(itemInfo.item.color)}
            >
              {itemInfo.item.name}
            </Button>
          )}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={styles.contentContainer}
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
              onPress={() => update(itemInfo.item.gradient)}
            >
              {itemInfo.item.name}
            </Button>
          )}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={styles.contentContainer}
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
              onPress={() => update(itemInfo.item)}
            >
              {itemInfo.item.name}
            </Button>
          )}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={styles.contentContainer}
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
  const [animList, setAnimList] = useState<EditAnimation[]>([]);
  const [editAnim, setEditAnim] = useState<EditAnimation | undefined>();
  const [widget, setWidget] = useState<EditWidgetData>();
  const animWidgets = useMemo(() => {
    if (editAnim) {
      return getEditWidgetsData(editAnim);
    }
  }, [editAnim]);

  useErrorWithHandler(lastError);

  const onSelect = useCallback(
    (sp: ScannedPixel) => connectDispatch("connect", getPixel(sp)),
    [connectDispatch]
  );

  return (
    <>
      {!pixel ? (
        <PixelScanList onSelect={onSelect} />
      ) : (
        <VStack space={2}>
          <Text>{`Connection status: ${status}`}</Text>
          <Button onPress={() => connectDispatch("disconnect")}>
            Disconnect
          </Button>
          <Button
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
              <Text bold>{`Editing ${widget.displayName}`}</Text>
              <Button onPress={() => setWidget(undefined)}>Back</Button>
              <RenderAnimWidget widget={widget} />
            </>
          ) : editAnim ? (
            <>
              <Text bold>{`Editing ${editAnim.name}`}</Text>
              <Button onPress={() => setEditAnim(undefined)}>Back</Button>
              <Button
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
                  <Button onPress={() => setWidget(itemInfo.item)}>
                    {`${itemInfo.item.displayName}: ${getPropValueString(
                      editAnim,
                      itemInfo.item.propertyKey
                    )}`}
                  </Button>
                )}
                ItemSeparatorComponent={Separator}
                contentContainerStyle={styles.contentContainer}
              />
            </>
          ) : (
            <>
              <Text bold>Effects:</Text>
              <FlatList
                data={animList}
                renderItem={(itemInfo) => (
                  <Button
                    onPress={() => {
                      setEditAnim(itemInfo.item);
                    }}
                  >{`Edit ${itemInfo.item.name}`}</Button>
                )}
                ItemSeparatorComponent={Separator}
                contentContainerStyle={styles.contentContainer}
              />
            </>
          )}
          <Text bold>Add Effect:</Text>
          <FlatList
            data={editAnimationTypes}
            renderItem={(itemInfo) => (
              <Button
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
            ItemSeparatorComponent={Separator}
            contentContainerStyle={styles.contentContainer}
          />
        </VStack>
      )}
    </>
  );
}

export default function () {
  return (
    <AppPage>
      <AnimationPage />
    </AppPage>
  );
}

const styles = StyleSheet.create({
  contentContainer: { flexGrow: 1 },
});
