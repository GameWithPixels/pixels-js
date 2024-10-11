import { assertNever } from "@systemic-games/pixels-core-utils";
import {
  PixelDieType,
  PixelColorway,
  DiceUtils,
} from "@systemic-games/react-native-pixels-connect";
import { Asset } from "expo-asset";
import { loadAsync, THREE } from "expo-three";

import "./readAsArrayBuffer";
import { CachedAssetLoader } from "./CachedLoader";
import { ensureAssetReadableAsync } from "./ensureAssetReadableAsync";

import Die3D from "~/pixels-three/Die3D";

function log(funcName: string, msg: string): void {
  __DEV__ && console.log(`${funcName}(): ${msg}`);
}

function warn(funcName: string, msg: string): void {
  __DEV__ && console.warn(`${funcName}(): ${msg}`);
}

function getGlbAsset(dieType: Exclude<PixelDieType, "unknown">): number {
  switch (dieType) {
    case "d20":
      return require(`#/meshes/dice/d20.glb`);
    case "d12":
      return require(`#/meshes/dice/d12.glb`);
    case "d10":
      return require(`#/meshes/dice/d10.glb`);
    case "d00":
      return require(`#/meshes/dice/d00.glb`);
    case "d8":
      return require(`#/meshes/dice/d8.glb`);
    case "d6":
      return require(`#/meshes/dice/d6.glb`);
    case "d6pipped":
      return require(`#/meshes/dice/d6pipped.glb`);
    case "d6fudge":
      return require(`#/meshes/dice/d6fudge.glb`);
    case "d4":
      return require(`#/meshes/dice/d4.glb`);
    default:
      assertNever(dieType, "Unexpected GLB asset die type " + dieType);
  }
}

interface Die3DAssets {
  root: THREE.Object3D;
  faceNames: string[];
  size: THREE.Vector3;
  lights: THREE.Light[];
  envMap?: THREE.Texture;
}

const texturesLoader = new CachedAssetLoader<
  THREE.Texture,
  {
    virtualAssetModule: string | number;
    textureName: string;
  }
>(
  async ({ virtualAssetModule, textureName }) => {
    const start = Date.now();
    // Load texture
    const obj = await loadAsync(
      await ensureAssetReadableAsync(virtualAssetModule, textureName)
    );
    if (!obj) {
      throw new CreateDie3DError(`Failed to load die3d texture ${textureName}`);
    }
    const texture = obj as THREE.Texture;
    if (!texture.isTexture) {
      throw new CreateDie3DError(
        `Expected a texture for ${textureName} but got ${obj.type}`
      );
    }
    texture.flipY = false;
    log(
      "loadTextureAsync",
      `Texture for ${textureName} loaded in ${Date.now() - start}ms`
    );
    return texture;
  },
  ({ virtualAssetModule }) => String(virtualAssetModule)
);

function loadTextureAsync(
  virtualAssetModule: string | number,
  textureName: string
): Promise<THREE.Texture> {
  return texturesLoader.loadAsync({
    virtualAssetModule,
    textureName,
  });
}

const materialsLoader = new CachedAssetLoader<
  THREE.MeshPhysicalMaterial,
  {
    colorway: Exclude<PixelColorway, "unknown" | "custom">;
    isPD6: boolean;
  }
