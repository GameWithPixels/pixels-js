import { useFocusEffect } from "@react-navigation/native";
import {
  AnimationBits,
  AnimationInstance,
  AnimationPreset,
  GammaUtils,
  PixelColorway,
  PixelDieType,
  VirtualDie,
} from "@systemic-games/react-native-pixels-connect";
import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import { Renderer, THREE } from "expo-three";
import React from "react";
import { useErrorBoundary } from "react-error-boundary";
import { Text } from "react-native-paper";

import { UpdateArgs, UpdateCallback } from "./UpdateCallback";
import { createDie3DAsync } from "./createDie3DAsync";
import { addPedestal } from "./pedestal";

import Die3D from "~/pixels-three/Die3D";

const animIndices: number[] = Array(20).fill(0);
const animColors: number[] = Array(20).fill(0);

function renderAnimation(
  die3d: Die3D,
  anim: AnimationInstance,
  { time }: UpdateArgs
): void {
  animIndices.fill(0);
  animColors.fill(0);
  // Get LEDs colors
  const count = anim.updateLEDs(time, animIndices, animColors);
  // Light up die
  const c = new THREE.Color();
  for (let i = 0; i < count; ++i) {
    const colorValue = animColors[i];
    c.setRGB(
      GammaUtils.reverseGamma8((colorValue >> 16) & 0xff) / 255,
      GammaUtils.reverseGamma8((colorValue >> 8) & 0xff) / 255,
      GammaUtils.reverseGamma8(colorValue & 0xff) / 255
    );
    die3d.setLEDColor(animIndices[i], c);
  }
}

class SceneRenderer {
  private _shouldRender = false;
  private _renderLoop?: () => void;
  // Resources
  private readonly _root = new THREE.Object3D();
  private readonly _die3d: Die3D;
  private readonly _envMap?: THREE.Texture;
  private readonly _lights: THREE.Light[];
  private _speed = 1;
  private _rotateX = true;
  private _animUpdate?: UpdateCallback;
  private _dispose?: () => void;

  get speed(): number {
    return this._speed;
  }
  set speed(value: number) {
    this._speed = value;
  }

  get rotateX(): boolean {
    return this._rotateX;
  }
  set rotateX(value: boolean) {
    this._rotateX = value;
  }

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

  setup(gl: ExpoWebGLRenderingContext, pedestalStyle?: PedestalStyle): void {
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
      const cameraDist = dieSize * this._getDieSizeRatio();
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

      // Props
      const staging = new THREE.Object3D();
      if (pedestalStyle) {
        this._root.add(staging);

        // Magic ring
        const color = pedestalStyle.color ?? 0x6667ab;
        addPedestal(staging, color, cameraDist / 40);
        camera.position.z *= 2;
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        // Sparks
        // if (Platform.OS === "ios") {
        //   update.push(...addSparks(staging, dieSize));
        // }
      }

      // update.push(({ time }: UpdateArgs) => {
      //   // Light random LED
      //   const ledIndex = Math.floor(Math.random() * this._die3d.faceCount);
      //   this._die3d.setLEDColor(
      //     ledIndex,
      //     new THREE.Color(Math.random(), Math.random(), Math.random())
      //   );
      // });

      // Render
      const renderScene = () => {
        renderer.render(scene, camera);
        gl.endFrameEXP();
      };

      // Dispose resources
      this._dispose = () => {
        this.stop();
        scene.clear();
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
      };

      this._renderLoop = this._createRenderLoopFunc(renderScene);
    } catch (error) {
      console.error("Error while setting up ThreeJS scene graph", error);
    }
  }

  start() {
    this._shouldRender = true;
    this._renderLoop?.();
  }

  stop() {
    this._shouldRender = false;
  }

  setAnimations(animations?: AnimationInstance[]): void {
    if (animations?.length) {
      let lastTime = 0;
      let endTime = 0;
      let animIndex = -1;
      this._animUpdate = (args: UpdateArgs) => {
        // Switch to next animation after 1 second delay
        if (animIndex < 0 || args.time > endTime + 1000) {
          animIndex = (animIndex + 1) % animations.length;
          const anim = animations[animIndex];
          anim.start(args.time);
          endTime = anim.startTime + anim.duration;
        }
        // Limit animation to 30 FPS
        if (args.time - lastTime > 33) {
          if (args.time <= endTime) {
            renderAnimation(this._die3d, animations[animIndex], args);
          } else {
            this._die3d.clearLEDs();
          }
          lastTime = args.time;
        }
      };
    } else {
      this._animUpdate = undefined;
    }
  }

  private _createRenderLoopFunc(renderScene: () => void): () => void {
    // Create render function
    let lastTime = Date.now();

    // Add some random initial rotation to the die
    const PI2 = Math.PI * 2;
    this._root.rotation.y += Math.random() * PI2;

    const renderLoop = () => {
      if (this._shouldRender) {
        const time = Date.now();
        const deltaTime = time - lastTime;

        // Rotate dice
        const r = this._speed * deltaTime;
        const rot = this._root.rotation;
        if (this._rotateX) {
          rot.x = (rot.x - r / 10000) % PI2;
        }
        rot.y = (rot.y - r / 5000) % PI2;
        lastTime = time;

        try {
          // Update animations
          const args = { time, deltaTime } as const;
          this._animUpdate?.(args);

          // Render
          renderScene();
          requestAnimationFrame(renderLoop);
        } catch (error) {
          console.error((error as Error).message ?? JSON.stringify(error));
          console.warn(
            "Error rendering Die3D, stop rendering to avoid further errors"
          );
          // Cleanup
          this._dispose?.();
        }
      }
    };

    return renderLoop;
  }

  private _getDieSizeRatio() {
    switch (this._die3d.dieType) {
      case "d4":
        return 2.7;
      case "d6":
      case "d6pipped":
      case "d6fudge":
        return 4.86;
      case "d8":
        return 2.38;
      case "d10":
      case "d00":
        return 2.57;
      case "d12":
        return 2;
      case "d20":
        return 2.84;
      default:
        return 2.5;
    }
  }
}

