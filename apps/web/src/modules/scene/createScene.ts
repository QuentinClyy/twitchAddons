import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { config } from '../../config/env';
import { ChatPanel } from './chatPanel';
import { connectTwitchChat, type TwitchChatHandle } from './twitchChat';

export interface SceneHandle {
  setMode(isNight: boolean): void;
  dispose(): void;
}

const MODEL_SCALE = 1;
const MODEL_OFFSET = new THREE.Vector3(0, 1.15, 0);
const SCREEN_NODE_NAME = 'screen';
const CHAT_CSS_WIDTH = 960;
const CHAT_CSS_HEIGHT = 600;

interface LightingState {
  hemiIntensity: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  sunIntensity: number;
  sunColor: THREE.Color;
  fillIntensity: number;
  fillColor: THREE.Color;
  lampIntensity: number;
  rimIntensity: number;
  background: THREE.Color;
  envIntensity: number;
  exposure: number;
}

const DAY_STATE: LightingState = {
  hemiIntensity: 0.42,
  hemiSky: new THREE.Color('#bcd8ff'),
  hemiGround: new THREE.Color('#1c2a1a'),
  sunIntensity: 1.2,
  sunColor: new THREE.Color('#fff2d6'),
  fillIntensity: 0.16,
  fillColor: new THREE.Color('#4a6a4a'),
  lampIntensity: 0.1,
  rimIntensity: 0.25,
  background: new THREE.Color('#42533f'),
  envIntensity: 0.4,
  exposure: 1.0,
};

const NIGHT_STATE: LightingState = {
  hemiIntensity: 0.05,
  hemiSky: new THREE.Color('#1a2440'),
  hemiGround: new THREE.Color('#050805'),
  sunIntensity: 0.0,
  sunColor: new THREE.Color('#8899ff'),
  fillIntensity: 0.06,
  fillColor: new THREE.Color('#3a2a18'),
  lampIntensity: 0.3,
  rimIntensity: 0.08,
  background: new THREE.Color('#020402'),
  envIntensity: 0.15,
  exposure: 0.95,
};

function cloneState(state: LightingState): LightingState {
  return {
    ...state,
    hemiSky: state.hemiSky.clone(),
    hemiGround: state.hemiGround.clone(),
    sunColor: state.sunColor.clone(),
    fillColor: state.fillColor.clone(),
    background: state.background.clone(),
  };
}

