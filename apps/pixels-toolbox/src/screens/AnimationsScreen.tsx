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
} from "@systemic-games/pixels-edit-animation";
import { usePixelConnect } from "@systemic-games/pixels-react";
import {
  getPixelEnumName,
  AnimationTypeValues,
  Color,
  Constants,
  getPixel,
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
import { useEffect, useReducer, useState } from "react";
import { useErrorHandler } from "react-error-boundary";

import standardProfilesJson from "~/../assets/standard-profiles.json";
import AppPage from "~/components/AppPage";
import PixelScanList from "~/components/PixelScanList";
import { sr } from "~/styles";
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
    gradient: new EditRgbGradient([
      new EditRgbKeyframe(0, Color.black),
      new EditRgbKeyframe(0.15, Color.fromBytes(89, 0, 17)),
      new EditRgbKeyframe(0.5, Color.fromBytes(61, 0, 89)),
      new EditRgbKeyframe(0.85, Color.fromBytes(0, 6, 89)),
      new EditRgbKeyframe(1, Color.black),
    ]),
  },
  {
    name: "Velvet To Blue",
    gradient: new EditRgbGradient([
      new EditRgbKeyframe(0, Color.black),
      new EditRgbKeyframe(0.15, Color.fromBytes(175, 0, 255)),
      new EditRgbKeyframe(0.85, Color.fromBytes(98, 108, 255)),
      new EditRgbKeyframe(1, Color.black),
    ]),
  },
  {
    name: "Multicolors",
    gradient: new EditRgbGradient([
      new EditRgbKeyframe(0, Color.black),
      new EditRgbKeyframe(0.2, Color.blue),
      new EditRgbKeyframe(0.4, Color.red),
      new EditRgbKeyframe(0.6, Color.cyan),
      new EditRgbKeyframe(0.8, Color.green),
      new EditRgbKeyframe(1, Color.black),
    ]),
  },
  {
    name: "Fade In And Out",
    gradient: new EditRgbGradient([
      new EditRgbKeyframe(0, Color.black),
      new EditRgbKeyframe(0.5, Color.white),
      new EditRgbKeyframe(1, Color.black),
    ]),
  },
  {
    name: "Two Hills",
    gradient: new EditRgbGradient([
      new EditRgbKeyframe(0, Color.black),
      new EditRgbKeyframe(0.3, Color.white),
      new EditRgbKeyframe(0.6, Color.black),
      new EditRgbKeyframe(0.8, new Color(0.7, 0.7, 0.7)),
      new EditRgbKeyframe(1, Color.black),
    ]),
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

function RenderAnimWidget({ widget }: { widget: EditWidgetData }) {
  const [_, forceUpdate] = useReducer((b) => !b, false);
  function update<T>(value: T) {
    (widget.update as (v: T) => void)(value);
    forceUpdate();
  }
  const type = widget.type;
  switch (type) {
    case "count":
    case "slider": {
      const step = widget.step ? widget.step : undefined;
      return (
        <>
          <Text bold>{`${widget.displayName}: ${widget.getValue()}`}</Text>
          <Slider
            width="80%"
            height={sr(40)}
            value={widget.getValue()}
            minValue={widget?.min ?? 0}
            maxValue={widget?.max ?? 1}
            step={step ?? 0.1}
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

    case "faceIndex":
    case "playbackFace":
    case "bitField":
    case "toggle": {
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
          ItemSeparatorComponent={() => <Box h={sr(3)} />}
          renderItem={(itemInfo) => (
            <Button
              key={itemInfo.item.name}
              onPress={() => update(itemInfo.item.color)}
            >
              {itemInfo.item.name}
            </Button>
          )}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      );
    }

    case "gradient":
      return (
        <FlatList
          data={gradients}
          ItemSeparatorComponent={() => <Box h={sr(3)} />}
          renderItem={(itemInfo) => (
            <Button
              key={itemInfo.item.name}
              onPress={() => update(itemInfo.item.gradient)}
            >
              {itemInfo.item.name}
            </Button>
          )}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      );

    case "grayscalePattern":
    case "rgbPattern":
      return (
        <FlatList
          data={patterns}
          ItemSeparatorComponent={() => <Box h={sr(3)} />}
          renderItem={(itemInfo) => (
            <Button
              key={itemInfo.item.name}
              onPress={() => update(itemInfo.item)}
            >
              {itemInfo.item.name}
            </Button>
          )}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      );

    default:
      assertNever(type);
  }
}

function AnimationPage() {
  const errorHandler = useErrorHandler();
  const [status, pixel, connectDispatch, lastError] = usePixelConnect();
  const [animList, setAnimList] = useState<EditAnimation[]>([]);
  const [editAnim, setEditAnim] = useState<EditAnimation | undefined>();
  const [animWidgets, setAnimWidgets] = useState<EditWidgetData[]>();
  const [widget, setWidget] = useState<EditWidgetData>();

  useEffect(() => {
    errorHandler(lastError);
  }, [errorHandler, lastError]);

  return (
    <>
      {!pixel ? (
        <PixelScanList
          onSelected={(sp) => connectDispatch("connect", getPixel(sp))}
        />
      ) : (
        <VStack space={sr(3)}>
          <Text>{`Connection status: ${status}`}</Text>
          <Button onPress={() => connectDispatch("disconnect")}>
            Disconnect
          </Button>
          <Button
            onPress={() => {
              if (animList.length) {
                pixel.playTestAnimation(
                  defaultProfilesAppDataSet
                    .extractForAnimation(animList[0])
                    .toDataSet()
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
                ItemSeparatorComponent={() => <Box h={sr(3)} />}
                renderItem={(itemInfo) => (
                  <Button onPress={() => setWidget(itemInfo.item)}>
                    {`${itemInfo.item.displayName}: ${getPropValueString(
                      editAnim,
                      itemInfo.item.propertyKey
                    )}`}
                  </Button>
                )}
                contentContainerStyle={{ flexGrow: 1 }}
              />
            </>
          ) : (
            <>
              <Text bold>Effects:</Text>
              <FlatList
                data={animList}
                ItemSeparatorComponent={() => <Box h={sr(3)} />}
                renderItem={(itemInfo) => (
                  <Button
                    onPress={() => {
                      setEditAnim(itemInfo.item);
                      setAnimWidgets(getEditWidgetsData(itemInfo.item));
                    }}
                  >{`Edit ${itemInfo.item.name}`}</Button>
                )}
                contentContainerStyle={{ flexGrow: 1 }}
              />
            </>
          )}
          <Text bold>Add Effect:</Text>
          <FlatList
            data={editAnimationTypes}
            ItemSeparatorComponent={() => <Box h={sr(3)} />}
            renderItem={(itemInfo) => (
              <Button
                onPress={() => {
                  setAnimList((anims) => {
                    const anim = new itemInfo.item();
                    anim.name = `${getPixelEnumName(
                      anim.type,
                      AnimationTypeValues
                    )} #${anims.length}`;
                    return [...anims, anim];
                  });
                }}
              >
                {itemInfo.item.name.replace(EditAnimation.name, "")}
              </Button>
            )}
            contentContainerStyle={{ flexGrow: 1 }}
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