>(
  async ({ colorway, isPD6 }) => {
    const start = Date.now();
    // Create material
    const material = new THREE.MeshPhysicalMaterial();
    material.color.setRGB(1, 1, 1);
    if (isPD6) {
      material.emissiveMap = await loadTextureAsync(
        require("#/textures/dice/pd6-emissive.png"),
        "textures/pd6-emissive.png"
      );
    } else {
      material.emissiveMap = await loadTextureAsync(
        require("#/textures/dice/emissive.png"),
        "textures/emissive.png"
      );
    }
    material.emissiveIntensity = 2;
    material.reflectivity = 0.5;
    material.roughness = 1.0;
    material.metalness = 0.5;
    material.clearcoat = 1;
    material.clearcoatRoughness = 1;
    material.iridescence = 1;
    material.iridescenceIOR = 2.5;
    material.iridescenceThicknessRange = [100, 400];
    material.sheen = 0.2;
    material.sheenRoughness = 0.5;
    material.sheenColor.setRGB(100 / 255, 10 / 255, 150 / 255);
    material.transmission = 0;
    material.attenuationColor.setRGB(1, 1, 1);
    material.thickness = 0;
    material.normalMap = await loadTextureAsync(
      require("#/textures/dice/normals.png"),
      "textures/normals.png"
    );
    if (colorway !== "onyxBlack" && colorway !== "clear") {
      material.roughnessMap = await loadTextureAsync(
        require("#/textures/dice/roughness.png"),
        "textures/roughness.png"
      );
      material.iridescenceMap = await loadTextureAsync(
        require("#/textures/dice/iridescence.png"),
        "textures/iridescence.png"
      );
    }
    material.envMap = await loadTextureAsync(
      require("#/textures/dice/environment.png"),
      "textures/environment.png"
    );
    material.envMap.mapping = THREE.EquirectangularReflectionMapping;
    material.envMapIntensity = 1;
    material.transparent = false;
    material.depthWrite = true;

    switch (colorway) {
      case "auroraSky":
      case "whiteAurora":
        material.map = await loadTextureAsync(
          require("#/textures/dice/aurora-sky-base.png"),
          "textures/aurora-sky-base.png"
        );
        material.roughness = 1;
        material.metalness = 0.5;
        material.reflectivity = 0.2;
        material.metalnessMap = await loadTextureAsync(
          require("#/textures/dice/aurora-sky-metalness.png"),
          "textures/aurora-sky-metalness.png"
        );
        material.clearcoatRoughness = 0;
        material.sheenRoughness = 1;
        material.transparent = true;
        material.opacity = 0.7;
        material.side = THREE.DoubleSide;
        break;
      case "midnightGalaxy":
        material.map = await loadTextureAsync(
          require("#/textures/dice/midnight-galaxy-base.png"),
          "textures/midnight-galaxy-base.png"
        );
        material.metalnessMap = await loadTextureAsync(
          require("#/textures/dice/midnight-galaxy-metalness.png"),
          "textures/midnight-galaxy-metalness.png"
        );
        material.metalness = 1.0;
        material.clearcoat = 0.2;
        material.clearcoatRoughness = 0;
        material.sheen = 0;
        material.transparent = true;
        material.opacity = 0.85;
        material.side = THREE.DoubleSide;
        break;
      case "hematiteGrey":
        material.map = await loadTextureAsync(
          require("#/textures/dice/hematite-grey-base.png"),
          "textures/hematite-grey-base.png"
        );
        material.metalnessMap = await loadTextureAsync(
          require("#/textures/dice/metalness.png"),
          "textures/metalness.png"
        );
        break;
      case "onyxBlack":
        material.map = await loadTextureAsync(
          require("#/textures/dice/onyx-black-base.png"),
          "textures/onyx-black-base.png"
        );
        material.reflectivity = 0.0;
        material.roughness = 0.5;
        material.metalness = 0.15;
        material.clearcoat = 0.1;
        material.normalMap = null;
        material.iridescence = 0.1;
        material.sheen = 0;
        break;
      case "clear":
        material.map = await loadTextureAsync(
          require("#/textures/dice/clear-base.png"),
          "textures/clear-base.png"
        );
        material.alphaMap = await loadTextureAsync(
          require("#/textures/dice/clear-alpha.png"),
          "textures/clear-alpha.png"
        );
        material.reflectivity = 0.0;
        material.roughness = 0.12;
        material.metalness = 1;
        material.clearcoat = 1;
        material.clearcoatRoughness = 0;
        material.normalMap = null;
        material.metalnessMap = await loadTextureAsync(
          require("#/textures/dice/clear-metalness.png"),
          "textures/clear-metalness.png"
        );
        material.iridescence = 0.0;
        material.sheen = 1;
        material.sheenRoughness = 0.1;
        material.sheenColor.setRGB(0.5, 0.5, 0.5);
        material.envMapIntensity = 2;
        material.transparent = true;
        material.side = THREE.DoubleSide;
        break;
      default:
        assertNever(colorway, "Unexpected material colorway " + colorway);
    }

    log(
      "loadMaterialAsync",
      `Material for ${colorway} loaded in ${Date.now() - start}ms`
    );

    return material;
  },
  ({ colorway, isPD6 }) => colorway + (isPD6 ? "/pd6" : "")
);

function loadMaterialAsync(
  colorway: PixelColorway,
  isPD6: boolean
): Promise<THREE.MeshPhysicalMaterial> {
  if (colorway === "unknown" || colorway === "custom") {
    warn(
      "loadMaterialAsync",
      `Got ${colorway} colorway, defaulting to Onyx Black`
    );
    colorway = "onyxBlack";
  }
  return materialsLoader.loadAsync({ colorway, isPD6 });
}

const rawAssetsLoader = new CachedAssetLoader<
  Die3DAssets,
  Exclude<PixelDieType, "unknown">
