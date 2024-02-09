import {
  AnimationFlagsValues,
  Color,
  getFaceMask,
  NoiseColorOverrideTypeValues,
  NormalsColorOverrideTypeValues,
} from "@systemic-games/pixels-core-animation";

import {
  EditAnimationCycle,
  EditAnimationNoise,
  EditAnimationNormals,
  EditAnimationRainbow,
  EditAnimationSequence,
  EditAnimationSequenceItem,
  EditAnimationSimple,
  EditColor,
  EditRgbGradient,
  EditRgbKeyframe,
} from "../edit";

const ledIndices = AnimationFlagsValues.useLedIndices;
const travelingWithLedIndices = AnimationFlagsValues.traveling | ledIndices;

const AnimFlashes = EditAnimationSimple;
const AnimRainbow = EditAnimationRainbow;
const AnimCycle = EditAnimationCycle;
const AnimNormals = EditAnimationNormals;
const AnimNoise = EditAnimationNoise;
const AnimSequence = EditAnimationSequence;
const SequenceItem = EditAnimationSequenceItem;
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
        new RgbKf({ time: 0.4, color: Color.fromString("#e5a8f5") }),
        new RgbKf({ time: 0.5, color: Color.fromString("#5e3097") }),
        new RgbKf({ time: 0.7, color: Color.fromString("#9f63a9") }),
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

  greenBlueWorm: new AnimCycle({
    uuid: "336daf1b-3497-4838-a73b-fd6d80093cab",
    name: "Green Blue Worm",
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
        new RgbKf({ time: 0.1, color: new Color(0.3, 0.3, 1) }),
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

  waterWorm: new AnimCycle({
    uuid: "6b3d50eb-f357-47ee-91f6-4ee5ff154a27",
    name: "Water Worm",
    category: "animated",
    duration: 2,
    animFlags: ledIndices,
    count: 2,
    fade: 0.5,
    intensity: 1,
    cycles: 0.8,
    gradient: new EditRgbGradient({
      uuid: "879cf3fa-528f-4c7c-a538-2ecdc8c7a64a",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.05, color: Color.fromString("#0945ee") }),
        new RgbKf({ time: 0.15, color: Color.fromString("#a2cffc") }),
        new RgbKf({ time: 0.25, color: Color.fromString("#09aaed") }),
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

  waterfallTopHalf: new AnimNormals({
    uuid: "ebfc1dd5-ec82-45ac-a653-db2fbb96e5c1",
    name: "Waterfall Top Half",
    category: "animated",
    duration: 0.5,
    gradient: new EditRgbGradient({
      uuid: "a605f556-2021-4e6a-ac46-f727c757d190",
      keyframes: [new RgbKf({ time: 0.0, color: Color.black })],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "baa08d00-3e00-4ba8-8746-c971b158e52a",
      keyframes: [
        new RgbKf({ time: 0.2, color: Color.black }),
        new RgbKf({ time: 1, color: Color.brightWhite }),
      ],
    }),
    axisScale: 1,
    axisOffset: 0,
    axisScrollSpeed: 0,
    angleGradient: new EditRgbGradient({
      uuid: "f683f7ea-9efb-4fc8-8b22-953293fdd192",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    angleScrollSpeed: 0,
    fade: 0.5,
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

  spinning: new AnimNormals({
    uuid: "e655e6e1-32c3-407b-a154-15ceef54c9f3",
    name: "Spinning",
    category: "animated",
    duration: 3,
    gradient: new EditRgbGradient({
      uuid: "739e3d1a-388d-437b-9af6-8f9524e41ce5",
      keyframes: [new RgbKf({ time: 0.0, color: Color.brightWhite })],
    }),
    gradientColorType: NormalsType.faceToRainbowWheel,
    gradientColorVar: 0.1,
    axisGradient: new EditRgbGradient({
      uuid: "97d98e28-c0ad-43b6-be04-77438c33892f",
      keyframes: [new RgbKf({ time: 0.0, color: Color.brightWhite })],
    }),
    axisScrollSpeed: 0,
    angleGradient: new EditRgbGradient({
      uuid: "40491707-2e5d-4fd9-8f95-a8462415d41a",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.brightWhite }),
        new RgbKf({ time: 0.3, color: Color.white }),
        new RgbKf({ time: 0.5, color: Color.black }),
        new RgbKf({ time: 0.7, color: Color.white }),
        new RgbKf({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    angleScrollSpeed: 8,
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
        new RgbKf({ time: 0.0, color: Color.white }),
        new RgbKf({ time: 0.5, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.white }),
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

  reverseQuickRed: new AnimNormals({
    uuid: "f255a082-13ca-48ab-bed0-38292d797f25",
    name: "Reverse Quick Red",
    category: "uniform",
    duration: 1,
    gradient: new EditRgbGradient({
      uuid: "e3510dd7-a139-4adf-8778-8528d8adceaf",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.9, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "373e27b9-fc88-40b8-9e8c-b261009aa8d2",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightBlue }),
        new RgbKf({ time: 0.4, color: Color.brightPurple }),
        new RgbKf({ time: 0.7, color: Color.brightRed }),
        new RgbKf({ time: 1.0, color: Color.brightRed }),
      ],
    }),
    axisScrollSpeed: 2,
    axisOffset: -1,
    angleGradient: new EditRgbGradient({
      uuid: "1ff81af9-234c-471c-a3fe-acc11e54011b",
      keyframes: [new RgbKf({ time: 0.5, color: Color.brightWhite })],
    }),
    angleScrollSpeed: 10,
    fade: 0.5,
  }),

  reverseQuickGreen: new AnimNormals({
    uuid: "769c3fbd-d7fb-4a3d-9eda-1731e6565fa4",
    name: "Reverse Quick Green",
    category: "uniform",
    duration: 1,
    gradient: new EditRgbGradient({
      uuid: "fc298ee4-fdb8-4c43-93d6-e4d5a7c9898a",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.9, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "a59b63cd-5059-4f6a-aa0d-383a96b24a0e",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightBlue }),
        new RgbKf({ time: 0.4, color: Color.brightCyan }),
        new RgbKf({ time: 0.7, color: Color.brightGreen }),
        new RgbKf({ time: 1.0, color: Color.brightGreen }),
      ],
    }),
    axisScrollSpeed: 2,
    axisOffset: -1,
    angleGradient: new EditRgbGradient({
      uuid: "0172e98f-3cf2-4775-aca9-3e36a0f1ae55",
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
    duration: 1.5,
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
    gradientColorVar: 0.2,
  }),

  spiralDown: new AnimNormals({
    uuid: "17c75b18-b186-4a4e-ade0-bf94f658d6db",
    name: "Spiral Down",
    category: "animated",
    duration: 1.5,
    gradient: new EditRgbGradient({
      uuid: "31b4efd6-345e-4c8b-bc20-848ec9495584",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "c2b28262-7374-467c-903a-f2dc7c31e078",
      keyframes: [
        new RgbKf({ time: 0.2, color: Color.black }),
        new RgbKf({ time: 0.45, color: Color.brightWhite }),
        new RgbKf({ time: 0.55, color: Color.brightWhite }),
        new RgbKf({ time: 0.8, color: Color.black }),
      ],
    }),
    axisScale: 1,
    axisOffset: -1.2,
    axisScrollSpeed: 2.2,
    angleGradient: new EditRgbGradient({
      uuid: "06abbbb4-5c54-4609-bf6a-f5beb559c21a",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.4, color: Color.brightWhite }),
        new RgbKf({ time: 0.8, color: Color.black }),
      ],
    }),
    angleScrollSpeed: 6,
    fade: 0.2,
    gradientColorType: NormalsType.faceToRainbowWheel,
    gradientColorVar: 0.2,
  }),

  rainbowUp: new AnimNormals({
    uuid: "261b9bc7-9017-4950-b18d-1e95958664c1",
    name: "Rainbow Up",
    category: "animated",
    duration: 3,
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
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.4, color: Color.brightWhite }),
        new RgbKf({ time: 0.8, color: Color.black }),
      ],
    }),
    angleScrollSpeed: 6,
    fade: 0.2,
    gradientColorType: NormalsType.none,
    gradientColorVar: 0.1,
  }),

  rainbowDown: new AnimNormals({
    uuid: "de34bb09-b533-4bc9-b68a-ac65a773124f",
    name: "Rainbow Down",
    category: "animated",
    duration: 3,
    gradient: new EditRgbGradient({
      uuid: "3ccd1b51-f05c-4547-985f-f0154f42a1c2",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "27d212ed-6d58-461f-96e7-d4c8c423b629",
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
    axisOffset: -0.8,
    axisScrollSpeed: 2.2,
    angleGradient: new EditRgbGradient({
      uuid: "0ad8b80f-0e82-4767-a584-14459588e07d",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.4, color: Color.brightWhite }),
        new RgbKf({ time: 0.8, color: Color.black }),
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
    gradientColorVar: 0.02,
  }),

  noiseRainbow: new AnimNoise({
    uuid: "fb06e79f-d01d-4597-a104-76169eca1200",
    name: "Noise Rainbow",
    category: "flashy",
    duration: 2,
    gradient: new EditRgbGradient({
      uuid: "625907aa-f086-481e-a88a-e09b1737dcd4",
      keyframes: [
        new RgbKf({ time: 0, color: Color.brightBlue }),
        new RgbKf({ time: 0.333, color: Color.brightRed }),
        new RgbKf({ time: 0.666, color: Color.brightGreen }),
        new RgbKf({ time: 1.0, color: Color.brightBlue }),
      ],
    }),
    blinkGradient: new EditRgbGradient({
      uuid: "ce4dd255-87b9-4365-a839-8d61217336c2",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.2, color: Color.mediumWhite }),
        new RgbKf({ time: 1, color: Color.faintWhite }),
      ],
    }),
    blinkFrequency: 40,
    blinkFrequencyVar: 0,
    blinkDuration: 2,
    fade: 0.1,
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

  shortNoise: new AnimNoise({
    uuid: "5575de5a-2059-48c1-a08a-99ecc19b775c",
    name: "Short Noise",
    category: "flashy",
    duration: 1,
    gradient: new EditRgbGradient({
      uuid: "7069439d-c69d-48e1-87cd-9566071c995f",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.brightRed }),
        new RgbKf({ time: 0.333, color: Color.brightGreen }),
        new RgbKf({ time: 0.666, color: Color.brightBlue }),
        new RgbKf({ time: 1.0, color: Color.brightRed }),
      ],
    }),
    blinkGradient: new EditRgbGradient({
      uuid: "92047fd6-a292-4a3c-b2f2-0ea77a166a9b",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.2, color: Color.mediumWhite }),
        new RgbKf({ time: 1, color: Color.faintWhite }),
      ],
    }),
    blinkFrequency: 20,
    blinkFrequencyVar: 0,
    blinkDuration: 1,
    fade: 0.1,
    gradientColorType: NoiseType.faceToRainbowWheel,
    gradientColorVar: 0.1,
  }),

  blueFlash: new AnimFlashes({
    uuid: "5cc7bcb8-1d89-4a1f-b3a0-ad7661c0564e",
    name: "Blue Flash",
    category: "uniform",
    duration: 1,
    color: Color.blue,
    fade: 0.5,
  }),

  fountain: new AnimNormals({
    uuid: "c30e296b-422a-4713-9bb4-85c2fcee56d8",
    name: "Fountain",
    category: "animated",
    duration: 2,
    gradient: new EditRgbGradient({
      uuid: "596470ab-df75-4b56-8780-d39213962a5b",
      keyframes: [new RgbKf({ time: 0.0, color: Color.black })],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "3f48cf69-16b0-417b-b653-a1086f466030",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.2, color: Color.white }),
        new RgbKf({ time: 0.3, color: Color.brightWhite }),
        new RgbKf({ time: 0.4, color: Color.black }),
        new RgbKf({ time: 0.5, color: Color.white }),
        new RgbKf({ time: 0.6, color: Color.black }),
        new RgbKf({ time: 0.7, color: Color.brightWhite }),
        new RgbKf({ time: 0.8, color: Color.white }),
        new RgbKf({ time: 0.9, color: Color.brightWhite }),
        new RgbKf({ time: 1, color: Color.black }),
      ],
    }),
    axisScale: 2,
    axisOffset: 1,
    axisScrollSpeed: -2,
    angleGradient: new EditRgbGradient({
      uuid: "1d5a79df-e9f4-46bf-9642-f40a0f0de0bb",
      keyframes: [
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.9, color: Color.brightWhite }),
      ],
    }),
    angleScrollSpeed: 0,
    fade: 0.5,
    gradientColorType: NormalsType.faceToRainbowWheel,
    gradientColorVar: 0.1,
  }),

  rainbowFountain: new AnimNormals({
    uuid: "42613ce9-12fb-4973-8e38-cc0765d980f1",
    name: "Rainbow Fountain",
    category: "animated",
    duration: 2,
    gradient: new EditRgbGradient({
      uuid: "5f73c7eb-087c-4cb9-af94-f64af552aeb8",
      keyframes: [new RgbKf({ time: 0.0, color: Color.black })],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "162a30e8-1fe4-4316-90e3-ea89c9404c21",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.2, color: Color.white }),
        new RgbKf({ time: 0.3, color: Color.brightWhite }),
        new RgbKf({ time: 0.4, color: Color.white }),
        new RgbKf({ time: 0.5, color: Color.black }),
        new RgbKf({ time: 0.6, color: Color.white }),
        new RgbKf({ time: 0.7, color: Color.brightWhite }),
        new RgbKf({ time: 0.8, color: Color.white }),
        new RgbKf({ time: 0.9, color: Color.brightWhite }),
        new RgbKf({ time: 1, color: Color.black }),
      ],
    }),
    axisScale: 2,
    axisOffset: 1,
    axisScrollSpeed: -2,
    angleGradient: new EditRgbGradient({
      uuid: "3aaf600e-6520-4eeb-a429-eade7f8a1f6f",
      keyframes: [
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.9, color: Color.brightWhite }),
      ],
    }),
    angleScrollSpeed: 0,
    fade: 0.5,
    gradientColorType: NormalsType.faceToRainbowWheel,
    gradientColorVar: 0.5,
  }),

  whiteFlash: new AnimFlashes({
    uuid: "066b1705-99be-4c0a-af64-313f47ccefa3",
    name: "White Flash",
    category: "uniform",
    duration: 0.3,
    color: Color.brightWhite,
    count: 1,
    fade: 0.5,
  }),

  coloredFlash: new AnimFlashes({
    uuid: "4e1dd558-2266-4c4d-9a26-05aacee66801",
    name: "Colored Flash",
    category: "uniform",
    duration: 0.5,
    color: new EditColor("face"),
    count: 1,
    fade: 0.5,
  }),

  alternatingWhite1_d20: new AnimFlashes({
    uuid: "1e891121-49ef-4ffd-b4a5-f8093c11a0d4",
    name: "Alternate White 1",
    category: "uniform",
    duration: 3,
    color: Color.brightWhite,
    count: 5,
    fade: 1,
    faces: getFaceMask([2, 14, 8, 1, 3, 17, 5, 15, 9, 11], "d20"),
    dieType: "d20",
  }),

  alternatingWhite2_d20: new AnimFlashes({
    uuid: "8de9d84a-2185-42e2-b130-7d3d662ac5c8",
    name: "Alternate White 2",
    category: "uniform",
    duration: 3,
    color: Color.brightWhite,
    count: 5,
    fade: 0.5,
    faces: getFaceMask([4, 6, 7, 10, 12, 13, 16, 18, 19, 20], "d20"),
    dieType: "d20",
  }),

  fireBaseLayer: new AnimNormals({
    uuid: "483b590a-f011-47f1-b569-a922833b34a4",
    name: "Fire Base Layer",
    category: "animated",
    duration: 4.5,
    gradient: new EditRgbGradient({
      uuid: "66fdddde-6c6a-4f67-873b-3c48086803a3",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.7, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "26ba6f64-eec7-440d-ab79-b846666bc852",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.fromString("#fce7b3") }),
        new RgbKf({ time: 0.1, color: Color.fromString("#fad068") }),
        new RgbKf({ time: 0.3, color: Color.fromString("#f1a204") }),
        new RgbKf({ time: 0.5, color: Color.fromString("#fd6d01") }),
        new RgbKf({ time: 0.8, color: Color.fromString("#fd0001") }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisScrollSpeed: 0,
    angleGradient: new EditRgbGradient({
      uuid: "48f7a5a8-33de-4b03-998b-c5fa5500feec",
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
  }),

  fireNoiseLayer: new AnimNoise({
    uuid: "14f1e54a-cf90-4ac8-a1f8-082940838185",
    name: "Fire Noise Layer",
    category: "flashy",
    duration: 5.5,
    gradient: new EditRgbGradient({
      uuid: "0e27bd1b-b978-4c2a-96dc-087c4a104c00",
      keyframes: [
        new RgbKf({ time: 0.1, color: Color.fromString("#fad068") }),
        new RgbKf({ time: 0.3, color: Color.fromString("#f1a204") }),
        new RgbKf({ time: 0.7, color: Color.fromString("#fd6d01") }),
      ],
    }),
    blinkGradient: new EditRgbGradient({
      uuid: "cb24615e-a1bf-4594-8cf8-b138a2957b15",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.9, color: Color.white }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    blinkFrequency: 10,
    blinkFrequencyVar: 1,
    blinkDuration: 2,
    fade: 1,
  }),

  whiteNoise: new AnimNoise({
    uuid: "b4b43aea-42c9-477b-ae1e-0aa0ec52cbc3",
    name: "White Noise",
    category: "flashy",
    duration: 1.5,
    gradient: new EditRgbGradient({
      uuid: "ae91c67f-199c-4819-8050-3d5d30fb9ce7",
      keyframes: [new RgbKf({ time: 0.0, color: Color.brightWhite })],
    }),
    blinkGradient: new EditRgbGradient({
      uuid: "f8a1b8dc-6f01-4e59-992a-ca9fed13f045",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.2, color: Color.mediumWhite }),
        new RgbKf({ time: 1, color: Color.faintWhite }),
      ],
    }),
    blinkFrequency: 50,
    blinkFrequencyVar: 0,
    blinkDuration: 1,
    fade: 0.5,
  }),

  spinningMagic: new AnimNormals({
    uuid: "67d2a675-4331-4c8d-89b4-e2af001e2212",
    name: "Spinning Magic",
    category: "animated",
    duration: 2,
    gradient: new EditRgbGradient({
      uuid: "7d58de45-5468-4ded-a5a2-1dd742eca7a0",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.9, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "cecfa111-17c9-42ad-8f6e-733e15d7c037",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.4, color: Color.brightWhite }),
        new RgbKf({ time: 0.5, color: Color.brightWhite }),
        new RgbKf({ time: 0.6, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisScrollSpeed: 0,
    angleGradient: new EditRgbGradient({
      uuid: "91964753-6cee-48e4-bfe2-476e74521fb1",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.fromString("#5e3097") }),
        new RgbKf({ time: 0.4, color: Color.black }),
        new RgbKf({ time: 0.5, color: Color.fromString("#e5a8f5") }),
        //new RgbKf({ time: 0.5, color: Color.brightPurple }),
        new RgbKf({ time: 0.6, color: Color.black }),
        new RgbKf({ time: 1.0, color: Color.fromString("#5e3097") }),
      ],
    }),
    angleScrollSpeed: 3,
  }),

  counterSpinningMagic: new AnimNormals({
    uuid: "befad69b-6b16-4a43-8ffe-243c7e0014d0",
    name: "Counter Spinning Magic",
    category: "animated",
    duration: 2,
    gradient: new EditRgbGradient({
      uuid: "5274a481-1d8d-473d-9d2f-bba5ffd62130",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.9, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "e666c7b7-3096-4f42-aacd-a9b00ea1a59f",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.4, color: Color.brightWhite }),
        new RgbKf({ time: 0.5, color: Color.brightWhite }),
        new RgbKf({ time: 0.6, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisScrollSpeed: 0,
    angleGradient: new EditRgbGradient({
      uuid: "08517c9a-d86c-4f80-9696-e1d381a7faef",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.fromString("#5e3097") }),
        new RgbKf({ time: 0.45, color: Color.black }),
        new RgbKf({ time: 0.5, color: Color.fromString("#9f63a9") }),
        // new RgbKf({ time: 0.5, color: new Color(0.5, 0, 1) }),
        // new RgbKf({ time: 0.7, color: new Color(0.8, 0, 1) }),
        new RgbKf({ time: 0.55, color: Color.black }),
        new RgbKf({ time: 1.0, color: Color.fromString("#5e3097") }),
      ],
    }),
    angleScrollSpeed: 5.1415,
  }),

  waterBaseLayer: new AnimNormals({
    uuid: "c6b97f93-97af-4719-a16d-85d9e9c1b71f",
    name: "Water Base Layer",
    category: "animated",
    duration: 4.5,
    gradient: new EditRgbGradient({
      uuid: "0a0cfff0-928d-4137-a67a-9f5709152890",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.black }),
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.7, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      uuid: "b1f4f033-c785-4e54-8c7c-256dee06f52d",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.white }),
        new RgbKf({ time: 0.1, color: Color.brightWhite }),
        new RgbKf({ time: 0.2, color: Color.white }),
        new RgbKf({ time: 0.3, color: Color.brightWhite }),
        new RgbKf({ time: 0.4, color: Color.white }),
        new RgbKf({ time: 0.5, color: Color.brightWhite }),
        new RgbKf({ time: 0.6, color: Color.white }),
        new RgbKf({ time: 0.7, color: Color.brightWhite }),
        new RgbKf({ time: 0.8, color: Color.white }),
        new RgbKf({ time: 0.9, color: Color.brightWhite }),
        new RgbKf({ time: 1.0, color: Color.white }),
      ],
    }),
    axisScrollSpeed: 2,
    axisOffset: -1,
    axisScale: 1,
    angleGradient: new EditRgbGradient({
      uuid: "c4aed08c-1c79-48e8-b759-f030f278f679",
      keyframes: [
        new RgbKf({ time: 0.0, color: Color.fromString("#09aaed") }),
        new RgbKf({ time: 0.1, color: Color.fromString("#0945ee") }),
        new RgbKf({ time: 0.3, color: Color.fromString("#09aaed") }),
        new RgbKf({ time: 0.5, color: Color.fromString("#a2cffc") }),
        new RgbKf({ time: 0.8, color: Color.fromString("#0945ee") }),
        new RgbKf({ time: 1.0, color: Color.fromString("#09aaed") }),
      ],
    }),
    angleScrollSpeed: -1,
  }),
} as const;

