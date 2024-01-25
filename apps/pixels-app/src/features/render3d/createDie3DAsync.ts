import {
  createTypedEventEmitter,
  assertNever,
} from "@systemic-games/pixels-core-utils";
import {
  PixelDieType,
  PixelColorway,
  DiceUtils,
} from "@systemic-games/react-native-pixels-connect";
import { Asset } from "expo-asset";
import { loadAsync, THREE } from "expo-three";

import "./readAsArrayBuffer";
import { ensureAssetReadableAsync } from "./ensureAssetReadableAsync";

import Die3D from "~/pixels-three/Die3D";

function getGlbAsset(dieType: PixelDieType): number {
  switch (dieType) {
    default:
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
  }
}

interface Die3DAssets {
  root: THREE.Object3D;
  faceNames: string[];
  size: THREE.Vector3;
  lights: THREE.Light[];
  envMap?: THREE.Texture;
}

const diceAssets = new Map<string, Die3DAssets | "loading" | Error>();
const dieLoadEvent = createTypedEventEmitter<{
  done: { result: Die3DAssets | Error; key: string };
}>();
// We may create a bunch of Die3D at once
dieLoadEvent.setMaxListeners(100);

const textures = new Map<string | number, THREE.Texture | "loading" | Error>();
const textureLoadEvent = createTypedEventEmitter<{
  done: { result: THREE.Texture | Error; key: string };
}>();
textureLoadEvent.setMaxListeners(100);

const materials = new Map<
  string,
  THREE.MeshPhysicalMaterial | "loading" | Error
>();
const materialLoadEvent = createTypedEventEmitter<{
  done: {
    result: THREE.MeshPhysicalMaterial | Error;
    key: string;
  };
}>();
materialLoadEvent.setMaxListeners(100);

async function loadTextureAsync(
  virtualAssetModule: string | number,
  textureName: string
): Promise<THREE.Texture> {
  const key = String(virtualAssetModule);
  const result = textures.get(key);
  if (result instanceof Error) {
    throw result;
  }
  if (typeof result === "object") {
    return result;
  }
  switch (result) {
    case undefined:
      textures.set(key, "loading");
      try {
        // Load texture
        const start = Date.now();
        const obj = await loadAsync(
          await ensureAssetReadableAsync(virtualAssetModule, textureName)
        );
        console.log(
          `loadMaterialAsync(): Texture for ${textureName} loaded in ${
            Date.now() - start
          }ms`
        );
        if (!obj) {
          throw new CreateDie3DError(
            `Failed to load die3d texture ${textureName}`
          );
        }
        const texture = obj as THREE.Texture;
        if (!texture.isTexture) {
          throw new CreateDie3DError(
            `Expected a texture for ${textureName} but got ${obj.type}`
          );
        }
        texture.flipY = false;
        textures.set(key, texture);
        textureLoadEvent.emit("done", { result: texture, key });
        return texture;
      } catch (error) {
        textures.set(key, error as Error);
        textureLoadEvent.emit("done", { result: error as Error, key });
        throw error;
      }
    case "loading":
      return new Promise<THREE.Texture>((resolve, reject) => {
        const listener = ({
          result,
          key: loadedKey,
        }: {
          result: THREE.Texture | Error;
          key: string;
        }) => {
          if (key === loadedKey) {
            textureLoadEvent.removeListener("done", listener);
            if (result instanceof Error) {
              reject(result);
            } else {
              resolve(result);
            }
          }
        };
        textureLoadEvent.addListener("done", listener);
      });
    default:
      assertNever(result, "Unexpected Die3D loading result");
  }
}

async function loadMaterialAsync(
  colorway: PixelColorway,
  pd6: boolean
): Promise<THREE.MeshPhysicalMaterial> {
  // Our load function
  const loadMatAsync = async (): Promise<THREE.MeshPhysicalMaterial> => {
    const start = Date.now();
    const material = new THREE.MeshPhysicalMaterial();
    material.color.setRGB(1, 1, 1);
    if (pd6) {
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
    }

    console.log(
      `loadMaterialAsync(): Material for ${colorway} loaded in ${
        Date.now() - start
      }ms`
    );

    return material;
  };

  const key = colorway + (pd6 ? "/pd6" : "");
  const result = materials.get(key);
  if (result instanceof Error) {
    throw result;
  }
  if (typeof result === "object") {
    return result;
  }
  switch (result) {
    case undefined:
      materials.set(key, "loading");
      try {
        // Load material
        const material = await loadMatAsync();
        materials.set(key, material);
        materialLoadEvent.emit("done", { result: material, key });
        return material;
      } catch (error) {
        materials.set(key, error as Error);
        materialLoadEvent.emit("done", { result: error as Error, key });
        throw error;
      }
    case "loading":
      return new Promise<THREE.MeshPhysicalMaterial>((resolve, reject) => {
        const listener = ({
          result,
          key: loadedKey,
        }: {
          result: THREE.MeshPhysicalMaterial | Error;
          key: string;
        }) => {
          if (key === loadedKey) {
            materialLoadEvent.removeListener("done", listener);
            if (result instanceof Error) {
              reject(result);
            } else {
              resolve(result);
            }
          }
        };
        materialLoadEvent.addListener("done", listener);
      });
    default:
      assertNever(result, "Unexpected Die3D loading result");
  }
}

