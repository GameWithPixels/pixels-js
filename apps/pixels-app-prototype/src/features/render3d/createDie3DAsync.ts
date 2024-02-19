import {
  assert,
  assertNever,
  createTypedEventEmitter,
} from "@systemic-games/pixels-core-utils";
import { Die3D } from "@systemic-games/pixels-three";
import {
  PixelDieType,
  DiceUtils,
} from "@systemic-games/react-native-pixels-connect";
import { Asset } from "expo-asset";
import { loadAsync, THREE } from "expo-three";

import "./readAsArrayBuffer";
import { ensureAssetReadableAsync } from "./ensureAssetReadableAsync";

function extractMeshesGeometry(
  gltf: { scene: THREE.Group },
  computeTangents = true
): THREE.BufferGeometry[] {
  // Get all meshes
  const meshes = Object.values(gltf.scene.children).filter(
    (obj) => (obj as THREE.Mesh).isMesh
  ) as THREE.Mesh[];
  // Clone geometry and reorder based on mesh name
  const faces: THREE.BufferGeometry[] = Array(meshes.length);
  const scale = new THREE.Vector3();
  meshes.forEach((mesh, i) => {
    // Clone geometry
    const geometry = mesh.geometry.clone();
    if (computeTangents && !geometry.hasAttribute("tangent")) {
      geometry.computeTangents();
    }
    const position = mesh.getWorldPosition(new THREE.Vector3());
    geometry.translate(position.x, position.y, position.z);
    mesh.getWorldScale(scale);
    geometry.scale(scale.x, scale.y, scale.z);
    // Get face index
    const indexAsString = mesh.name.split(/[_-\s]+/)[1];
    const indexFromName = indexAsString?.length ? Number(indexAsString) : NaN;
    const index = isNaN(indexFromName) ? i : indexFromName - 1;
    assert(
      !isNaN(index) && index >= 0 && index < meshes.length,
      `extractMeshesGeometry(): Out of bound face index ${index}`
    );
    assert(
      !faces[index],
      `extractMeshesGeometry(): Duplicate face index: ${index}`
    );
    faces[index] = geometry;
  });
  return faces;
}

function getGlbAsset(dieType: PixelDieType): number {
  switch (dieType) {
    default:
    case "d20":
      return require(`!/meshes/d20.glb`);
    case "d12":
      return require(`!/meshes/d12.glb`);
  }
}

function getFaceMapAssetAndName(dieType: PixelDieType): [number, string] {
  switch (dieType) {
    default:
    case "d20":
      return [
        require(`!/textures/d20-face-map.png`),
        "textures/d20-face-map.png",
      ];
    // case "d12":
    //   return [
    //     require(`!/textures/d12-face-map.png`),
    //     "textures/d12-face-map.png",
    //   ];
  }
}

let normalTex: THREE.Texture | undefined;
let faceTex: THREE.Texture | undefined;
let faceMeshes: THREE.BufferGeometry[] | undefined;
let scale = 0;

let status: "loading" | "loaded" | "error";
const doneEvent = createTypedEventEmitter<{ done: undefined }>();
// We may create a bunch of Die3D at once
doneEvent.setMaxListeners(100);

async function loadAssets(dieType: PixelDieType): Promise<void> {
  // Load textures
  if (!normalTex) {
    const asset = await ensureAssetReadableAsync(
      require("!/textures/plastic-normal.png"),
      "textures/plastic-normal.png"
    );
    normalTex = await loadAsync(asset);
    if (!normalTex) {
      throw new Error(`Failed to load ${dieType} normal texture`);
    }
  }

  if (!faceTex) {
    const asset = await ensureAssetReadableAsync(
      ...getFaceMapAssetAndName(dieType)
    );
    faceTex = await loadAsync(asset);
    if (!faceTex) {
      throw new Error(`Failed to load ${dieType} face texture`);
    }
  }

  // Load mesh
  if (!faceMeshes) {
    const start = Date.now();

    // Use https://fabconvert.com/convert/fbx/to/glb to convert fbx files
    const gltfModule = Asset.fromModule(getGlbAsset(dieType));
    const gltf = await loadAsync(gltfModule);

    console.log(`Mesh for ${dieType} loaded in ${Date.now() - start}ms`);

    // Extract faces
    faceMeshes = extractMeshesGeometry(gltf);

    // Compute scale used to display die
    const aabb = new THREE.Box3();
    aabb.setFromObject(gltf.scene);
    const v = new THREE.Vector3();
    scale = 42 / aabb.getSize(v).length();
  }

  // Check face count
  const faceCount = DiceUtils.getFaceCount(dieType);
  if (faceMeshes.length !== faceCount) {
    throw new Error(
      `Mesh for ${dieType} has ${faceMeshes.length} faces instead of ${faceCount}`
    );
  }
}

const instantiate = () =>
  new Die3D(faceMeshes!, normalTex!, faceTex!, { scale });
const error = () =>
  new Error("Failed to load some Die3D asset, see previous errors");

export async function createDie3DAsync(dieType: PixelDieType): Promise<Die3D> {
  switch (status) {
    case undefined:
      status = "loading";
      try {
        await loadAssets(dieType);
        status = "loaded";
        doneEvent.emit("done", undefined);
        return instantiate();
      } catch (error) {
        status = "error";
        doneEvent.emit("done", undefined);
        throw error;
      }
    case "loading":
      return new Promise<Die3D>((resolve, reject) => {
        const listener = () => {
          doneEvent.removeListener("done", listener);
          if (status === "loaded") {
            resolve(instantiate());
          } else {
            reject(error());
          }
        };
        doneEvent.addListener("done", listener);
      });
    case "loaded":
      return instantiate();
    case "error":
      throw error();
    default:
      assertNever(status, "Unexpected Die3D load status");
  }
}
