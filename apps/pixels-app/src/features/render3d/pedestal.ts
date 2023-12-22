import { THREE } from "expo-three";

export function addPedestal(root: THREE.Object3D, scale = 1): void {
  const makeRing = (
    r0: number,
    r1: number,
    x?: number,
    y?: number,
    thetaStart?: number,
    thetaEnd?: number
  ) => {
    const geometry = new THREE.RingGeometry(
      scale * r0,
      scale * r1,
      r0 > 9 ? 64 : 32,
      1,
      thetaStart,
      thetaEnd
    );
    const material = new THREE.MeshBasicMaterial({
      color: 0x29a057,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x ? scale * x : 0, -6 * scale, y ? scale * y : 0);
    mesh.rotateX(Math.PI / 2);
    root.add(mesh);
  };
  makeRing(3, 4);
  makeRing(5.8, 5.9);
  makeRing(6.1, 6.2);
  makeRing(9.8, 10);
  makeRing(10.5, 11.5);
  makeRing(13, 14);
  makeRing(14.5, 14.7);
  for (let i = 0; i < 12; i++) {
    const r = 12.25;
    makeRing(
      0.5,
      1,
      r * Math.cos((i * Math.PI) / 6),
      r * Math.sin((i * Math.PI) / 6)
    );
  }
  for (let i = 0; i < 6; i++) {
    const r = 6;
    makeRing(
      1,
      1.5,
      r * Math.cos((i * Math.PI) / 3),
      r * Math.sin((i * Math.PI) / 3)
    );
  }
  for (let i = 0; i < 6; i++) {
    const r = 10;
    makeRing(
      3,
      3.2,
      r * Math.cos((i * Math.PI) / 3),
      r * Math.sin((i * Math.PI) / 3),
      (i * Math.PI) / 3 + Math.PI / 2,
      Math.PI
    );
  }
}
