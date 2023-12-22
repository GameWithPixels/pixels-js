import { range } from "@systemic-games/pixels-core-utils";
import { THREE } from "expo-three";

import { MeshLine, MeshLineMaterial } from "./MeshLine";
import { UpdateArgs, UpdateCallback } from "./UpdateCallback";

export function addSparks(
  staging: THREE.Object3D,
  dieSize: number
): UpdateCallback[] {
  // Sparks particles
  const radius = 10;
  const sparks = createSparks({
    linesCount: 3,
    pointsCount: 5,
    colors: ["#c06995", "#de77c7", "#df86df", "#d998ee", "#ceadf4", "#c6bff9"],
    radius,
    speedMin: 1,
    speedMax: 5,
    thickness: 10,
    dashArray: 0.3,
    dashRatio: 0.5,
  });
  const sparksRoot = new THREE.Object3D();
  sparksRoot.scale.setScalar(0.09 * dieSize);
  const sparksOffset = new THREE.Object3D();
  sparksOffset.position.set(-radius / 2, -radius, 0);
  sparksRoot.add(sparksOffset);
  staging.add(sparksRoot);
  return sparks.map((spark) => {
    sparksOffset.add(spark.mesh);
    return spark.update;
  });
}

// https://varun.ca/three-js-particles/
// https://github.com/winkerVSbecks/3d-particle-effects-demo/blob/main/src/Scene.js
export function createSparks({
  linesCount,
  pointsCount,
  colors,
  radius,
  thickness,
  speedMin,
  speedMax,
  dashArray,
  dashRatio,
}: {
  linesCount: number;
  pointsCount: number;
  colors: string[];
  radius: number;
  thickness: number;
  speedMin: number;
  speedMax: number;
  dashArray: number;
  dashRatio: number;
}): {
  mesh: THREE.Mesh<MeshLine, THREE.ShaderMaterial>;
  update: UpdateCallback;
}[] {
  const radiusVariance = () => 0.2 + 0.8 * Math.random();
  const lines = range(linesCount).map((lineIndex) => {
    const pos = new THREE.Vector3(
      Math.sin(0) * radius * radiusVariance(),
      Math.cos(0) * radius * radiusVariance(),
      Math.sin(0) * Math.cos(0) * radius * radiusVariance()
    );
    const points = range(pointsCount).map((i) => {
      const angle = (i / pointsCount) * Math.PI * 2;
      return pos
        .add(
          new THREE.Vector3(
            Math.sin(angle) * radius * radiusVariance(),
            Math.cos(angle) * radius * radiusVariance(),
            Math.sin(angle) * Math.cos(angle) * radius * radiusVariance()
          )
        )
        .clone();
    });
    const curve = new THREE.CatmullRomCurve3(points).getPoints(100);
    return {
      color: colors[Math.floor(colors.length * Math.random())],
      width: ((lineIndex + 1) / linesCount / 1000) * thickness,
      speed: (speedMin + (speedMax - speedMin) * Math.random()) / 10000,
      curve,
    };
  });

  return lines.map(({ curve, width, color, speed }) => {
    const line = new MeshLine();
    line.setPoints(curve);
    const material = new MeshLineMaterial({
      transparent: true,
      depthTest: true,
      lineWidth: width,
      color: new THREE.Color(color),
      dashArray,
      dashRatio,
    }) as THREE.ShaderMaterial;
    return {
      mesh: new THREE.Mesh(line, material),
      update: ({ deltaTime }: UpdateArgs) =>
        (material.uniforms.dashOffset.value -= speed * deltaTime),
    };
  });
}
