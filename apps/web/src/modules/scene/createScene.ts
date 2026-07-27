import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { config } from '../../config/env';
import {
  DEFAULT_SCENE_CONFIG,
  loadRuntimeSceneConfig,
  type LightingConfigState,
  type Vec3Tuple,
} from './sceneConfig';

export interface LightingState {
  hemiIntensity: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  sunIntensity: number;
  sunColor: THREE.Color;
  fillIntensity: number;
  fillColor: THREE.Color;
  lampIntensity: number;
  lampColor: THREE.Color;
  rimIntensity: number;
  rimColor: THREE.Color;
  background: THREE.Color;
  envIntensity: number;
  exposure: number;
}

export interface SceneEditAccess {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  monitor: THREE.Group;
  lights: {
    hemi: THREE.HemisphereLight;
    sun: THREE.DirectionalLight;
    fill: THREE.AmbientLight;
    lamp: THREE.PointLight;
    rim: THREE.DirectionalLight;
  };
  dayState: LightingState;
  nightState: LightingState;
  camBase: THREE.Vector3;
  camLookAt: THREE.Vector3;
  setPreviewMode(isNight: boolean): void;
  setIdleAnimationEnabled(enabled: boolean): void;
}

export interface SceneHandle {
  setMode(isNight: boolean): void;
  dispose(): void;
  edit: SceneEditAccess;
}

const SCREEN_NODE_NAME = 'screen';
const CHAT_CSS_WIDTH = 960;
const CHAT_CSS_HEIGHT = 600;

function toVector3(v: Vec3Tuple): THREE.Vector3 {
  return new THREE.Vector3(v.x, v.y, v.z);
}

function applyLightingConfig(state: LightingState, config: LightingConfigState) {
  state.hemiIntensity = config.hemiIntensity;
  state.hemiSky.set(config.hemiSky);
  state.hemiGround.set(config.hemiGround);
  state.sunIntensity = config.sunIntensity;
  state.sunColor.set(config.sunColor);
  state.fillIntensity = config.fillIntensity;
  state.fillColor.set(config.fillColor);
  state.lampIntensity = config.lampIntensity;
  state.lampColor.set(config.lampColor);
  state.rimIntensity = config.rimIntensity;
  state.rimColor.set(config.rimColor);
  state.background.set(config.background);
  state.envIntensity = config.envIntensity;
  state.exposure = config.exposure;
}

function toLightingState(config: LightingConfigState): LightingState {
  const state: LightingState = {
    hemiIntensity: 0,
    hemiSky: new THREE.Color(),
    hemiGround: new THREE.Color(),
    sunIntensity: 0,
    sunColor: new THREE.Color(),
    fillIntensity: 0,
    fillColor: new THREE.Color(),
    lampIntensity: 0,
    lampColor: new THREE.Color(),
    rimIntensity: 0,
    rimColor: new THREE.Color(),
    background: new THREE.Color(),
    envIntensity: 0,
    exposure: 1,
  };
  applyLightingConfig(state, config);
  return state;
}

function cloneState(state: LightingState): LightingState {
  return {
    ...state,
    hemiSky: state.hemiSky.clone(),
    hemiGround: state.hemiGround.clone(),
    sunColor: state.sunColor.clone(),
    fillColor: state.fillColor.clone(),
    lampColor: state.lampColor.clone(),
    rimColor: state.rimColor.clone(),
    background: state.background.clone(),
  };
}

function copyState(target: LightingState, source: LightingState) {
  target.hemiIntensity = source.hemiIntensity;
  target.hemiSky.copy(source.hemiSky);
  target.hemiGround.copy(source.hemiGround);
  target.sunIntensity = source.sunIntensity;
  target.sunColor.copy(source.sunColor);
  target.fillIntensity = source.fillIntensity;
  target.fillColor.copy(source.fillColor);
  target.lampIntensity = source.lampIntensity;
  target.lampColor.copy(source.lampColor);
  target.rimIntensity = source.rimIntensity;
  target.rimColor.copy(source.rimColor);
  target.background.copy(source.background);
  target.envIntensity = source.envIntensity;
  target.exposure = source.exposure;
}

