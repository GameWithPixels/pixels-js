import {
  EditAnimationCycle,
  EditAnimationNoise,
  EditAnimationNormals,
  EditAnimationRainbow,
  EditAnimationSimple,
  EditRgbGradient,
  EditRgbKeyframe,
} from "@systemic-games/pixels-edit-animation";
import {
  AnimationFlagsValues,
  Color,
  getFaceMask,
  NoiseColorOverrideTypeValues,
  NormalsColorOverrideTypeValues,
} from "@systemic-games/react-native-pixels-connect";

const ledIndices = AnimationFlagsValues.useLedIndices;
const travelingWithLedIndices = AnimationFlagsValues.traveling | ledIndices;

const AnimFlash = EditAnimationSimple;
const AnimRainbow = EditAnimationRainbow;
const AnimCycle = EditAnimationCycle;
const AnimNormals = EditAnimationNormals;
const AnimNoise = EditAnimationNoise;
const RgbKf = EditRgbKeyframe;
const NoiseType = NoiseColorOverrideTypeValues;
const NormalsType = NormalsColorOverrideTypeValues;

export const PrebuildAnimations = {
  rainbow: new AnimRainbow({
    uuid: "6c1b35a7-1dfd-43b3-84d4-f4b5074aa279",
    name: "Rainbow",
    category: "colorful",
    duration: 5,
    animFlags: travelingWithLedIndices,
    count: 4,
    fade: 0.1,
    intensity: 1,
    cycles: 1,
  }),

  rainbowAurora: new AnimRainbow({
    uuid: "45cb423b-443d-49f7-a2cd-2795ee7e44af",
    name: "Rainbow Aurora",
    category: "colorful",
    duration: 5,
    animFlags: travelingWithLedIndices,
    count: 4,
    fade: 0.1,
    intensity: 0.2,
    cycles: 1,
  }),

  rainbowFast: new AnimRainbow({
    uuid: "f5299da4-ab0c-482d-ba10-ac13e6ac2bb3",
    name: "Rainbow Fast",
    category: "flashy",
    duration: 3,
    animFlags: travelingWithLedIndices,
    count: 9,
    fade: 0.1,
    intensity: 1,
    cycles: 3,
  }),

  rainbowAllFaces: new AnimRainbow({
    uuid: "1aa50313-d186-43a9-b93d-68da5efa7cc2",
    name: "Rainbow All Faces",
    category: "colorful",
    duration: 5,
    count: 4,
    intensity: 1,
    fade: 0.1,
  }),

  rainbowAllFacesAurora: new AnimRainbow({
    uuid: "24435508-a485-4c4e-b676-f7882029dbda",
    name: "Rainbow All Faces Aurora",
    category: "colorful",
    duration: 5,
    count: 4,
    intensity: 0.2,
    fade: 0.1,
  }),

  rainbowAllFacesFast: new AnimRainbow({
    uuid: "18a95b8a-ad0e-4f47-80b3-953e8c06d4d7",
    name: "Rainbow All Faces Fast",
    category: "flashy",
    duration: 3,
    count: 9,
    intensity: 1,
    fade: 0.1,
  }),

  fixedRainbow: new AnimRainbow({
    uuid: "391a31f9-38d5-4ceb-abaf-4e8e40d5e8e0",
    name: "Fixed Rainbow",
    category: "colorful",
    duration: 5,
    animFlags: travelingWithLedIndices,
    count: 0,
    fade: 0.1,
    cycles: 2,
  }),

  fixedRainbowD4: new AnimRainbow({
    uuid: "6d91261e-ab23-47a9-bd7b-a9a7f98a4ea0",
    name: "Fixed Rainbow D4",
    category: "colorful",
    dieType: "d4",
    duration: 10,
    faces: getFaceMask([1, 4, 5, 6], "d6"),
    animFlags: travelingWithLedIndices,
    count: 0,
    fade: 0.05,
    cycles: 3.67,
    intensity: 0.1,
  }),

  rainbowPulses: new AnimRainbow({
    uuid: "67f49656-8646-4983-aec9-345f5aee170f",
    name: "Rainbow Pulses",
    category: "colorful",
    fade: 1,
    cycles: 2,
    duration: 2,
  }),

  cycleFire: new AnimCycle({
    uuid: "0d44ed15-4f78-4833-9986-cc569a9e6325",
    name: "Cycle Fire",
    category: "flashy",
    duration: 3,
    animFlags: ledIndices,
    count: 5,
    fade: 0.5,
    intensity: 1,
    cycles: 1.5,
    gradient: new EditRgbGradient({
      uuid: "16b37bdc-741d-4766-9e33-51c3bf4c2e46",
      keyframes: [
        new RgbKf({ time: 0.0, color: new Color(1, 0.5, 0) }),
        new RgbKf({ time: 0.1, color: new Color(1, 0.8, 0) }),
        new RgbKf({ time: 0.2, color: Color.black }),
        new RgbKf({ time: 0.3, color: new Color(1, 0.8, 0.7) }),
        new RgbKf({ time: 0.5, color: new Color(1, 0.8, 0) }),
        new RgbKf({ time: 0.8, color: new Color(1, 0.5, 0) }),
      ],
    }),
  }),

  cycleWater: new AnimCycle({
    uuid: "64b0edf8-fd2a-4cbd-895f-a037daaaa8d7",
    name: "Cycle Water",
    category: "flashy",
    duration: 3,
    animFlags: ledIndices,
    count: 6,
    fade: 0.5,
    intensity: 1,
    cycles: 1,
    gradient: new EditRgbGradient({
      uuid: "471c4265-d651-4adf-92d7-19d28c4e0a5d",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: new Color(0.3, 0.3, 1) }),
        new RgbKf({ time: 0.3, color: new Color(0.7, 0.7, 1) }),
        new RgbKf({ time: 0.5, color: new Color(0.5, 0.5, 1) }),
        new RgbKf({ time: 0.8, color: Color.black }),
      ],
    }),
  }),

  cycleMagic: new AnimCycle({
    uuid: "7d1d627f-df35-408d-a3f3-a13c2f7546b9",
    name: "Cycle Magic",
    category: "flashy",
    duration: 3,
    animFlags: ledIndices,
    count: 5,
    fade: 0.5,
    intensity: 1,
    cycles: 5,
    gradient: new EditRgbGradient({
      uuid: "823c1e94-d3f0-4f3e-81d1-27a43578cf01",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.brightBlue }),
        new RgbKf({ time: 0.4, color: new Color(0, 0.8, 1) }),
        new RgbKf({ time: 0.5, color: new Color(0.5, 0, 1) }),
        new RgbKf({ time: 0.7, color: new Color(0.8, 0, 1) }),
        new RgbKf({ time: 1.0, color: Color.brightBlue }),
      ],
    }),
  }),

  redBlueWorm: new AnimCycle({
    uuid: "e778287e-4649-4eb0-bba3-5454550686e6",
    name: "Red Blue Worm",
    category: "animated",
    duration: 5,
    animFlags: ledIndices,
    count: 6,
    fade: 0.5,
    intensity: 1,
    cycles: 0.8,
    gradient: new EditRgbGradient({
      uuid: "01089264-ddab-43dc-836d-71797d2159bb",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.05, color: Color.brightRed }),
        new RgbKf({ time: 0.1, color: new Color(0.3, 0.3, 1) }),
        new RgbKf({ time: 0.8, color: Color.black }),
      ],
    }),
  }),

  greenRedWorm: new AnimCycle({
    uuid: "336daf1b-3497-4838-a73b-fd6d80093cab",
    name: "Green Red Worm",
    category: "animated",
    duration: 5,
    animFlags: ledIndices,
    count: 6,
    fade: 0.5,
    intensity: 1,
    cycles: 0.8,
    gradient: new EditRgbGradient({
      uuid: "d234ae71-2970-4c93-92b5-fe9ad1417031",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.05, color: Color.brightGreen }),
        new RgbKf({ time: 0.1, color: new Color(1, 0.3, 0.3) }),
        new RgbKf({ time: 0.8, color: Color.black }),
      ],
    }),
  }),

  pinkWorm: new AnimCycle({
    uuid: "24dd6ece-614e-4855-8446-fca6cdd5f960",
    name: "Pink Worm",
    category: "animated",
    duration: 5,
    animFlags: ledIndices,
    count: 6,
    fade: 0.5,
    intensity: 1,
    cycles: 0.8,
    gradient: new EditRgbGradient({
      uuid: "f25a7250-2a9b-440f-ae31-ccc728423ade",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.05, color: Color.brightWhite }),
        new RgbKf({ time: 0.15, color: new Color(1, 0.5, 0.5) }),
        new RgbKf({ time: 0.8, color: Color.black }),
      ],
    }),
  }),

  waterfall: new AnimNormals({
    uuid: "ab516f76-fe89-48a6-8b11-35f997d31197",
    name: "Waterfall",
    category: "animated",
    duration: 2,
    gradient: new EditRgbGradient({
      uuid: "f66670ba-4003-40fb-b200-35fb8b26d1c3",
      keyframes: [new RgbKf({ time: 0.0, color: Color.black })],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "2c8546e0-b117-4130-aefa-31bfa357c2c5",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.5, color: Color.brightWhite }),
        new RgbKf({ time: 1, color: Color.black }),
      ],
    }),
    axisScale: 2,
    axisOffset: -0.5,
    axisScrollSpeed: 2,
    angleGradient: new EditRgbGradient({
      uuid: "7cfd3bf8-0277-4cd6-8ce1-2bf772675595",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    angleScrollSpeed: 0,
    fade: 0.1,
    gradientColorType: NormalsType.faceToRainbowWheel,
    gradientColorVar: 0.1,
  }),

  waterfallRedGreen: new AnimNormals({
    uuid: "3ac00114-1867-4b8f-97d5-86783521c48b",
    name: "Waterfall Red Green",
    category: "animated",
    duration: 2,
    gradient: new EditRgbGradient({
      uuid: "b6357964-3c51-4c6e-8192-754ba1154526",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightRed }),
        new RgbKf({ time: 0.5, color: Color.brightYellow }),
        new RgbKf({ time: 0.9, color: Color.brightGreen }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "2879fd24-a914-4011-aecf-24118df9e91d",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.5, color: Color.brightWhite }),
        new RgbKf({ time: 1, color: Color.black }),
      ],
    }),
    axisScale: 2,
    axisOffset: -0.5,
    axisScrollSpeed: 2,
    angleGradient: new EditRgbGradient({
      uuid: "520100f1-a78e-41be-afa7-4d61f38bad1e",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    angleScrollSpeed: 0,
    fade: 0.1,
    gradientColorType: NormalsType.faceToGradient,
    gradientColorVar: 0.2,
  }),

  waterfallRainbow: new AnimNormals({
    uuid: "971ddd9f-a37d-4649-b03a-909fae9a966a",
    name: "Waterfall Rainbow",
    category: "animated",
    duration: 2,
    gradient: new EditRgbGradient({
      uuid: "63ce8f0d-7db4-4880-ad10-34d103a3d7e7",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.brightWhite }),
        new RgbKf({ time: 0.5, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "97cf792e-43ba-455c-8a13-e4ea40c661c6",
      keyframes: [
        new RgbKf({ time: 0, color: Color.brightRed }),
        new RgbKf({ time: 0.2, color: Color.brightYellow }),
        new RgbKf({ time: 0.4, color: Color.brightGreen }),
        new RgbKf({ time: 0.6, color: Color.brightCyan }),
        new RgbKf({ time: 0.8, color: Color.brightBlue }),
        new RgbKf({ time: 1, color: Color.brightMagenta }),
      ],
    }),
    axisScale: 2,
    axisOffset: -0.5,
    axisScrollSpeed: 2,
    angleGradient: new EditRgbGradient({
      uuid: "77cd6382-8aa1-4f16-992a-ff89408cc492",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    angleScrollSpeed: 0,
    fade: 0.5,
  }),

  spinningRainbow: new AnimNormals({
    uuid: "c7a041f3-f9e1-448c-94d3-a7f019ced0c4",
    name: "Spinning Rainbow",
    category: "animated",
    duration: 5,
    gradient: new EditRgbGradient({
      uuid: "52d758f7-2152-4b9a-bce4-5754fc6b2192",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.9, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "784e8a01-8784-4e7c-b3b8-b98fc0b91c45",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.5, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisScrollSpeed: 0,
    angleGradient: new EditRgbGradient({
      uuid: "c89728f7-4ddf-4d05-818d-e57e200f9741",
      keyframes: [
        // new RgbKf({ time: 0.0, color: Col.brightWhite}),
        // new RgbKf({ time: 1.0, color: Col.brightWhite}),
        new RgbKf({ time: 0.0, color: Color.brightRed }),
        new RgbKf({ time: 0.333, color: Color.brightGreen }),
        new RgbKf({ time: 0.666, color: Color.brightBlue }),
        new RgbKf({ time: 1.0, color: Color.brightRed }),
      ],
    }),
    angleScrollSpeed: 10,
  }),

  spinningRainbowAurora: new AnimNormals({
    uuid: "d0e73d74-333e-4634-b30e-e078b376d789",
    name: "Spinning Rainbow Aurora",
    category: "animated",
    duration: 5,
    gradient: new EditRgbGradient({
      uuid: "89de8ff5-8d6f-4739-8d7f-3098b8da8fa4",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.white }),
        new RgbKf({ time: 0.9, color: Color.white }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "a4777dcc-5dad-485a-b2aa-c8ac7936b4a4",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.5, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisScrollSpeed: 0,
    angleGradient: new EditRgbGradient({
      uuid: "6fafcb4e-4d53-458a-8435-261830ca19a9",
      keyframes: [
        // new RgbKf({ time: 0.0, color: Col.brightWhite}),
        // new RgbKf({ time: 1.0, color: Col.brightWhite}),
        new RgbKf({ time: 0.0, color: Color.brightRed }),
        new RgbKf({ time: 0.333, color: Color.brightGreen }),
        new RgbKf({ time: 0.666, color: Color.brightBlue }),
        new RgbKf({ time: 1.0, color: Color.brightRed }),
      ],
    }),
    angleScrollSpeed: 10,
  }),

  whiteRose: new AnimNormals({
    uuid: "c43226ad-2b96-451c-9e12-896cb14b3920",
    name: "White Rose",
    category: "uniform",
    duration: 5,
    gradient: new EditRgbGradient({
      uuid: "ba0b68a3-cb80-4e2e-8efd-d16d71897614",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.9, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "4d6d3afe-0412-48b2-8be6-c690ce401524",
      keyframes: [
        new RgbKf({ time: 0.0, color: new Color(1, 0, 0.2) }),
        new RgbKf({ time: 0.5, color: new Color(1, 0.5, 0.5) }),
        new RgbKf({ time: 1, color: Color.brightWhite }),
        //new RgbKf({ time: 1.0, color: new Col(1, 0, 0.2)}),
      ],
    }),
    axisScrollSpeed: 0,
    angleGradient: new EditRgbGradient({
      uuid: "eb60e4b9-b479-4e65-a4f0-b0843a5aaccb",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.brightWhite }),
        new RgbKf({ time: 0.5, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    angleScrollSpeed: 0,
  }),

  fireViolet: new AnimNormals({
    uuid: "b39f9e2d-1709-4a8a-9014-7e86e6940b49",
    name: "Fire Violet",
    category: "animated",
    duration: 5,
    gradient: new EditRgbGradient({
      uuid: "7337d9f5-bc77-4fdc-a427-36cf242ba037",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.9, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "9b87c453-9a8e-488c-bee7-a2b4e1e15280",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.3, color: new Color(0.5, 0.2, 1) }),
        new RgbKf({ time: 0.5, color: new Color(1, 0.5, 0) }),
        new RgbKf({ time: 0.8, color: new Color(1, 0.8, 0.5) }),
        new RgbKf({ time: 0.92, color: new Color(1, 0.8, 0.5) }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisScrollSpeed: 0,
    angleGradient: new EditRgbGradient({
      uuid: "34f4875a-86b8-47ca-a5b1-bcb4e33f00ff",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.brightWhite }),
        new RgbKf({ time: 0.5, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    angleScrollSpeed: 0,
  }),

  quickGreen: new AnimNormals({
    uuid: "f1defafe-5e44-4da2-9f71-bc37a8f55331",
    name: "Quick Green",
    category: "uniform",
    duration: 1,
    gradient: new EditRgbGradient({
      uuid: "d7e59ec1-f788-443c-8ebe-cb14a2f020f2",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.9, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "34bf5368-5092-421b-80bf-1757e9013ee3",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.3, color: Color.brightGreen }),
        new RgbKf({ time: 0.6, color: Color.brightCyan }),
        new RgbKf({ time: 0.9, color: Color.blue }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisScrollSpeed: -2,
    axisOffset: 0,
    angleGradient: new EditRgbGradient({
      uuid: "2968e33a-110d-4b5a-a0c1-bbb884e6d397",
      keyframes: [new RgbKf({ time: 0.5, color: Color.brightWhite })],
    }),
    angleScrollSpeed: 10,
    fade: 0.5,
  }),

  quickRed: new AnimNormals({
    uuid: "a09df89c-af86-4f62-87a4-a77930ccbc2a",
    name: "Quick Red",
    category: "uniform",
    duration: 1,
    gradient: new EditRgbGradient({
      uuid: "bf2268f1-2249-4bb4-a997-c1fde932ef26",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.9, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "23dcedbe-a58e-4f40-9640-b84e600bca57",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.3, color: Color.brightRed }),
        new RgbKf({ time: 0.6, color: Color.brightPurple }),
        new RgbKf({ time: 0.9, color: Color.brightBlue }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisScrollSpeed: -2,
    axisOffset: 0,
    angleGradient: new EditRgbGradient({
      uuid: "5471e3f9-fade-47fd-ab1a-883110c957cc",
      keyframes: [new RgbKf({ time: 0.5, color: Color.brightWhite })],
    }),
    angleScrollSpeed: 10,
    fade: 0.5,
  }),

  redGreenAlarm: new AnimNormals({
    uuid: "0488c178-ecbb-4929-a633-e5b5ec27e39c",
    name: "Red Green Alarm",
    category: "uniform",
    duration: 2,
    gradient: new EditRgbGradient({
      uuid: "79aa20f2-9e6c-4071-a063-3d66cd7e8075",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.brightRed }),
        new RgbKf({ time: 0.4, color: Color.brightRed }),
        new RgbKf({ time: 0.6, color: Color.brightGreen }),
        new RgbKf({ time: 1.0, color: Color.brightGreen }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "dc454941-8abf-4daf-b0fe-d36d66657e1f",
      keyframes: [new RgbKf({ time: 0, color: Color.brightWhite })],
    }),
    axisScale: 1,
    axisOffset: 0,
    axisScrollSpeed: 0,
    angleGradient: new EditRgbGradient({
      uuid: "5455cca8-fac9-48eb-98a8-9ce5d29a73b0",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.white }),
        new RgbKf({ time: 0.2, color: Color.brightWhite }),
        new RgbKf({ time: 0.4, color: Color.white }),
        new RgbKf({ time: 0.5, color: Color.white }),
        new RgbKf({ time: 0.7, color: Color.brightWhite }),
        new RgbKf({ time: 0.9, color: Color.white }),
      ],
    }),
    angleScrollSpeed: 5,
    fade: 0.2,
    gradientColorType: NormalsType.faceToGradient,
  }),

  rainbowAlarm: new AnimNormals({
    uuid: "0477be62-73c9-4591-a2fe-d8db52f2712a",
    name: "Rainbow Alarm",
    category: "animated",
    duration: 2,
    gradient: new EditRgbGradient({
      uuid: "5db313d4-9c68-40be-97bf-c6c9f2c760bd",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "772cca69-27ad-4278-80ef-c879e7f0f621",
      keyframes: [
        // new RgbKf({ time: 0, color: Col.brightWhite }),
        // new RgbKf({ time: 1, color: Col.brightWhite }),
        new RgbKf({ time: 0, color: Color.brightRed }),
        new RgbKf({ time: 0.2, color: Color.brightYellow }),
        new RgbKf({ time: 0.4, color: Color.brightGreen }),
        new RgbKf({ time: 0.6, color: Color.brightCyan }),
        new RgbKf({ time: 0.8, color: Color.brightBlue }),
        new RgbKf({ time: 1, color: Color.brightMagenta }),
      ],
    }),
    axisScale: 2,
    axisOffset: -0.5,
    axisScrollSpeed: 2,
    angleGradient: new EditRgbGradient({
      uuid: "c6c4950f-1f70-4f55-808d-621b00aceb31",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.5, color: Color.brightWhite }),
        new RgbKf({ time: 1, color: Color.black }),
      ],
    }),
    angleScrollSpeed: 5,
    fade: 0.1,
  }),

  spiralUp: new AnimNormals({
    uuid: "b28682d0-fffd-4a07-b723-dbb127309c23",
    name: "Spiral Up",
    category: "animated",
    duration: 4,
    gradient: new EditRgbGradient({
      uuid: "f6bb8290-bf81-49ca-adf8-7d5908e9c4d0",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "7348af43-b94e-42ad-88fc-b55e0f05391c",
      keyframes: [
        new RgbKf({ time: 0.2, color: Color.black }),
        new RgbKf({ time: 0.45, color: Color.brightWhite }),
        new RgbKf({ time: 0.55, color: Color.brightWhite }),
        new RgbKf({ time: 0.8, color: Color.black }),
      ],
    }),
    axisScale: 1,
    axisOffset: 1.1,
    axisScrollSpeed: -2.2,
    angleGradient: new EditRgbGradient({
      uuid: "ba6204bd-4abf-497f-bc96-f8e5d95e1052",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.4, color: Color.brightWhite }),
        new RgbKf({ time: 0.8, color: Color.black }),
      ],
    }),
    angleScrollSpeed: 6,
    fade: 0.2,
    gradientColorType: NormalsType.faceToRainbowWheel,
    gradientColorVar: 0.1,
  }),

  rainbowUp: new AnimNormals({
    uuid: "261b9bc7-9017-4950-b18d-1e95958664c1",
    name: "Rainbow Up",
    category: "animated",
    duration: 4,
    gradient: new EditRgbGradient({
      uuid: "7df591a7-b3a0-4a63-8e99-79402c896af3",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "82ec56ec-402b-4d6d-bdb0-dbed8848944c",
      keyframes: [
        new RgbKf({ time: 0, color: Color.brightRed }),
        new RgbKf({ time: 0.2, color: Color.brightYellow }),
        new RgbKf({ time: 0.4, color: Color.brightGreen }),
        new RgbKf({ time: 0.6, color: Color.brightCyan }),
        new RgbKf({ time: 0.8, color: Color.brightBlue }),
        new RgbKf({ time: 1, color: Color.brightMagenta }),
      ],
    }),
    axisScale: 1,
    axisOffset: 0.8,
    axisScrollSpeed: -2.2,
    angleGradient: new EditRgbGradient({
      uuid: "00248f71-9418-41e2-b31e-78816450814b",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.white }),
        new RgbKf({ time: 0.4, color: Color.brightWhite }),
        new RgbKf({ time: 0.8, color: Color.white }),
      ],
    }),
    angleScrollSpeed: 6,
    fade: 0.2,
    gradientColorType: NormalsType.none,
    gradientColorVar: 0.1,
  }),

  noise: new AnimNoise({
    uuid: "61785d78-a642-461f-8dc1-1f0fb2dddd29",
    name: "Noise",
    category: "flashy",
    duration: 2,
    gradient: new EditRgbGradient({
      uuid: "7aa5f0c4-f558-4adc-ad55-b1b765f9a727",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.brightRed }),
        new RgbKf({ time: 0.333, color: Color.brightGreen }),
        new RgbKf({ time: 0.666, color: Color.brightBlue }),
        new RgbKf({ time: 1.0, color: Color.brightRed }),
      ],
    }),
    blinkGradient: new EditRgbGradient({
      uuid: "fbf33718-46a5-40ba-a421-bfa9dade3ace",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.2, color: Color.mediumWhite }),
        new RgbKf({ time: 1, color: Color.faintWhite }),
      ],
    }),
    blinkFrequency: 50,
    blinkFrequencyVar: 0,
    blinkDuration: 2,
    fade: 0.5,
    gradientColorType: NoiseType.faceToRainbowWheel,
    gradientColorVar: 0.1,
  }),

  noiseBlueSlow: new AnimNoise({
    uuid: "fc4e54c4-3b42-4f8c-85a8-e4fa5179304f",
    name: "Noise Blue Slow",
    category: "flashy",
    duration: 10,
    gradient: new EditRgbGradient({
      uuid: "6c10a7bb-8f33-4df5-aa3b-84761f4dcdc1",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.brightGreen }),
      ],
    }),
    blinkGradient: new EditRgbGradient({
      uuid: "2863e517-798a-4a2f-b0ff-4360ce2fc93f",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.5, color: Color.brightBlue }),
        new RgbKf({ time: 1, color: Color.black }),
      ],
    }),
    blinkFrequency: 20,
    blinkFrequencyVar: 0,
    blinkDuration: 3,
  }),

  redBlueNoise: new AnimNoise({
    uuid: "8257f66b-9428-489f-a48b-09f1ca4fc380",
    name: "Red Blue Noise",
    category: "flashy",
    duration: 2,
    gradient: new EditRgbGradient({
      uuid: "ed743093-c662-44ec-bf82-5d912e0277db",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.brightRed }),
        new RgbKf({ time: 1.0, color: Color.brightBlue }),
      ],
    }),
    blinkGradient: new EditRgbGradient({
      uuid: "3dd30030-2c7d-42e9-9b0b-c9414f0141e3",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.5, color: Color.brightWhite }),
        new RgbKf({ time: 1, color: Color.black }),
      ],
    }),
    blinkFrequency: 40,
    blinkFrequencyVar: 1,
    blinkDuration: 3,
    fade: 0.1,
    gradientColorType: NoiseType.faceToGradient,
    gradientColorVar: 0.6,
  }),

  rainbowNoise: new AnimNoise({
    uuid: "ee66f25b-b7fb-45a7-9a17-59db258327e5",
    name: "Rainbow Noise",
    category: "flashy",
    duration: 5,
    gradient: new EditRgbGradient({
      uuid: "ba250e94-a36e-4246-afe4-ede300490d4a",
      keyframes: [
        new RgbKf({ time: 0, color: Color.brightRed }),
        new RgbKf({ time: 0.2, color: Color.brightYellow }),
        new RgbKf({ time: 0.4, color: Color.brightGreen }),
        new RgbKf({ time: 0.6, color: Color.brightCyan }),
        new RgbKf({ time: 0.8, color: Color.brightBlue }),
        new RgbKf({ time: 1, color: Color.brightMagenta }),
      ],
    }),
    blinkGradient: new EditRgbGradient({
      uuid: "8e331458-611a-4fc8-8683-2a224f3386b2",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.white }),
        new RgbKf({ time: 0.2, color: Color.mediumWhite }),
        new RgbKf({ time: 1, color: Color.faintWhite }),
      ],
    }),
    blinkFrequency: 50,
    blinkFrequencyVar: 0,
    blinkDuration: 2,
    fade: 0.1,
    gradientColorType: NoiseType.randomFromGradient,
    gradientColorVar: 0,
  }),

  whiteBlueNoise: new AnimNoise({
    uuid: "900f5b09-b44a-49cc-bc2c-0eeaaac0b74a",
    name: "White Blue Noise",
    category: "flashy",
    duration: 5,
    gradient: new EditRgbGradient({
      uuid: "41c1334a-0d87-4049-a8d7-818f9ca1c663",
      keyframes: [
        new RgbKf({ time: 0, color: Color.brightCyan }),
        new RgbKf({ time: 1, color: Color.white }),
      ],
    }),
    blinkGradient: new EditRgbGradient({
      uuid: "b5580224-cf51-4756-a120-021af2edd4ee",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.mediumWhite }),
        new RgbKf({ time: 1, color: Color.faintWhite }),
      ],
    }),
    blinkFrequency: 10,
    blinkFrequencyVar: 0,
    blinkDuration: 5,
    fade: 0.1,
    gradientColorType: NoiseType.randomFromGradient,
    gradientColorVar: 0.5,
  }),

  shortNoise: new AnimNoise({
    uuid: "b8c15cc3-c762-43b3-915a-64367fcf1cf1",
    name: "Short Noise",
    category: "flashy",
    duration: 1,
    gradient: new EditRgbGradient({
      uuid: "0ccd88d9-eb40-43b7-82df-707e8cd2e8a0",
      keyframes: [
        new RgbKf({ time: 0, color: Color.white }),
        new RgbKf({ time: 1, color: Color.white }),
      ],
    }),
    blinkGradient: new EditRgbGradient({
      uuid: "c533d28f-a6ff-47a3-b36e-b601fbeefe50",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.mediumWhite }),
        new RgbKf({ time: 1, color: Color.faintWhite }),
      ],
    }),
    blinkFrequency: 10,
    blinkFrequencyVar: 5,
    blinkDuration: 5,
    fade: 0.1,
    gradientColorType: NoiseType.none,
    gradientColorVar: 0.5,
  }),

  blueFlash: new AnimFlash({
    uuid: "5cc7bcb8-1d89-4a1f-b3a0-ad7661c0564e",
    name: "Slow Blue Flash",
    category: "uniform",
    duration: 2,
    color: Color.blue,
    fade: 0.5,
  }),
} as const;