export function createScene(container: HTMLElement, initialNight = false): SceneHandle {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(initialNight ? NIGHT_STATE.background : DAY_STATE.background);

  const camera = new THREE.PerspectiveCamera(
    35,
    container.clientWidth / container.clientHeight,
    0.1,
    200,
  );
  const camBase = new THREE.Vector3(2.6, 1.55, 5.1);
  camera.position.copy(camBase);
  camera.lookAt(0, 1.28, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 10));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.inset = '0';
  container.appendChild(renderer.domElement);

  const cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(container.clientWidth, container.clientHeight);
  cssRenderer.domElement.style.position = 'absolute';
  cssRenderer.domElement.style.inset = '0';
  cssRenderer.domElement.style.pointerEvents = 'none';
  container.appendChild(cssRenderer.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new OutputPass());

  const hemi = new THREE.HemisphereLight('#bcd8ff', '#1c2a1a', 0.7);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff2d6', 1.15);
  sun.position.set(-6, 9, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -10;
  sun.shadow.bias = -0.0015;
  sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.AmbientLight('#4a6a4a', 0.22);
  scene.add(fill);
  const lamp = new THREE.PointLight('#ffb168', 0.25, 5, 2);
  lamp.position.set(-2.1, 1.6, 1.4);
  scene.add(lamp);
  const rim = new THREE.DirectionalLight('#8fd8c8', 0.3);
  rim.position.set(2, 3, -6);
  scene.add(rim);

  const monitor = new THREE.Group();
  monitor.position.set(0, 0, 0.4);
  scene.add(monitor);

  const chat = new ChatPanel();

  let twitchChat: TwitchChatHandle | null = null;
  if (config.twitchChannel) {
    twitchChat = connectTwitchChat(config.twitchChannel, {
      onMessage: (message) =>
        chat.addMessage(
          message.id,
          message.from,
          message.messageHtml,
          message.color,
          message.badges,
        ),
      onDeleteMessage: (messageId) => chat.deleteMessage(messageId),
      onClearUser: (username) => chat.clearUser(username),
      onClearAll: () => chat.clearAll(),
    });
  }

  const draco = new DRACOLoader();
  draco.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(draco);
  let disposed = false;
  gltfLoader.load(`${import.meta.env.BASE_URL}models/new-cassette-system.glb`, (gltf) => {
    if (disposed) return;
    gltf.scene.position.copy(MODEL_OFFSET);
    gltf.scene.scale.setScalar(MODEL_SCALE);
    gltf.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    const screenMesh = gltf.scene.getObjectByName(SCREEN_NODE_NAME) as THREE.Mesh | undefined;
    if (screenMesh) {
      screenMesh.castShadow = false;
      screenMesh.receiveShadow = false;

      const geometry = screenMesh.geometry;
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox!;
      const worldWidth = bbox.max.x - bbox.min.x;
      const worldHeight = bbox.max.y - bbox.min.y;
      const centerX = (bbox.min.x + bbox.max.x) / 2;
      const centerY = (bbox.min.y + bbox.max.y) / 2;
      const centerZ = bbox.max.z;

      chat.element.style.width = `${CHAT_CSS_WIDTH}px`;
      chat.element.style.height = `${CHAT_CSS_HEIGHT}px`;
      const chatObject = new CSS3DObject(chat.element);
      chatObject.position.set(centerX, centerY, centerZ);
      chatObject.scale.set(worldWidth / CHAT_CSS_WIDTH, worldHeight / CHAT_CSS_HEIGHT, 1);
      screenMesh.add(chatObject);
    }

    monitor.add(gltf.scene);
  });

  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    cssRenderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  let target = initialNight ? NIGHT_STATE : DAY_STATE;
  const current = cloneState(target);

  function setMode(isNight: boolean) {
    target = isNight ? NIGHT_STATE : DAY_STATE;
  }

  const clock = new THREE.Clock();
  let rafId = 0;

  function animate() {
    rafId = requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const alpha = 1 - Math.pow(0.001, dt);

    current.hemiIntensity += (target.hemiIntensity - current.hemiIntensity) * alpha;
    current.hemiSky.lerp(target.hemiSky, alpha);
    current.hemiGround.lerp(target.hemiGround, alpha);
    current.sunIntensity += (target.sunIntensity - current.sunIntensity) * alpha;
    current.sunColor.lerp(target.sunColor, alpha);
    current.fillIntensity += (target.fillIntensity - current.fillIntensity) * alpha;
    current.fillColor.lerp(target.fillColor, alpha);
    current.lampIntensity += (target.lampIntensity - current.lampIntensity) * alpha;
    current.rimIntensity += (target.rimIntensity - current.rimIntensity) * alpha;
    current.background.lerp(target.background, alpha);
    current.envIntensity += (target.envIntensity - current.envIntensity) * alpha;
    current.exposure += (target.exposure - current.exposure) * alpha;

    hemi.intensity = current.hemiIntensity;
    hemi.color.copy(current.hemiSky);
    hemi.groundColor.copy(current.hemiGround);
    sun.intensity = current.sunIntensity;
    sun.color.copy(current.sunColor);
    fill.intensity = current.fillIntensity;
    fill.color.copy(current.fillColor);
    lamp.intensity = current.lampIntensity;
    rim.intensity = current.rimIntensity;
    (scene.background as THREE.Color).copy(current.background);
    renderer.toneMappingExposure = current.exposure;

    camera.position.set(
      camBase.x + Math.sin(t * 0.35) * 0.06,
      camBase.y + Math.sin(t * 0.5) * 0.035,
      camBase.z + Math.cos(t * 0.3) * 0.05,
    );
    camera.lookAt(0, 1.3, 0);

    composer.render();
    cssRenderer.render(scene, camera);
  }
  animate();

  function dispose() {
    disposed = true;
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);
    twitchChat?.disconnect();
    draco.dispose();
    composer.dispose();
    renderer.dispose();
    envTex.dispose();
    pmrem.dispose();
    if (renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement);
    }
    if (cssRenderer.domElement.parentElement === container) {
      container.removeChild(cssRenderer.domElement);
    }
  }

  return { setMode, dispose };
}
