import { range } from "@systemic-games/pixels-core-utils";
import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";
import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import { Renderer, THREE } from "expo-three";
import React from "react";
import { useErrorBoundary } from "react-error-boundary";
import { Platform } from "react-native";
import { Text } from "react-native-paper";

import { MeshLine, MeshLineMaterial } from "./MeshLine";
import { createDie3DAsync } from "./createDie3DAsync";

import Die3D from "~/pixels-three/Die3D";

function addMagicRing(scene: THREE.Object3D, scale = 1) {
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
    scene.add(mesh);
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

class SceneRenderer {
  private readonly _root = new THREE.Object3D();
  private readonly _die3d: Die3D;
  private readonly _envMap?: THREE.Texture;
  private readonly _lights: THREE.Light[];
  private _dispose?: () => void;

  constructor(die3d: Die3D, lights: THREE.Light[], envMap?: THREE.Texture) {
    this._die3d = die3d;
    this._envMap = envMap;
    this._lights = lights;
  }

  dispose() {
    this._root.clear(); // Dispose all children?
    this._dispose?.();
    this._die3d.dispose();
    this._lights?.forEach((l) => l.dispose());
  }

  setup(gl: ExpoWebGLRenderingContext, opt?: { withStage?: boolean }): void {
    try {
      // Dispose resources from previous setup
      this._dispose?.();

      // Cleanup scene
      this._root.clear();

      // Renderer
      const renderer = new Renderer({ gl, alpha: true });
      // set size of buffer to be equal to drawing buffer width
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

      // Camera
      const ratio = gl.drawingBufferWidth / gl.drawingBufferHeight;
      const camera = new THREE.PerspectiveCamera(15, ratio, 0.1, 100);
      const dieSize = Math.max(
        this._die3d.size.x,
        this._die3d.size.y,
        this._die3d.size.z
      );
      const cameraDist =
        dieSize * 2.7 * (opt?.withStage ? 1 : this._getDieSizeRatio());
      camera.position.set(0, cameraDist, cameraDist);
      camera.lookAt(new THREE.Vector3(0, 0, 0));

      // Scene
      const scene = new THREE.Scene();
      scene.environment = this._envMap ?? null;

      // Place die in scene
      this._root.add(this._die3d);
      scene.add(this._root);

      // Light setup
      this._lights?.forEach((l) => scene.add(l));

      // const dirLight = new THREE.DirectionalLight(0xfdfdfd, 3);
      // dirLight.position.set(9, 27, 15);
      // dirLight.lookAt(new THREE.Vector3(0, 0, 0));
      // scene.add(dirLight);

      // const whiteLight = new THREE.PointLight(0xfdfdfd, 2, 100);
      // whiteLight.position.set(9, 27, -15);
      // scene.add(whiteLight);

      // const blueLight = new THREE.PointLight(0x0090ff, 1, 100);
      // blueLight.position.set(-14, -6, -19);
      // scene.add(blueLight);

      // const redLight = new THREE.PointLight(0xff4962, 1, 100);
      // redLight.position.set(31, -11, -4);
      // scene.add(redLight);

      const staging = new THREE.Object3D();
      const updateSparks: ((deltaTime: number) => void)[] = [];
      if (opt?.withStage) {
        this._root.add(staging);

        // Magic ring
        addMagicRing(staging, cameraDist / 40);
        camera.position.z *= 2;
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        if (Platform.OS === "ios") {
          // Sparks particles
          const radius = 10;
          const sparks = this._createSparks({
            linesCount: 3,
            pointsCount: 5,
            colors: [
              "#c06995",
              "#de77c7",
              "#df86df",
              "#d998ee",
              "#ceadf4",
              "#c6bff9",
            ],
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
          sparks.forEach((spark) => {
            sparksOffset.add(spark.mesh);
            updateSparks.push(spark.update);
          });
          staging.add(sparksRoot);
        }
      }

      // Render
      const renderScene = {
        callback: (() => {
          renderer.render(scene, camera);
          gl.endFrameEXP();
        }) as (() => void) | undefined,
      };

      this._dispose = () => {
        scene.clear();
        //whiteLight.dispose();
        staging.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        });
        renderer.dispose();
        renderScene.callback = undefined;
      };

      this._setupRenderLoop(!opt?.withStage, renderScene, updateSparks);
    } catch (error) {
      console.error("Error while setting up ThreeJS scene graph", error);
    }
  }

  private _getDieSizeRatio() {
    switch (this._die3d.dieType) {
      case "d6":
      case "d6pipped":
      case "d6fudge":
        return 1.8;
      case "d8":
        return 0.88;
      case "d10":
      case "d00":
        return 0.95;
      case "d12":
        return 0.75;
      case "d20":
        return 1.05;
      default:
        return 1;
    }
  }

  private _setupRenderLoop(
    rotateX: boolean,
    renderScene: { callback: (() => void) | undefined },
    updateSparks: ((deltaTime: number) => void)[]
  ): void {
    // Create render function
    let lastTime = Date.now();

    const frameRender = () => {
      if (renderScene.callback) {
        const time = Date.now();
        const deltaTime = time - lastTime;

        // Rotate dice
        if (rotateX) {
          this._root.rotation.x -= deltaTime / 10000;
        }
        this._root.rotation.y -= deltaTime / 5000;
        lastTime = time;

        // Light random LED
        // const ledIndex = Math.floor(Math.random() * this._die3d.faceCount);
        // this._die3d.setLEDColor(
        //   ledIndex,
        //   new THREE.Color(Math.random(), Math.random(), Math.random())
        // );

        updateSparks.forEach((update) => update(deltaTime));

        try {
          renderScene.callback();
          requestAnimationFrame(frameRender);
        } catch (error) {
          console.error(error);
          console.warn(
            "Error rendering Die3D, stop rendering to avoid further errors"
          );
          // Cleanup
          this._dispose?.();
        }
      }
    };

    // Render
    frameRender();
  }

  // https://varun.ca/three-js-particles/
  // https://github.com/winkerVSbecks/3d-particle-effects-demo/blob/main/src/Scene.js
  private _createSparks({
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
    update: (deltaTime: number) => number;
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
        update: (deltaTime: number) =>
          (material.uniforms.dashOffset.value -= speed * deltaTime),
      };
    });
  }
}

/**
 * Component that renders a D20 in 3D.
 * See {@link DieRendererProps} for the supported props.
 */
export function DieRenderer({
  dieType,
  colorway,
  withStage,
}: {
  dieType: PixelDieType;
  colorway: PixelColorway;
  withStage?: boolean;
}) {
  const { showBoundary } = useErrorBoundary();

  const [loaded, setLoaded] = React.useState(false);
  const rendererRef = React.useRef<SceneRenderer>();
  // Load die 3d object
  React.useEffect(() => {
    const task = async () => {
      setLoaded(false);
      const { die3d, envMap, lights } = await createDie3DAsync(
        dieType,
        colorway
      );
      rendererRef.current = new SceneRenderer(die3d, lights, envMap);
      setLoaded(true);
    };
    task().catch(showBoundary);
    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = undefined;
    };
  }, [colorway, dieType, showBoundary]);

  const onContextCreate = React.useCallback(
    (gl: ExpoWebGLRenderingContext) =>
      rendererRef.current?.setup(gl, { withStage }),
    [withStage]
  );

  return (
    <>
      {!loaded ? (
        <Text style={{ alignSelf: "center" }}>Loading...</Text>
      ) : (
        <GLView onContextCreate={onContextCreate} style={{ flex: 1 }} />
      )}
    </>
  );
}
