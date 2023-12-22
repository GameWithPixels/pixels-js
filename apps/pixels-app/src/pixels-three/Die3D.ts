import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";
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
    const material = this._materials[index];
    return material ? material.emissive.clone() : new THREE.Color(0);
  }

  setLEDColor(index: number, color: THREE.Color | number): void {
    const c = typeof color === "number" ? new THREE.Color(color) : color;
    this._setColor(index, c);
  }

  clearLEDs(): void {
    const c = new THREE.Color(0);
    for (let i = 0; i < this.faceCount; ++i) {
      this._setColor(i, c);
    }
  }

  private _setColor(index: number, color: THREE.Color): void {
    const material = this._materials[index];
    if (material) {
      material.emissive.copy(color);
    }
    const light = this._lights[index];
    if (light) {
      light.color.copy(color);
    }
  }
}