>(
  async (dieType) => {
    const start = Date.now();
    // Load mesh from GLB file
    // Use https://fabconvert.com/convert/fbx/to/glb to convert fbx files
    const gltf: { scene: THREE.Group } = await loadAsync(
      Asset.fromModule(getGlbAsset(dieType))
    );
    if (!gltf?.scene?.isGroup) {
      throw new CreateDie3DError(`GLTF scene for ${dieType} is not a group`);
    }

    // Get lights
    const lights = gltf.scene.children.filter(
      (obj) => (obj as THREE.Light).isLight
    ) as THREE.Light[];

    // Fix lights
    lights.forEach((l, i) => {
      l.intensity = 2;
      // Color values from ThreeJS JSON scene file
      switch (i) {
        case 0:
          l.color.setRGB(214 / 255, 243 / 255, 245 / 255);
          break;
        case 1:
          l.color.setRGB(230 / 255, 178 / 255, 178 / 255);
          break;
        case 2:
          l.color.setRGB(238 / 255, 236 / 255, 206 / 255);
          break;
      }
    });

    // Get die3d root object
    const objects = gltf.scene.children.filter(
      (obj) => !(lights as THREE.Object3D[]).includes(obj)
    );
    const root = objects.length === 1 ? objects[0] : gltf.scene;
    if (!root?.isObject3D) {
      throw new CreateDie3DError(
        `GLTF scene for ${dieType} doesn't have a root object that is not a light`
      );
    }

    // Find face meshes
    const faceMeshes: THREE.Mesh[] = [];
    root.traverse((obj) => {
      if (
        obj instanceof THREE.Mesh &&
        obj.name.toLocaleLowerCase().includes("face")
      ) {
        faceMeshes.push(obj);
      }
    });

    // Check face count
    const isPD6 = dieType === "d6pipped";
    const faceCount = isPD6
      ? DiceUtils.getLEDCount(dieType)
      : DiceUtils.getFaceCount(dieType);
    if (faceMeshes.length !== faceCount) {
      throw new CreateDie3DError(
        `Mesh for ${dieType} has ${faceMeshes.length} faces instead of ${faceCount}`
      );
    }

    // Get their names
    const faceNames: string[] = Array(DiceUtils.getFaceCount(dieType));
    faceMeshes.forEach((faceMesh, i) => {
      // Get face index
      const indexAsString = faceMesh.name
        .toLowerCase()
        .split("face")[1]
        .split("mesh")[0]
        .split("led")[0];
      const indexFromName = indexAsString?.length ? Number(indexAsString) : NaN;
      if (isNaN(indexFromName)) {
        log(
          "loadMeshAsync",
          `Face index not found in ${faceMesh.name}, using node index ${i}`
        );
      }
      const index = isNaN(indexFromName)
        ? i
        : DiceUtils.indexFromFace(indexFromName, dieType);
      if (index < 0 || index >= faceNames.length) {
        throw new CreateDie3DError(
          `Out of bound face index ${index} for face ${faceMesh.name} of ${dieType}`
        );
      }
      // TODO pipped dice
      if (!isPD6 && faceNames[index]) {
        throw new CreateDie3DError(
          `Duplicate face index ${index} for ${dieType}`
        );
      }
      faceNames[index] = faceMesh.name;
    });

    // Compute scale used to display die
    const aabb = new THREE.Box3();
    aabb.setFromObject(root);
    const size = aabb.getSize(new THREE.Vector3());

    log(
      "loadMeshAsync",
      `Assets for ${dieType} loaded in ${Date.now() - start}ms`
    );

    return { root, faceNames, size, lights };
  },
  (dieType) => dieType
);

function loadMeshAsync(dieType: PixelDieType): Promise<Die3DAssets> {
  if (dieType === "unknown") {
    warn("loadMeshAsync", `Got die type ${dieType}, defaulting to D20`);
    dieType = "d20";
  }

  return rawAssetsLoader.loadAsync(dieType);
}

const assetsLoader = new CachedAssetLoader<
  Die3DAssets,
  {
    dieType: PixelDieType;
    colorway: PixelColorway;
  }
>(
  async ({ dieType, colorway }) => {
    // Load mesh and material
    const assets = await loadMeshAsync(dieType);
    const material = await loadMaterialAsync(colorway, dieType === "d6pipped");
    const root = assets.root.clone();
    // Update materials
    root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const name = obj.name.toLocaleLowerCase();
        if (name.includes("face") || name.includes("base")) {
          obj.material = material;
        }
      }
    });
    // Return updated asset
    return { ...assets, root };
  },
  ({ dieType, colorway }) => dieType + "/" + colorway
);

export interface DieSceneObjects {
  die3d: Die3D;
  lights: THREE.Light[];
  envMap?: THREE.Texture;
}

export class CreateDie3DError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CreateDie3DError";
  }
}

export async function createDie3DAsync(
  dieType: PixelDieType,
  colorway: PixelColorway
): Promise<DieSceneObjects> {
  const assets = await assetsLoader.loadAsync({ dieType, colorway });
  return {
    die3d: new Die3D(
      assets.root,
      assets.faceNames,
      assets.size,
      dieType,
      colorway
    ),
    lights: assets.lights?.map((l) => l.clone()),
    envMap: assets.envMap,
  };
}
