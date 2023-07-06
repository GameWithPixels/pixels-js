import {
  assert,
  assertNever,
  createTypedEventEmitter,
} from "@systemic-games/pixels-core-utils";
import { Die3D } from "@systemic-games/pixels-three";
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
  meshes.forEach((mesh, i) => {
    // Clone geometry
    const geometry = mesh.geometry.clone();
    if (computeTangents && !geometry.hasAttribute("tangent")) {
      geometry.computeTangents();
    }
    const position = mesh.getWorldPosition(new THREE.Vector3());
    geometry.translate(position.x, position.y, position.z);
    // Get face index
    const indexFromName = Number(mesh.name.split("_")[1]);
    const index = isNaN(indexFromName) ? i : indexFromName - 1;
    assert(
      !isNaN(index) && index >= 0 && index < meshes.length,
      `extractMeshesGeometry(): Out of bound face index: ${index}`
    );
    assert(
      !faces[index],
      `extractMeshesGeometry(): Duplicate face index: ${index}`
    );
    faces[index] = geometry;
  });
  return faces;
}

let normalTex: THREE.Texture | undefined;
let faceTex: THREE.Texture | undefined;
let faceMeshes: THREE.BufferGeometry[] | undefined;

let status: "loading" | "loaded" | "error";
const doneEvent = createTypedEventEmitter<{ done: undefined }>();
// We may create a bunch of Die3D at once
doneEvent.setMaxListeners(0);

async function loadAssets(): Promise<void> {
  // Load textures
  if (!normalTex) {
    const asset = await ensureAssetReadableAsync(
      require("!/textures/plastic-normal.png"),
      "textures/plastic-normal.png"
    );
    normalTex = await loadAsync(asset);
    if (!normalTex) {
      throw new Error("Failed to load D20 normal texture");
    }
  }

  if (!faceTex) {
    const asset = await ensureAssetReadableAsync(
      require("!/textures/d20-face-map.png"),
      "textures/d20-face-map.png"
    );
    faceTex = await loadAsync(asset);
    if (!faceTex) {
      throw new Error("Failed to load D20 face texture");
    }
  }

  // Load mesh
  if (!faceMeshes) {
    const start = Date.now();

    // Use https://fabconvert.com/convert/fbx/to/glb to convert fbx files
    const gltfModule = Asset.fromModule(require("!/meshes/d20.glb"));
    const gltf = await loadAsync(gltfModule);

    console.log(`D20 mesh loaded in ${Date.now() - start}ms`);

    // Extract faces
    faceMeshes = extractMeshesGeometry(gltf);
  }

  if (faceMeshes.length !== 20) {
    throw new Error(
      `D20 mesh was found with ${faceMeshes.length} faces instead of 20`
    );
  }
}

const instantiate = () => new Die3D(faceMeshes!, normalTex!, faceTex!);
const error = () =>
  new Error("Failed to load some Die3D asset, see previous errors");

export async function createDie3DAsync(): Promise<Die3D> {
  switch (status) {
    case undefined:
      status = "loading";
      try {
        await loadAssets();
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
