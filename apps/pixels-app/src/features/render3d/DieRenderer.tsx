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

import loadDie3D from "./loadDie3D";

function onContextCreate(
  gl: ExpoWebGLRenderingContext,
  die3d: Die3D,
  getAnimInstance: () => AnimationInstance | undefined
): void {
  // Renderer
  const renderer = new Renderer({ gl });
  // set size of buffer to be equal to drawing buffer width
  renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
  renderer.setClearColor(0x6ad6f0);

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
  const render = () => {
    requestAnimationFrame(render);

    // Update
    die3d.rotation.y -= 0.005;
    const ms = Date.now();
    const animInst = getAnimInstance();
    if (animInst) {
      if (animInst.startTime + animInst.duration < ms) {
        // Start animation
        animInst.start(ms);
      }
      // Get LEDs colors
      const indices: number[] = Array(20).fill(0);
      const colors: number[] = Array(20).fill(0);
      const count = animInst.updateLEDs(ms, indices, colors);
      // Light up die
      for (let i = 0; i < count; ++i) {
        die3d.setLedColor(indices[i], colors[i]);
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
  animation?: AnimationPreset; // The optional animation to play on the die.
}

/**
 * Component that renders a D20 in 3D.
 * See {@link DieRendererProps} for the supported props.
 */
export default function DieRenderer({ animation }: DieRendererProps) {
  const errorHandler = useErrorHandler();

  // Load die 3d object
  const [die3d, setDie3d] = useState<Die3D>();
  useEffect(() => {
    if (!die3d) {
      loadDie3D().then(setDie3d).catch(errorHandler);
    }
  }, [die3d, errorHandler]);

  // Create an instance to play the animation
  const animInstanceRef = useRef<AnimationInstance>();
  useEffect(() => {
    animInstanceRef.current = animation?.createInstance(new AnimationBits());
  }, [animation]);

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