async function loadAssetsAsync(
  dieType: PixelDieType,
  colorway: PixelColorway
): Promise<Die3DAssets> {
  if (colorway === "unknown") {
    console.warn(`loadAssetsAsync(): Unknown colorway for ${dieType}`);
    colorway = "onyxBlack";
  }

  // Load mesh
  const start = Date.now();

  // Use https://fabconvert.com/convert/fbx/to/glb to convert fbx files
  const gltf: { scene: THREE.Group } = await loadAsync(
    Asset.fromModule(getGlbAsset(dieType))
  );
  if (!gltf?.scene?.isGroup) {
    throw new CreateDie3DError(
      `GLTF scene for ${dieType}/${colorway} is not a group`
    );
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
      `GLTF scene for ${dieType}/${colorway} doesn't have a root object that is not a light`
    );
  }

  // Find face meshes
  const baseMeshes: THREE.Mesh[] = [];
  const faceMeshes: THREE.Mesh[] = [];
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      if (obj.name.toLocaleLowerCase().includes("face")) {
        faceMeshes.push(obj as THREE.Mesh);
      } else if (obj.name.toLocaleLowerCase().includes("base")) {
        baseMeshes.push(obj as THREE.Mesh);
      }
    }
  });

  // // Check face count
  // const faceCount = DiceUtils.getFaceCount(dieType);
  // if (faceMeshes.length !== faceCount) {
  //   throw new CreateDie3DError(
  //     `Mesh for ${dieType} has ${faceMeshes.length} face(s) instead of ${faceCount}`
  //   );
  // }

  // Get their names
  const faceNames: string[] = Array(DiceUtils.getFaceCount(dieType));
  if (dieType !== "d6pipped" && faceMeshes.length !== faceNames.length) {
    throw new CreateDie3DError(
      `Unexpected number of faces ${faceMeshes.length} instead of ${faceNames.length} for ${dieType}/${colorway}`
    );
  }
  faceMeshes.forEach((faceMesh, i) => {
    // Get face index
    const indexAsString = faceMesh.name
      .toLowerCase()
      .split("face")[1]
      .replace("_", "")
      .replace(".", "")
      .replace("mesh", "");
    // TODO pipped dice
    const isPipped = indexAsString.includes("led");
    const indexFromName = indexAsString?.length
      ? Number(isPipped ? indexAsString.substring(0, 1) : indexAsString)
      : NaN;
    let index = isNaN(indexFromName) ? i : indexFromName;
    if (dieType === "d00") {
      index /= 10;
    } else if (dieType !== "d10") {
      index -= 1;
    }
    if (isNaN(indexFromName)) {
      console.log(
        `loadAssetsAsync(): Face index not found in name, using node index ${index}`
      );
    }
    if (isNaN(index) || index < 0 || index >= faceNames.length) {
      throw new CreateDie3DError(
        `Out of bound face index ${index} for face ${faceMesh.name} of ${dieType}/${colorway}`
      );
    }
    if (!isPipped && faceNames[index]) {
      throw new CreateDie3DError(
        `Duplicate face index ${index} for ${dieType}/${colorway}`
      );
    }
    faceNames[index] = faceMesh.name;
  });

  // Update materials
  const mat = await loadMaterialAsync(colorway, dieType === "d6pipped");
  for (const mesh of faceMeshes.concat(baseMeshes)) {
    mesh.material = mat;
  }

  // Compute scale used to display die
  const aabb = new THREE.Box3();
  aabb.setFromObject(root);
  const size = aabb.getSize(new THREE.Vector3());

  console.log(
    `loadAssetsAsync(): Assets for ${dieType} loaded in ${Date.now() - start}ms`
  );

  return { root, faceNames, size, lights };
}

export interface DieSceneObjects {
  die3d: Die3D;
  lights: THREE.Light[];
  envMap?: THREE.Texture;
}

function instantiate(
  assets: Die3DAssets,
  dieType: PixelDieType,
  colorway: PixelColorway
): DieSceneObjects {
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
  const key = dieType + "/" + colorway;
  const result = diceAssets.get(key);
  if (result instanceof Error) {
    throw result;
  }
  if (typeof result === "object") {
    return instantiate(result, dieType, colorway);
  }
  switch (result) {
    case undefined:
      diceAssets.set(key, "loading");
      try {
        const assets = await loadAssetsAsync(dieType, colorway);
        diceAssets.set(key, assets);
        dieLoadEvent.emit("done", { result: assets, key });
        return instantiate(assets, dieType, colorway);
      } catch (error) {
        diceAssets.set(key, error as Error);
        dieLoadEvent.emit("done", { result: error as Error, key });
        throw error;
      }
    case "loading":
      return new Promise<DieSceneObjects>((resolve, reject) => {
        const listener = ({
          result,
          key: loadedKey,
        }: {
          result: Die3DAssets | Error;
          key: string;
        }) => {
          if (key === loadedKey) {
            dieLoadEvent.removeListener("done", listener);
            if (result instanceof Error) {
              reject(result);
            } else {
              resolve(instantiate(result, dieType, colorway));
            }
          }
        };
        dieLoadEvent.addListener("done", listener);
      });
    default:
      assertNever(result, "Unexpected Die3D loading result");
  }
}