function setRendererProps(
  renderer: SceneRenderer,
  speed: number | undefined,
  hasPedestal: boolean,
  animationInstances?: AnimationInstance[]
): void {
  renderer.speed = (speed ?? 1) * (hasPedestal ? 0.5 : 1);
  renderer.rotateX = !hasPedestal;
  renderer.setAnimations(animationInstances);
}

export interface PedestalStyle {
  color?: string;
}

export interface DieRendererProps {
  dieType: PixelDieType;
  colorway: PixelColorway;
  paused?: boolean;
  speed?: number;
  animationsData?: {
    animations: AnimationPreset[];
    bits: AnimationBits;
  };
  pedestal?: boolean;
  pedestalStyle?: PedestalStyle;
}

/**
 * Component that renders a D20 in 3D.
 * See {@link DieRendererProps} for the supported props.
 */
export function DieRenderer({
  dieType,
  colorway,
  paused,
  speed,
  pedestal,
  pedestalStyle,
  animationsData,
}: DieRendererProps) {
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

  // Animations
  const animationInstances = React.useMemo(
    () =>
      animationsData
        ? animationsData.animations.map((a) =>
            a.createInstance(animationsData.bits, new VirtualDie(dieType))
          )
        : undefined,
    [animationsData, dieType]
  );

  // Setup renderer
  const initArgsRef = React.useRef({
    paused,
    speed,
    pedestalStyle,
    animationInstances,
  });
  initArgsRef.current.paused = paused;
  initArgsRef.current.speed = speed;
  initArgsRef.current.pedestalStyle = !pedestal
    ? undefined
    : pedestalStyle ?? {};
  initArgsRef.current.animationInstances = animationInstances;

  const onContextCreate = React.useCallback((gl: ExpoWebGLRenderingContext) => {
    const renderer = rendererRef.current;
    if (renderer) {
      const { paused, speed, pedestalStyle, animationInstances } =
        initArgsRef.current;
      renderer.setup(gl, pedestalStyle);
      if (!paused) {
        renderer.start();
      }
      // TODO props are set again on each render
      setRendererProps(renderer, speed, !!pedestalStyle, animationInstances);
    }
  }, []);

  // Pause/resume renderer
  React.useEffect(() => {
    if (!paused) {
      rendererRef.current?.start();
      return () => {
        rendererRef.current?.stop();
      };
    }
  }, [paused]);

  // Update rendering parameters, it's just prop => no need to use an effect
  if (rendererRef.current) {
    setRendererProps(
      rendererRef.current,
      speed,
      !!initArgsRef.current.pedestalStyle,
      animationInstances
    );
  }

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

export function DieRendererWithFocus({
  ...props
}: Omit<DieRendererProps, "paused">) {
  const [paused, setPaused] = React.useState(false);
  useFocusEffect(
    React.useCallback(() => {
      setPaused(false);
      return () => setPaused(true);
    }, [])
  );
  return <DieRenderer {...props} paused={paused} />;
}
