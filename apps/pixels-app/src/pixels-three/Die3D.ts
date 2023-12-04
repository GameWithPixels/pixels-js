import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/pixels-core-connect";
import * as THREE from "three";

export default class Die3D extends THREE.Object3D {
  private readonly _size: THREE.Vector3;
  private readonly _materials: THREE.MeshStandardMaterial[] = [];
  private readonly _lights: THREE.PointLight[] = [];

  get faceCount(): number {
    return this._materials.length;
  }

  get size(): Readonly<THREE.Vector3> {
    return this._size;
  }

  readonly dieType: PixelDieType;
  readonly colorway: PixelColorway;

  constructor(
    root: THREE.Object3D,
    faceNames: string[],
    size: THREE.Vector3,
    dieType: PixelDieType,
    colorway: PixelColorway,
    opt?: {
      color?: THREE.Color;
      createLights?: boolean;
      lightIntensity?: number;
    }
  ) {
    super();
    this._size = size.clone();
    this.dieType = dieType;
    this.colorway = colorway;

    this.add(root.clone());

    // Find all the materials
    for (const name of faceNames) {
      const mesh = this.getObjectByName(name) as THREE.Mesh;
      if (!mesh.isMesh) {
        throw new Error(`Cannot find mesh ${name}`);
      }
      const material = mesh.material;
      if (!material || Array.isArray(material)) {
        throw new Error(`Mesh ${name} material is not a single material`);
      }
      if (!(material instanceof THREE.MeshStandardMaterial)) {
        throw new Error(`Mesh ${name} material is not a MeshStandardMaterial`);
      }

      // Clone material so we can change emissive color on each face separately
      const clone = material.clone() as THREE.MeshStandardMaterial;
      mesh.material = clone;
      this._materials.push(clone);

      if (opt?.createLights) {
        const lightIntensity = opt?.lightIntensity ?? 7;
        const geometry = mesh.geometry;
        if (!geometry.boundingSphere) {
          geometry.computeBoundingSphere();
        }
        const light = new THREE.PointLight(0, lightIntensity, 7);
        const bounds = geometry.boundingSphere;
        if (!bounds) {
          throw new Error("Couldn't compute face geometry bounding sphere");
        }
        light.position.copy(bounds.center);
        // light.position.multiplyScalar(scale);
        this.add(light);

        this._lights.push(light);
      }
    }
  }

  dispose(): void {
    this._lights.forEach((l) => l.dispose());
    this._lights.length = 0;
    this._materials.forEach((m) => m.dispose());
    this._materials.length = 0;
  }

  getLEDColor(index: number): THREE.Color {
    this._checkLEDIndex(index);
    return this._materials[index].emissive.clone();
  }

  setLEDColor(index: number, color: THREE.Color | number): void {
    this._checkLEDIndex(index);
    const c = typeof color === "number" ? new THREE.Color(color) : color;
    this._setColor(index, c);
  }

  clearLEDs(): void {
    const c = new THREE.Color(0, 0, 0);
    for (let i = 0; i < this.faceCount; ++i) {
      this._setColor(i, c);
    }
  }

  private _checkLEDIndex(index: number) {
    if (index < 0 || index >= this._materials.length) {
      throw new Error(`Out of range LED index: ${index}`);
    }
  }

  private _setColor(index: number, color: THREE.Color): void {
    this._materials[index].emissive.copy(color);
    if (this._lights.length) {
      this._lights[index].color.copy(color);
    }
  }
}