export function createScene(container: HTMLElement, initialNight = false): SceneHandle {
  const sceneConfig = DEFAULT_SCENE_CONFIG;
  const DAY_STATE = toLightingState(sceneConfig.day);
  const NIGHT_STATE = toLightingState(sceneConfig.night);
  const MODEL_SCALE = sceneConfig.model.scale;
  const MODEL_OFFSET = toVector3(sceneConfig.model.position);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(initialNight ? NIGHT_STATE.background : DAY_STATE.background);

  const camera = new THREE.PerspectiveCamera(
    sceneConfig.camera.fov,
    container.clientWidth / container.clientHeight,
    0.1,
    200,
  );
  const camBase = toVector3(sceneConfig.camera.base);
  const camLookAt = toVector3(sceneConfig.camera.lookAt);
  camera.position.copy(camBase);
  camera.lookAt(camLookAt);

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
  sun.position.copy(toVector3(sceneConfig.lightPositions.sun));
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
  lamp.position.copy(toVector3(sceneConfig.lightPositions.lamp));
  scene.add(lamp);
  const rim = new THREE.DirectionalLight('#8fd8c8', 0.3);
  rim.position.copy(toVector3(sceneConfig.lightPositions.rim));
  scene.add(rim);

  const monitor = new THREE.Group();
  monitor.position.copy(MODEL_OFFSET);
  monitor.scale.setScalar(MODEL_SCALE);
  scene.add(monitor);

  let chatElement: HTMLIFrameElement | null = null;
  if (config.streamlabsWidgetUrl) {
    chatElement = document.createElement('iframe');
    chatElement.src = config.streamlabsWidgetUrl;
    chatElement.referrerPolicy = 'no-referrer';
    chatElement.style.border = 'none';
  }

  const draco = new DRACOLoader();
  draco.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(draco);
  let disposed = false;
  const envMappedMaterials: THREE.MeshStandardMaterial[] = [];
  gltfLoader.load(`${import.meta.env.BASE_URL}models/new-cassette-system.gltf`, (gltf) => {
    if (disposed) return;
    gltf.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        const mesh = obj as THREE.Mesh;
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (material && 'envMapIntensity' in material) {
          envMappedMaterials.push(material);
        }
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

      if (chatElement) {
        chatElement.style.width = `${CHAT_CSS_WIDTH}px`;
        chatElement.style.height = `${CHAT_CSS_HEIGHT}px`;
        const chatObject = new CSS3DObject(chatElement);
        chatObject.position.set(centerX, centerY, centerZ);
        chatObject.scale.set(worldWidth / CHAT_CSS_WIDTH, worldHeight / CHAT_CSS_HEIGHT, 1);
        screenMesh.add(chatObject);
      }
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
  let idleAnimationEnabled = true;

  function setMode(isNight: boolean) {
    target = isNight ? NIGHT_STATE : DAY_STATE;
  }

  function setPreviewMode(isNight: boolean) {
    target = isNight ? NIGHT_STATE : DAY_STATE;
    copyState(current, target);
  }

  function setIdleAnimationEnabled(enabled: boolean) {
    idleAnimationEnabled = enabled;
  }

  loadRuntimeSceneConfig(import.meta.env.BASE_URL).then((runtimeConfig) => {
    if (!runtimeConfig || disposed) return;
    applyLightingConfig(DAY_STATE, runtimeConfig.day);
    applyLightingConfig(NIGHT_STATE, runtimeConfig.night);
    sun.position.copy(toVector3(runtimeConfig.lightPositions.sun));
    lamp.position.copy(toVector3(runtimeConfig.lightPositions.lamp));
    rim.position.copy(toVector3(runtimeConfig.lightPositions.rim));
    camBase.copy(toVector3(runtimeConfig.camera.base));
    camLookAt.copy(toVector3(runtimeConfig.camera.lookAt));
    camera.fov = runtimeConfig.camera.fov;
    camera.updateProjectionMatrix();
    monitor.position.copy(toVector3(runtimeConfig.model.position));
    monitor.scale.setScalar(runtimeConfig.model.scale);
    copyState(current, target);
  });

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
    current.lampColor.lerp(target.lampColor, alpha);
    current.rimIntensity += (target.rimIntensity - current.rimIntensity) * alpha;
    current.rimColor.lerp(target.rimColor, alpha);
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
    lamp.color.copy(current.lampColor);
    rim.intensity = current.rimIntensity;
    rim.color.copy(current.rimColor);
    (scene.background as THREE.Color).copy(current.background);
    renderer.toneMappingExposure = current.exposure;
    for (const material of envMappedMaterials) {
      material.envMapIntensity = current.envIntensity;
    }

    if (idleAnimationEnabled) {
      camera.position.set(
        camBase.x + Math.sin(t * 0.35) * 0.06,
        camBase.y + Math.sin(t * 0.5) * 0.035,
        camBase.z + Math.cos(t * 0.3) * 0.05,
      );
      camera.lookAt(camLookAt);
    }

    composer.render();
    cssRenderer.render(scene, camera);
  }
  animate();

  function dispose() {
    disposed = true;
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);
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

  const edit: SceneEditAccess = {
    camera,
    renderer,
    scene,
    monitor,
    lights: { hemi, sun, fill, lamp, rim },
    dayState: DAY_STATE,
    nightState: NIGHT_STATE,
    camBase,
    camLookAt,
    setPreviewMode,
    setIdleAnimationEnabled,
  };

  return { setMode, dispose, edit };
}
