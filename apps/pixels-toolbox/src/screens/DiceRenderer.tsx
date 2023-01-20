import { GLView, ExpoWebGLRenderingContext } from "expo-gl";
import { Renderer, TextureLoader } from "expo-three";
import { Pressable, HStack, Text, VStack } from "native-base";
import { useEffect, useState } from "react";
import {
  AmbientLight,
  BoxGeometry,
  Fog,
  GridHelper,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  SpotLight,
} from "three";

import AppPage from "~/components/AppPage";

class IconMesh extends Mesh {
  constructor() {
    super(
      new BoxGeometry(1.0, 1.0, 1.0),
      new MeshStandardMaterial({
        map: new TextureLoader().load(require("!/images/icon.png")),
      })
    );
  }
}

function DieRenderer() {
  let timeout = 0;
  useEffect(() => {
    // Clear the animation loop when the component unmounts
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const sceneColor = 0x6ad6f0;

    // Create a WebGLRenderer without a DOM element
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(sceneColor);

    const camera = new PerspectiveCamera(70, width / height, 0.01, 1000);
    camera.position.set(1, 3, 3);

    const scene = new Scene();
    scene.fog = new Fog(sceneColor, 1, 10000);
    scene.add(new GridHelper(10, 10));

    const ambientLight = new AmbientLight(0x101010);
    scene.add(ambientLight);

    const pointLight = new PointLight(0xffffff, 2, 20, 1);
    pointLight.position.set(0, 10, 10);
    scene.add(pointLight);

    const spotLight = new SpotLight(0xffffff, 0.5);
    spotLight.position.set(0, 500, 100);
    spotLight.lookAt(scene.position);
    scene.add(spotLight);

    const cube = new IconMesh();
    cube.position.set(2, 0, 0);
    scene.add(cube);
    camera.lookAt(cube.position);

    function update() {
      cube.rotation.y += 0.05;
      cube.rotation.x += 0.025;
    }

    // Setup an animation loop
    const render = () => {
      timeout = requestAnimationFrame(render);
      update();
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    render();
  };

  //return <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />;
  const [counter, setCounter] = useState(0);
  return (
    <>
      <Text>Count: {counter}</Text>
      <GLView
        style={{
          flex: 1,
          borderColor: "blue",
          borderWidth: 3,
          borderRadius: 5,
          margin: 5,
        }}
        onContextCreate={onContextCreate}
      />
      <Pressable
        style={{
          left: "10%",
          width: "80%",
          height: 30,
          borderRadius: 4,
          backgroundColor: "green",
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={() => setCounter((c) => c + 1)}
      >
        <Text>Click</Text>
      </Pressable>
    </>
  );
}

function DiceRendererPage() {
  return (
    <HStack w="100%" h="100%" flex={1}>
      <VStack flex={1}>
        <DieRenderer />
        <DieRenderer />
        <DieRenderer />
        <DieRenderer />
      </VStack>
      <VStack flex={1}>
        <DieRenderer />
        <DieRenderer />
        <DieRenderer />
        <DieRenderer />
      </VStack>
      <VStack flex={1}>
        <DieRenderer />
        <DieRenderer />
        <DieRenderer />
        <DieRenderer />
      </VStack>
    </HStack>
  );
}

export default function () {
  return (
    <AppPage>
      <DiceRendererPage />
    </AppPage>
  );
}
