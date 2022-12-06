import { assert } from "@systemic-games/pixels-core-utils";
import {
  getPropsWithName,
  getPropsWithRange,
  getPropsWithWidget,
  NameProperty,
  AppDataSet,
  loadAppDataSet,
  EditAnimation,
  EditAnimationGradient,
  EditAnimationGradientPattern,
  EditAnimationKeyframed,
  EditAnimationNoise,
  EditAnimationRainbow,
  EditAnimationSimple,
  EditColor,
  EditPattern,
  EditRgbGradient,
  EditRgbKeyframe,
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
import { useEffect, useState } from "react";
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
  throw new Error(`Unsupported animation property key ${propertyKey}`);
}

interface PropertyEditorProps {
  editAnim: EditAnimation;
  propertyKey: string;
}

function PropertyEditor({ editAnim, propertyKey }: PropertyEditorProps) {
  const widget = getPropsWithWidget(editAnim).find(
    (p) => p.propertyKey === propertyKey
  );
  const entry = Object.entries(editAnim).find((e) => e[0] === propertyKey);
  const value = entry ? entry[1] : editAnim.duration; //TODO assumes only duration is an accessor
  const [propertyValue, setPropertyValue] = useState(value);
  const updateProp = (value: any) => {
    console.log(`Updating prop ${propertyKey} to ${value}`);
    if (propertyValue instanceof EditColor) {
      value = EditColor.fromColor(value as Color);
    }
    setPropertyValue(value);
    if (propertyKey === "duration") {
      editAnim.duration = value as number;
    } else {
      (editAnim as any)[propertyKey] = value;
    }
  };

  if (widget) {
    switch (widget.type) {
      case "faceMask": {
        const facesGroups = [
          range(1, 8),
          range(8, 15),
          [...range(15, 20), Constants.faceMaskAllLEDs],
        ];
        return (
          <>
            <Text bold>{propertyValue}</Text>
            {facesGroups.map((faces, i) => (
              <HStack key={i}>
                {faces.map((face) => (
                  <Button key={face} onPress={() => updateProp(face)}>
                    {face.toString()}
                  </Button>
                ))}
              </HStack>
            ))}
          </>
        );
      }
      case "index":
      case "slider": {
        assert(
          typeof propertyValue === "number",
          `Property is not a number: ${propertyKey}`
        );
        const range = getPropsWithRange(editAnim).find(
          (p) => p.propertyKey === propertyKey
        );
        const step = range && range.step > 0 ? range.step : undefined;
        return (
          <>
            <Text bold>{propertyValue}</Text>
            <Slider
              width="80%"
              height={sr(40)}
              value={value as number}
              minValue={range?.min ?? 0}
              maxValue={range?.max ?? 1}
              step={step}
              onChange={updateProp}
            >
              <Slider.Track>
                <Slider.FilledTrack />
              </Slider.Track>
              <Slider.Thumb />
            </Slider>
          </>
        );
      }
      case "gradient":
        assert(
          !propertyValue || propertyValue instanceof EditRgbGradient,
          `Property is not a EditRgbGradient: ${propertyKey}`
        );
        return (
          <FlatList
            data={gradients}
            ItemSeparatorComponent={() => <Box h={sr(3)} />}
            renderItem={(itemInfo) => (
              <Button
                key={itemInfo.item.name}
                onPress={() => updateProp(itemInfo.item.gradient)}
              >
                {itemInfo.item.name}
              </Button>
            )}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        );
      case "grayscalePattern":
      case "rgbPattern":
        assert(
          !propertyValue || propertyValue instanceof EditPattern,
          `Property is not an EditPattern: ${propertyKey}`
        );
        return (
          <FlatList
            data={patterns}
            ItemSeparatorComponent={() => <Box h={sr(3)} />}
            renderItem={(itemInfo) => (
              <Button
                key={itemInfo.item.name}
                onPress={() => updateProp(itemInfo.item)}
              >
                {itemInfo.item.name}
              </Button>
            )}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        );
      default:
        throw new Error(`Unsupported widget ${widget.type}`);
    }
  } else if (value instanceof EditColor) {
    return (
      <FlatList
        data={colorMap}
        ItemSeparatorComponent={() => <Box h={sr(3)} />}
        renderItem={(itemInfo) => (
          <Button
            key={itemInfo.item.name}
            onPress={() => updateProp(itemInfo.item.color)}
          >
            {itemInfo.item.name}
          </Button>
        )}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    );
  } else {
    return <Text bold>NO EDITOR</Text>;
  }
}

function AnimationPage() {
  const errorHandler = useErrorHandler();
  const [status, pixel, connectDispatch, lastError] = usePixelConnect();
  const [animList, setAnimList] = useState<EditAnimation[]>([]);
  const [editAnim, setEditAnim] = useState<EditAnimation | undefined>();
  const [editProperty, setEditProperty] = useState<NameProperty | undefined>();

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
          {editAnim && editProperty ? (
            <>
              <Text bold>{`Editing ${editProperty.name}`}</Text>
              <Button onPress={() => setEditProperty(undefined)}>Back</Button>
              <PropertyEditor
                editAnim={editAnim}
                propertyKey={editProperty.propertyKey}
              />
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
                data={getPropsWithName(editAnim)}
                ItemSeparatorComponent={() => <Box h={sr(3)} />}
                renderItem={(itemInfo) => (
                  <Button onPress={() => setEditProperty(itemInfo.item)}>
                    {`${itemInfo.item.name}: ${getPropValueString(
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
                    onPress={() => setEditAnim(itemInfo.item)}
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