export const PrebuildAnimationsExt = {
  rainbowFountainX3: new AnimSequence({
    uuid: "c9b03465-706a-436d-8ba8-760ee5dee678",
    name: "Rainbow Fountain X3",
    category: "animated",
    duration: 7,
    animations: [
      new SequenceItem(PrebuildAnimations.rainbowFountain, 0),
      new SequenceItem(PrebuildAnimations.rainbowFountain, 1.4),
      new SequenceItem(PrebuildAnimations.rainbowFountain, 2.8),
    ],
  }),

  spiralUpDown: new AnimSequence({
    uuid: "a8e9267a-fccf-4e6d-8fb1-3d9dddc32c5b",
    name: "Spiral Up and Down",
    category: "animated",
    duration: 7,
    animations: [
      new SequenceItem(PrebuildAnimations.spiralUp, 0),
      new SequenceItem(PrebuildAnimations.spiralDown, 0.7),
    ],
  }),

  spiralUpDownRainbow: new AnimSequence({
    uuid: "5e768705-fbf0-4f20-81b3-035f259d86ed",
    name: "Spiral Up and Down Rainbow",
    category: "animated",
    duration: 7,
    animations: [
      new SequenceItem(PrebuildAnimations.rainbowUp, 0),
      new SequenceItem(PrebuildAnimations.rainbowDown, 1.2),
    ],
  }),

  alternatingWhite_d20: new AnimSequence({
    uuid: "12bd0c13-d2c3-4837-87e5-2f7931e42d17",
    name: "Alternating White",
    category: "animated",
    duration: 7,
    dieType: "d20",
    animations: [
      new SequenceItem(
        new AnimFlashes({
          ...PrebuildAnimations.whiteFlash,
          uuid: "aa25f26b-f9cd-4ee5-9072-f09da1032a10",
          name: "Red Flash",
          color: new Color(1, 0.6, 0),
        }),
        0
      ),
      new SequenceItem(
        new AnimFlashes({
          ...PrebuildAnimations.alternatingWhite1_d20,
          uuid: "67953296-8061-46e9-9c49-96342bd7c295",
          name: "Alternate Red 1",
          color: new Color(1, 0.6, 0),
        }),
        0.15
      ),
      new SequenceItem(
        new AnimFlashes({
          ...PrebuildAnimations.alternatingWhite2_d20,
          uuid: "0b887a00-2654-4f60-aa4a-673629e4b875",
          name: "Alternate Red 2",
          color: new Color(1, 0, 0),
        }),
        0.15 +
          PrebuildAnimations.alternatingWhite1_d20.duration /
            (2 * PrebuildAnimations.alternatingWhite1_d20.count)
      ),
    ],
  }),

  noiseRainbowX2: new AnimSequence({
    uuid: "38c8e25b-aef0-4adb-bf0f-0f2c49ab84da",
    name: "Noise Rainbow X2",
    category: "flashy",
    duration: 7,
    animations: [
      new SequenceItem(
        new AnimFlashes({
          ...PrebuildAnimations.whiteFlash,
          uuid: "56d23423-6941-4e61-baac-f336e371896d",
          name: "Green Flash",
          color: Color.brightGreen,
          duration: 1,
        }),
        0
      ),
      new SequenceItem(PrebuildAnimations.noiseRainbow, 0),
      new SequenceItem(PrebuildAnimations.noiseRainbow, 2),
    ],
  }),

  fire: new AnimSequence({
    uuid: "25eaa157-d59c-41ab-8770-251e06643028",
    name: "Fire",
    category: "animated",
    duration: 7,
    animations: [
      new SequenceItem(PrebuildAnimations.fireBaseLayer, 0),
      new SequenceItem(PrebuildAnimations.fireNoiseLayer, 0),
    ],
  }),

  overlappingQuickReds: new AnimSequence({
    uuid: "2e0a5f5b-edb9-45e3-9c62-58db4d06d073",
    name: "Overlapping Quick Reds",
    category: "animated",
    duration: 2.5,
    animations: [
      new SequenceItem(PrebuildAnimations.reverseQuickRed, 0),
      new SequenceItem(
        new AnimNoise({
          ...PrebuildAnimations.whiteNoise,
          uuid: "5a229f05-25d9-4bd1-98e9-080f01fe5002",
          name: "Red Noise",
          gradient: new EditRgbGradient({
            uuid: "281f771a-4595-4d92-853c-1ca1c56178ec",
            keyframes: [new RgbKf({ time: 0.0, color: Color.brightRed })],
          }),
        }),
        0.5
      ),
    ],
  }),

  overlappingQuickGreens: new AnimSequence({
    uuid: "b9843f94-0d51-4833-9ddb-c4b3d111b043",
    name: "Overlapping Quick Greens",
    category: "animated",
    duration: 2.5,
    animations: [
      new SequenceItem(PrebuildAnimations.reverseQuickGreen, 0),
      new SequenceItem(PrebuildAnimations.reverseQuickGreen, 0.8),
      new SequenceItem(PrebuildAnimations.reverseQuickGreen, 1.6),
    ],
  }),

  roseToCurrentFace: new AnimSequence({
    uuid: "41f5a334-16b8-4167-a69f-bbbefccf4e42",
    name: "Rose to Current Face",
    category: "animated",
    duration: 2.5,
    animations: [
      new SequenceItem(
        new AnimFlashes({
          ...PrebuildAnimations.whiteFlash,
          uuid: "fd8befb3-aa06-412f-8114-7e14cd06cd47",
          name: "Long White Flash",
          duration: 1.4,
          fade: 1,
        }),
        0
      ),
      new SequenceItem(PrebuildAnimations.whiteRose, 0.5),
    ],
  }),

  doubleSpinningMagic: new AnimSequence({
    uuid: "b19d3448-2ec6-430f-80a6-22ea02de97b9",
    name: "Double Spinning Magic",
    category: "animated",
    duration: 2.5,
    animations: [
      new SequenceItem(PrebuildAnimations.spinningMagic, 0),
      //new SequenceItem(PrebuildAnimations.counterSpinningMagic, 0),
    ],
  }),

  waterSplash: new AnimSequence({
    uuid: "c570147c-bb62-450f-b3f7-60ed78a3e3ea",
    name: "Water Splash",
    category: "animated",
    duration: 2.5,
    animations: [
      new SequenceItem(PrebuildAnimations.waterWorm, 0),
      new SequenceItem(
        new AnimFlashes({
          ...PrebuildAnimations.whiteFlash,
          uuid: "83313332-6d9c-48b7-a2e6-190751183d85",
          name: "Long Blue Flash",
          duration: 2,
          color: Color.fromString("#a2cffc"),
        }),
        1
      ),
    ],
  }),
} as const;
