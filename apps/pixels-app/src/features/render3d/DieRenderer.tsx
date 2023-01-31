import {
  AnimationBits,
  AnimationInstance,
  AnimationPreset,
} from "@systemic-games/pixels-core-animation";
import { Die3D } from "@systemic-games/pixels-three";
import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import { Renderer, THREE } from "expo-three";
import { Text } from "native-base";
import React, { useEffect, useRef, useState } from "react";
import { useErrorHandler } from "react-error-boundary";

import createDie3DAsync from "./createDie3DAsync";

function onContextCreate(
  gl: ExpoWebGLRenderingContext,
  die3d: Die3D,
  getAnimInstances: () => AnimationInstance[]
): void {
  // Renderer
  const renderer = new Renderer({ gl, alpha: true });
  // set size of buffer to be equal to drawing buffer width
  renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

  // Camera
  const ratio = gl.drawingBufferWidth / gl.drawingBufferHeight;
  const camera = new THREE.PerspectiveCamera(15, ratio, 0.1, 800);
  camera.position.set(18, 84, -68);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // Scene
  const scene = new THREE.Scene();

  // Place die in scene
  scene.add(die3d);

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

  // Create render function
  let lastAnims: AnimationInstance[] = [];
  let animIndex = 0;
  let errored = false;
  const render = () => {
    requestAnimationFrame(render);

    // Update
    die3d.rotation.y -= 0.005;
    const ms = Date.now();
    const anims = getAnimInstances();
    let changed = lastAnims !== anims;
    if (changed) {
      lastAnims = anims;
      animIndex = 0;
      errored = false;
      // Turn all LEDs off
      die3d.clearLEDs();
    }
    if (!errored && anims?.length) {
      if (
        !changed &&
        anims[animIndex].startTime + anims[animIndex].duration < ms
      ) {
        // Switch to next animation
        animIndex = (animIndex + 1) % anims.length;
        changed = true;
      }
      const anim = anims[animIndex];
      try {
        if (changed) {
          // Start animation
          anim.start(ms);
        }
        // Get LEDs colors
        const indices: number[] = Array(20).fill(0);
        const colors: number[] = Array(20).fill(0);
        const count = anim.updateLEDs(ms, indices, colors);
        // Light up die
        for (let i = 0; i < count; ++i) {
          die3d.setLedColor(indices[i], colors[i]);
        }
      } catch (error) {
        console.error(error);
        console.warn(
          `Error playing animation at index ${animIndex}, stop playing to avoid further errors`
        );
        errored = true;
      }
    }

    renderer.render(scene, camera);
    gl.endFrameEXP();
  };

  // Render
  render();
}

/**
 * Props for {@link DieRenderer}.
 */
export interface DieRendererProps {
  animationData?: {
    animations: AnimationPreset | AnimationPreset[];
    animationBits: AnimationBits;
  }; // The optional animation to play on the die.
}

/**
 * Component that renders a D20 in 3D.
 * See {@link DieRendererProps} for the supported props.
 */
export default function ({ animationData }: DieRendererProps) {
  const errorHandler = useErrorHandler();

  // Load die 3d object
  const [die3d, setDie3d] = useState<Die3D>();
  useEffect(() => {
    if (!die3d) {
      createDie3DAsync().then(setDie3d).catch(errorHandler);
    }
  }, [die3d, errorHandler]);

  // Create an instance to play the animation
  const animInstanceRef = useRef<AnimationInstance[]>([]);
  useEffect(() => {
    let anims = animationData?.animations;
    if (anims && animationData?.animationBits) {
      if (!Array.isArray(anims)) {
        anims = [anims];
      }
      animInstanceRef.current = anims.map((a) =>
        a.createInstance(animationData.animationBits)
      );
    } else {
      animInstanceRef.current = [];
    }
  }, [animationData?.animations, animationData?.animationBits]);

  return (
    <>
      {!die3d ? (
        <Text>Loading...</Text>
      ) : (
        <GLView
          onContextCreate={(gl) =>
            onContextCreate(gl, die3d, () => animInstanceRef.current)
          }
          style={{ flex: 1 }}
        />
      )}
    </>
  );
}
