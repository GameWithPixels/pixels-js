import { Die3D } from "@systemic-games/pixels-three";
import { Asset } from "expo-asset";
import { loadAsync, THREE } from "expo-three";

import "./readAsArrayBuffer";
import ensureAssetReadable from "./ensureAssetReadable";

function extractMeshesGeometry(
  gltf: { scene: THREE.Group },
  computeTangents = true
): THREE.BufferGeometry[] {
  const meshes = Object.values(gltf.scene.children).filter(
    (obj) => (obj as THREE.Mesh).isMesh
  ) as THREE.Mesh[];
  return meshes.map((mesh) => {
    const geometry = mesh.geometry.clone();
    if (computeTangents && !geometry.hasAttribute("tangent")) {
      geometry.computeTangents();
    }
    const position = mesh.getWorldPosition(new THREE.Vector3());
    geometry.translate(position.x, position.y, position.z);
    return geometry;
  });
}

let normalTex: THREE.Texture | undefined;
let faceTex: THREE.Texture | undefined;
let faceMeshes: THREE.BufferGeometry[] | undefined;

export default async function (): Promise<Die3D> {
  // Load textures
  if (!normalTex) {
    const asset = await ensureAssetReadable(
      require("~/../assets/textures/plastic-normal.png"),
      "textures/plastic-normal.png"
    );
    normalTex = await loadAsync(asset);
  }

  if (!faceTex) {
    const asset = await ensureAssetReadable(
      require("~/../assets/textures/d20-face-map.png"),
      "textures/d20-face-map.png"
    );
    faceTex = await loadAsync(asset);
  }

  // Load mesh
  if (!faceMeshes) {
    const start = Date.now();

    // Use https://fabconvert.com/convert/fbx/to/glb to convert fbx files
    const gltfModule = Asset.fromModule(require("~/../assets/meshes/d20.glb"));
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
  if (!normalTex) {
    throw new Error("Failed to load D20 normal texture");
  }
  if (!faceTex) {
    throw new Error("Failed to load D20 face texture");
  }
  return new Die3D(faceMeshes, normalTex, faceTex);
}
