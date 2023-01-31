import * as THREE from "three";

import DieStandardMaterial from "./DieStandardMaterial";

const meshScale = 1000;
const lightIntensity = 7;

export default class Die3D extends THREE.Object3D {
  private readonly _materials: DieStandardMaterial[] = [];
  private readonly _lights: THREE.PointLight[] = [];

  get faceCount(): number {
    return this._materials.length;
  }

  constructor(
    facesGeometry: THREE.BufferGeometry[],
    normalMap: THREE.Texture,
    faceMap: THREE.Texture,
    options?: {
      createLights?: boolean;
    }
  ) {
    super();
    facesGeometry.forEach((geometry) => {
      const mat = new DieStandardMaterial(
        normalMap,
        faceMap,
        10 * lightIntensity
      );
      this._materials.push(mat);

      const meshCopy = new THREE.Mesh(geometry, mat);
      meshCopy.scale.setScalar(meshScale);
      this.add(meshCopy);

      if (options?.createLights) {
        if (!geometry.boundingSphere) {
          geometry.computeBoundingSphere();
        }
        const light = new THREE.PointLight(0, lightIntensity, 7);
        const bounds = geometry.boundingSphere;
        if (!bounds) {
          throw new Error("Couldn't compute face geometry bounding sphere");
        }
        light.position.copy(bounds.center);
        light.position.multiplyScalar(meshScale);
        this.add(light);

        this._lights.push(light);
      }
    });
  }

  getLEDColor(index: number): THREE.Color {
    if (index < 0 || index >= this._materials.length) {
      throw new Error(`Out of range LED index: ${index}`);
    }
    return this._materials[index].emissive.clone();
  }

  setLEDColor(index: number, color: THREE.Color | number): void {
    if (index < 0 || index >= this._materials.length) {
      throw new Error(`Out of range LED index: ${index}`);
    }
    const colorHex = typeof color === "number" ? color : color.getHex();
    this._setColor(index, colorHex);
  }

  clearLEDs(): void {
    for (let i = 0; i < this.faceCount; ++i) {
      this._setColor(i, 0);
    }
  }

  _setColor(index: number, colorHex: number): void {
    this._materials[index].emissive.setHex(colorHex);
    if (this._lights.length) {
      this._lights[index].color.setHex(colorHex);
    }
  }
}
