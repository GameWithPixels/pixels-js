import {
  AnimationBits,
  AnimationInstance,
  AnimationPreset,
  GammaUtils,
} from "@systemic-games/pixels-core-animation";
import { Die3D } from "@systemic-games/pixels-three";
import { PixelDieType } from "@systemic-games/react-native-pixels-connect";
import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import { Renderer, THREE } from "expo-three";
import React from "react";
import { useErrorHandler } from "react-error-boundary";
import { Text } from "react-native-paper";

import { createDie3DAsync } from "./createDie3DAsync";

import AppStyles from "~/AppStyles";

class SceneRenderer {
  private readonly _die3d: Die3D;
  private readonly _getAnimInstances: () => AnimationInstance[];
  private _renderScene?: () => void;
  private _dispose?: () => void;

  constructor(die3d: Die3D, getAnimInstances: () => AnimationInstance[]) {
    this._die3d = die3d;
    this._getAnimInstances = getAnimInstances;
  }

  shutdown() {
    this._dispose?.();
  }

  setup(gl: ExpoWebGLRenderingContext): void {
    try {
      // Renderer
      const renderer = new Renderer({ gl, alpha: true });
      // set size of buffer to be equal to drawing buffer width
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

      // Camera
      const ratio = gl.drawingBufferWidth / gl.drawingBufferHeight;
      const camera = new THREE.PerspectiveCamera(15, ratio, 0.1, 800);
      camera.position.set(16.4, 76.5, -62);
      camera.lookAt(new THREE.Vector3(0, 0.6, 0));

      // Scene
      const scene = new THREE.Scene();

      // Place die in scene
      scene.add(this._die3d);

      // Light setup
      const whiteLight = new THREE.PointLight(0xfdfdfd, 1.5, 100);
      whiteLight.position.set(9, 27, -15);
      scene.add(whiteLight);

      // const blueLight = new THREE.PointLight(0x0090ff, 1, 100);
      // blueLight.position.set(-14, -6, -19);
      // scene.add(blueLight);

      // const redLight = new THREE.PointLight(0xff4962, 1, 100);
      // redLight.position.set(31, -11, -4);
      // scene.add(redLight);

      const alreadyRendering = this._renderScene;
      this._dispose?.();

      this._renderScene = () => {
        renderer.render(scene, camera);
        gl.endFrameEXP();
      };
      this._dispose = () => {
        whiteLight.dispose();
        this._renderScene = undefined;
      };

      if (!alreadyRendering) {
        this._setupRenderLoop();
      }
    } catch (error) {
      console.error("Error while setting up ThreeJS scene graph", error);
    }
  }

  private _setupRenderLoop() {
    // Create render function
    let lastTime = Date.now();
    let lastAnims: AnimationInstance[] = [];
    let animIndex = 0;

    const frameRender = () => {
      if (this._renderScene) {
        try {
          const time = Date.now();

          // Rotate die
          this._die3d.rotation.y -= (time - lastTime) / 5000;
          lastTime = time;

          // Update animation
          const anims = this._getAnimInstances();
          let changed = lastAnims !== anims;
          if (changed) {
            lastAnims = anims;
            animIndex = 0;
            // Turn all LEDs off
            this._die3d.clearLEDs();
          }

          if (anims?.length) {
            if (
              !changed &&
              anims[animIndex].startTime + anims[animIndex].duration < time
            ) {
              // Switch to next animation
              animIndex = (animIndex + 1) % anims.length;
              changed = true;
            }
            const anim = anims[animIndex];
            if (changed) {
              // Start animation
              anim.start(time);
            }
            // Get LEDs colors
            const indices: number[] = Array(20).fill(0);
            const colors: number[] = Array(20).fill(0);
            const count = anim.updateLEDs(time, indices, colors);
            // Light up die
            const c = new THREE.Color();
            for (let i = 0; i < count; ++i) {
              const colorValue = colors[i];
              c.setRGB(
                GammaUtils.reverseGamma8((colorValue >> 16) & 0xff) / 255,
                GammaUtils.reverseGamma8((colorValue >> 8) & 0xff) / 255,
                GammaUtils.reverseGamma8(colorValue & 0xff) / 255
              );
              this._die3d.setLEDColor(indices[i], c);
            }
          }
        } catch (error) {
          console.error(error);
          console.warn(
            `Error while animating LEDs for Die3D, stop rendering to avoid further errors`
          );
          // Cleanup
          this._dispose?.();
        }
        try {
          this._renderScene?.();
          requestAnimationFrame(frameRender);
        } catch (error) {
          console.error(error);
          console.warn(
            `Error rendering Die3D, stop rendering to avoid further errors`
          );
          // Cleanup
          this._dispose?.();
        }
      }
    };

    // Render
    frameRender();
  }
}

/**
 * Die animation data to be rendered with a {@link DieRenderer} component.
 */
export interface DieRenderData {
  animations: AnimationPreset | AnimationPreset[];
  animationBits: AnimationBits;
  dieType?: PixelDieType;
}

/**
 * Props for {@link DieRenderer}.
 */
export interface DieRendererProps {
  renderData?: DieRenderData; // The optional animation(s) to play on the die.
}

/**
 * Component that renders a D20 in 3D.
 * See {@link DieRendererProps} for the supported props.
 */
export function DieRenderer({ renderData }: DieRendererProps) {
  const errorHandler = useErrorHandler();

  const [loaded, setLoaded] = React.useState(false);
  const rendererRef = React.useRef<SceneRenderer>();

  // Load die 3d object
  React.useEffect(() => {
    createDie3DAsync(renderData?.dieType ?? "d20")
      .then((die3d) => {
        setLoaded(true);
        rendererRef.current = new SceneRenderer(
          die3d,
          () => animInstanceRef.current
        );
      })
      .catch(errorHandler);
    return () => {
      rendererRef.current?.shutdown();
    };
  }, [errorHandler, renderData?.dieType]);

  // Create an instance to play the animation
  const animInstanceRef = React.useRef<AnimationInstance[]>([]);
  const animations = renderData?.animations;
  const animationBits = renderData?.animationBits;
  React.useEffect(() => {
    if (animations && animationBits) {
      const anims = Array.isArray(animations) ? animations : [animations];
      animInstanceRef.current = anims.map((a) =>
        a.createInstance(animationBits)
      );
    } else {
      animInstanceRef.current = [];
    }
  }, [animations, animationBits]);

  const onContextCreate = React.useCallback(
    (gl: ExpoWebGLRenderingContext) => rendererRef.current?.setup(gl),
    []
  );

  return (
    <>
      {!loaded ? (
        <Text style={AppStyles.selfCentered}>Loading...</Text>
      ) : (
        <GLView onContextCreate={onContextCreate} style={AppStyles.flex} />
      )}
    </>
  );
}
