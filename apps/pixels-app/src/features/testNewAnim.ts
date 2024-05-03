import {
  Firmware as FW,
  Pixel,
} from "@systemic-games/react-native-pixels-connect";

// Notes:
// Check byte values >= 0 and <= 255
// Anim Simple => Flash
// Missing scalar type u32
// Add condition rolled
// Rainbow anim duration should be total including count

async function programProfile(pixel: Pixel): Promise<void> {
  const builder = new FW.ProfileBuilder();

  // Create the global that indicates the current face
  const currentFaceScalar = builder.addGlobal("normalizedCurrentFace");
  const rainbowGradient = builder.addRainbow();
  const lookupGradientFromFace = builder.addLookup(
    rainbowGradient,
    currentFaceScalar
  );

  // Some colors
  const redColor = builder.addRGB(8, 0, 0);
  const greenColor = builder.addRGB(0, 8, 0);
  const blueColor = builder.addRGB(0, 0, 16);
  const yellowColor = builder.addRGB(6, 6, 0);

  // Hello animation
  const animationRainbow = builder.addAnimRainbow(3000, { count: 3 });

  // Roll animations
  const animationHandling = builder.addAnimSimple(
    1000,
    lookupGradientFromFace,
    {
      fade: 255,
      animFlags: ["highestLed"],
      colorFlags: ["captureColor"],
    }
  );
  const animationRolling = builder.addAnimSimple(500, lookupGradientFromFace, {
    fade: 255,
    animFlags: ["highestLed"],
    colorFlags: ["captureColor"],
  });
  const animationOnFace = builder.addAnimSimple(3000, lookupGradientFromFace, {
    fade: 255,
    colorFlags: ["captureColor"],
  });

  // Battery & temp animations
  const animationCharging = builder.addAnimSimple(3000, redColor, {
    fade: 255,
    animFlags: ["highestLed"],
  });
  const animationLowBattery = builder.addAnimSimple(1500, redColor, {
    count: 3,
    fade: 255,
  });
  const animationChargingProblem = builder.addAnimSimple(2000, redColor, {
    count: 10,
    fade: 255,
    animFlags: ["highestLed"],
  });
  const animationFullyCharged = builder.addAnimSimple(10000, greenColor, {
    fade: 32,
    animFlags: ["highestLed"],
  });
  const animationConnection = builder.addAnimSimple(1000, blueColor, {
    fade: 255,
  });
  const animationTempError = builder.addAnimSimple(1000, yellowColor, {
    count: 3,
    fade: 255,
    animFlags: ["highestLed"],
  });

  // Rules
  builder.addRule(
    builder.addCondHello(["hello"]),
    builder.addPlayAnimActionAsArray(animationRainbow)
  );
  builder.addRule(
    builder.addCondHandling(),
    builder.addPlayAnimActionAsArray(
      animationHandling,
      FW.FACE_INDEX_CURRENT_FACE
    )
  );
  builder.addRule(
    builder.addCondRolling(500),
    builder.addPlayAnimActionAsArray(
      animationRolling,
      FW.FACE_INDEX_CURRENT_FACE
    )
  );
  builder.addRule(
    builder.addCondFace(["equal", "greater"], 0),
    builder.addPlayAnimActionAsArray(animationOnFace)
  );
  builder.addRule(
    builder.addCondBatt(["charging"], 5000),
    builder.addPlayAnimActionAsArray(animationCharging)
  );
  builder.addRule(
    builder.addCondBatt(["badCharging"], 0),
    builder.addPlayAnimActionAsArray(animationChargingProblem)
  );
  builder.addRule(
    builder.addCondBatt(["low"], 30000),
    builder.addPlayAnimActionAsArray(animationLowBattery)
  );
  builder.addRule(
    builder.addCondBatt(["done"], 5000),
    builder.addPlayAnimActionAsArray(animationFullyCharged)
  );
  builder.addRule(
    builder.addCondConn(["connected", "disconnected"]),
    builder.addPlayAnimActionAsArray(animationConnection)
  );
  builder.addRule(
    builder.addCondBatt(["error"], 1500),
    builder.addPlayAnimActionAsArray(animationTempError)
  );

  // Program the profile
  await pixel.programProfile(builder, (p: number) =>
    console.log("Transfer: " + p)
  );
}

export async function testNewAnim(pixel: Pixel): Promise<void> {
  try {
    await programProfile(pixel);
  } catch (error) {
    console.log(`Error: ${error}`);
  }
}
