import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChatPanel } from './chatPanel';

export interface SceneHandle {
  setMode(isNight: boolean): void;
  addMessage(user: string, text: string): void;
  setDraft(text: string): void;
  dispose(): void;
}

function makeGroundTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#1c1710';
  ctx.fillRect(0, 0, 1024, 1024);
  const tones = [
    '#2e4a24',
    '#3c5c2e',
    '#1f3318',
    '#4a3a1e',
    '#332a16',
    '#213a1a',
    '#0f1a0d',
    '#4d6b38',
  ];
  for (let i = 0; i < 3600; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const r = 1.5 + Math.random() * 9;
    ctx.fillStyle = tones[Math.floor(Math.random() * tones.length)];
    ctx.globalAlpha = 0.28 + Math.random() * 0.4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeGroundBump(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 1 + Math.random() * 7;
    const v = Math.floor(90 + Math.random() * 130);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

function makeFernTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 128, 160);
  const stems = 5;
  for (let s = 0; s < stems; s++) {
    const baseX = 64 + (s - 2) * 10;
    const g = Math.floor(90 + Math.random() * 60);
    ctx.strokeStyle = `rgba(30,${g},35,0.95)`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(baseX, 160);
    ctx.quadraticCurveTo(baseX + (s - 2) * 6, 80, baseX + (s - 2) * 14, 10);
    ctx.stroke();
    for (let i = 0; i < 14; i++) {
      const t = i / 14;
      const x = baseX + (s - 2) * 14 * t;
      const y = 160 - t * 150;
      const len = 16 * (1 - t * 0.4);
      ctx.fillStyle = `rgba(30,${g},35,0.9)`;
      ctx.beginPath();
      ctx.ellipse(x + len * 0.55, y - len * 0.2, len * 0.55, len * 0.22, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x - len * 0.55, y - len * 0.2, len * 0.55, len * 0.22, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return new THREE.CanvasTexture(canvas);
}

interface LightingState {
  hemiIntensity: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  sunIntensity: number;
  sunColor: THREE.Color;
  fillIntensity: number;
  fillColor: THREE.Color;
  screenIntensity: number;
  screenIntensityWide: number;
  screenColor: THREE.Color;
  lampIntensity: number;
  rimIntensity: number;
  emissive: number;
  bloomStrength: number;
  background: THREE.Color;
  fogColor: THREE.Color;
  fogDensity: number;
  rayOpacity: number;
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
  screenIntensity: 0.55,
  screenIntensityWide: 0.22,
  screenColor: new THREE.Color('#5cff9c'),
  lampIntensity: 0.1,
  rimIntensity: 0.25,
  emissive: 0.55,
  bloomStrength: 0.14,
  background: new THREE.Color('#42533f'),
  fogColor: new THREE.Color('#4d5f47'),
  fogDensity: 0.011,
  rayOpacity: 1,
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
  screenIntensity: 1.9,
  screenIntensityWide: 0.9,
  screenColor: new THREE.Color('#4dffa8'),
  lampIntensity: 0.3,
  rimIntensity: 0.08,
  emissive: 1.9,
  bloomStrength: 1.1,
  background: new THREE.Color('#020402'),
  fogColor: new THREE.Color('#040805'),
  fogDensity: 0.038,
  rayOpacity: 0,
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
    screenColor: state.screenColor.clone(),
    background: state.background.clone(),
    fogColor: state.fogColor.clone(),
  };
}

/**
 * Builds the mossy curved-monitor hero scene inside `container` and starts its render loop.
 * Ported from the design handoff prototype (`scene.js`) — see the handoff README for the
 * rationale behind the specific numeric values (camera/curvature/lighting tables) used below.
 */
export function createScene(container: HTMLElement): SceneHandle {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0a1410');
  const fog = new THREE.FogExp2('#0a1410', 0.03);
  scene.fog = fog;

  const camera = new THREE.PerspectiveCamera(
    35,
    container.clientWidth / container.clientHeight,
    0.1,
    200,
  );
  const camBase = new THREE.Vector3(3.6, 2.15, 7.1);
  camera.position.copy(camBase);
  camera.lookAt(0, 1.28, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // realistic environment reflections (soft studio/room lighting probe)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    1.1,
    0.75,
    0.55,
  );
  bloom.strength = 0.2;
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---- lights ----
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
  const screenLight = new THREE.PointLight('#5cff9c', 0.18, 6.5, 2);
  screenLight.position.set(0.4, 1.9, 1.3);
  scene.add(screenLight);
  const screenLightWide = new THREE.PointLight('#5cff9c', 0.35, 9, 1.6);
  screenLightWide.position.set(0, 1.35, 2.2);
  scene.add(screenLightWide);
  // warm practical (desk lamp glow) — dim, always present, more felt at night
  const lamp = new THREE.PointLight('#ffb168', 0.25, 5, 2);
  lamp.position.set(-2.1, 1.6, 1.4);
  scene.add(lamp);
  // soft rim/back light for silhouette separation from foliage
  const rim = new THREE.DirectionalLight('#8fd8c8', 0.3);
  rim.position.set(2, 3, -6);
  scene.add(rim);

  // ---- ground ----
  const groundTex = makeGroundTexture();
  const groundBump = makeGroundBump();
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(14, 64),
    new THREE.MeshStandardMaterial({
      map: groundTex,
      bumpMap: groundBump,
      bumpScale: 0.02,
      roughness: 0.95,
      metalness: 0.02,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // soft contact shadow blob under monitor for grounding
  const contactCanvas = document.createElement('canvas');
  contactCanvas.width = contactCanvas.height = 256;
  const contactCtx = contactCanvas.getContext('2d')!;
  const contactGradient = contactCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
  contactGradient.addColorStop(0, 'rgba(0,0,0,0.55)');
  contactGradient.addColorStop(1, 'rgba(0,0,0,0)');
  contactCtx.fillStyle = contactGradient;
  contactCtx.fillRect(0, 0, 256, 256);
  const contactTex = new THREE.CanvasTexture(contactCanvas);
  const contactShadow = new THREE.Mesh(
    new THREE.CircleGeometry(2.1, 32),
    new THREE.MeshBasicMaterial({ map: contactTex, transparent: true, depthWrite: false }),
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, 0.011, 0.7);
  scene.add(contactShadow);

  // ferns scattered
  const fernTex = makeFernTexture();
  const fernMat = new THREE.MeshBasicMaterial({
    map: fernTex,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2.6 + Math.random() * 8;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.abs(x) < 1.6 && z > -1 && z < 2.5) continue;
    const s = 0.6 + Math.random() * 0.9;
    const fern = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.3), fernMat);
    fern.position.set(x, s * 0.6, z);
    fern.rotation.y = Math.random() * Math.PI;
    fern.scale.setScalar(s);
    scene.add(fern);
    const fern2 = fern.clone();
    fern2.rotation.y += Math.PI / 2;
    scene.add(fern2);
  }

  // tree trunks in background
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#241a12', roughness: 0.95 });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.random() * 0.3;
    const r = 9 + Math.random() * 3;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25 + Math.random() * 0.2, 0.35 + Math.random() * 0.2, 9, 8),
      trunkMat,
    );
    trunk.position.set(Math.cos(a) * r, 4.5, Math.sin(a) * r);
    trunk.castShadow = true;
    scene.add(trunk);
  }

  // god rays (day only)
  const rayCanvas = document.createElement('canvas');
  rayCanvas.width = 64;
  rayCanvas.height = 256;
  const rayCtx = rayCanvas.getContext('2d')!;
  const rayGradient = rayCtx.createLinearGradient(0, 0, 0, 256);
  rayGradient.addColorStop(0, 'rgba(255,244,214,0.5)');
  rayGradient.addColorStop(1, 'rgba(255,244,214,0)');
  rayCtx.fillStyle = rayGradient;
  rayCtx.fillRect(0, 0, 64, 256);
  const rayTex = new THREE.CanvasTexture(rayCanvas);
  const rayMat = new THREE.MeshBasicMaterial({
    map: rayTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const rays: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const ray = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 11), rayMat.clone());
    ray.position.set(-4 - i * 1.2, 5, -3 + i * 1.5);
    ray.rotation.z = 0.35 + i * 0.05;
    ray.rotation.y = 0.5;
    scene.add(ray);
    rays.push(ray);
  }

  // ---- monitor group ----
  const monitor = new THREE.Group();
  monitor.position.set(0, 0, 0.4);
  scene.add(monitor);

  const plasticMat = new THREE.MeshStandardMaterial({
    color: '#d7d3c4',
    roughness: 0.6,
    metalness: 0.08,
    envMapIntensity: 0.6,
  });
  const plasticDarkMat = new THREE.MeshStandardMaterial({
    color: '#8b8878',
    roughness: 0.7,
    envMapIntensity: 0.5,
  });

  const backBox = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.7, 1.5), plasticMat);
  backBox.position.set(0, 1.35, -0.55);
  backBox.scale.set(0.82, 0.9, 1);
  backBox.castShadow = true;
  backBox.receiveShadow = true;
  monitor.add(backBox);

  const bezel = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.85, 0.3), plasticMat);
  bezel.position.set(0, 1.35, 0.15);
  bezel.castShadow = true;
  bezel.receiveShadow = true;
  monitor.add(bezel);

  for (let i = 0; i < 6; i++) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.9), plasticDarkMat);
    vent.position.set(0.75, 1.9 - i * 0.06, -0.5);
    monitor.add(vent);
  }

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.35, 12), plasticDarkMat);
  neck.position.set(0, 0.42, -0.1);
  monitor.add(neck);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.14, 20), plasticDarkMat);
  base.position.set(0, 0.28, -0.1);
  base.castShadow = true;
  base.receiveShadow = true;
  monitor.add(base);

  // curved screen (emissive UI) — arc centered on local +Z at radius R, so the visible
  // center point sits exactly at the bezel's front face after offsetting position.z by -R
  const chat = new ChatPanel();
  chat.texture.minFilter = THREE.LinearFilter;
  chat.texture.generateMipmaps = false;
  chat.texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const R = 4.2;
  const arcHalf = 0.25;
  const screenGeo = new THREE.CylinderGeometry(R, R, 1.5, 48, 1, true, -arcHalf, arcHalf * 2);
  const screenMat = new THREE.MeshStandardMaterial({
    map: chat.texture,
    emissive: new THREE.Color('#3dffa0'),
    emissiveMap: chat.texture,
    emissiveIntensity: 0.55,
    roughness: 0.55,
    metalness: 0.0,
    side: THREE.DoubleSide,
    envMapIntensity: 0.12,
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 1.35, 0.35 - R);
  monitor.add(screen);

  // thin glass layer over the screen for glare/reflection realism
  const Rg = R - 0.015;
  const glassGeo = new THREE.CylinderGeometry(Rg, Rg, 1.46, 48, 1, true, -arcHalf, arcHalf * 2);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#0a1410',
    transparent: true,
    opacity: 0.045,
    roughness: 0.2,
    metalness: 0,
    clearcoat: 0.15,
    clearcoatRoughness: 0.35,
    envMapIntensity: 0.4,
    side: THREE.FrontSide,
  });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.set(0, 1.35, 0.365 - Rg);
  monitor.add(glass);

  // moss clumps
  const mossMat = new THREE.MeshStandardMaterial({
    color: '#3d6b2c',
    roughness: 0.9,
    envMapIntensity: 0.3,
  });
  const mossGeo = new THREE.IcosahedronGeometry(0.09, 0);
  const mossSpots: Array<[number, number, number, number]> = [
    [-0.8, 2.25, -0.3, 14],
    [0.7, 2.28, -0.6, 12],
    [0.9, 1.95, 0.28, 6],
    [-0.95, 1.5, 0.25, 5],
    [0, 2.3, -0.9, 10],
  ];
  for (const [x, y, z, count] of mossSpots) {
    for (let i = 0; i < count; i++) {
      const clump = new THREE.Mesh(mossGeo, mossMat);
      clump.position.set(
        x + (Math.random() - 0.5) * 0.35,
        y + (Math.random() - 0.5) * 0.12,
        z + (Math.random() - 0.5) * 0.35,
      );
      clump.scale.setScalar(0.6 + Math.random() * 0.9);
      clump.castShadow = true;
      monitor.add(clump);
    }
  }

  // keyboard
  const keyboard = new THREE.Group();
  keyboard.position.set(0, 0.02, 2.3);
  const keyboardBase = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 0.9), plasticMat);
  keyboardBase.castShadow = true;
  keyboardBase.receiveShadow = true;
  keyboard.add(keyboardBase);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 13; c++) {
      const key = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.05, 0.13), plasticMat);
      key.position.set(-0.95 + c * 0.155, 0.09, -0.32 + r * 0.18);
      key.castShadow = true;
      keyboard.add(key);
    }
  }
  for (let i = 0; i < 8; i++) {
    const clump = new THREE.Mesh(mossGeo, mossMat);
    clump.position.set(-0.9 + Math.random() * 1.8, 0.1, 0.42 + Math.random() * 0.05);
    clump.scale.setScalar(0.5 + Math.random() * 0.7);
    keyboard.add(clump);
  }
  monitor.add(keyboard);

  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  // day/night state
  let target = DAY_STATE;
  const current = cloneState(DAY_STATE);

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
    current.screenIntensity += (target.screenIntensity - current.screenIntensity) * alpha;
    current.screenIntensityWide +=
      (target.screenIntensityWide - current.screenIntensityWide) * alpha;
    current.screenColor.lerp(target.screenColor, alpha);
    current.lampIntensity += (target.lampIntensity - current.lampIntensity) * alpha;
    current.rimIntensity += (target.rimIntensity - current.rimIntensity) * alpha;
    current.emissive += (target.emissive - current.emissive) * alpha;
    current.bloomStrength += (target.bloomStrength - current.bloomStrength) * alpha;
    current.background.lerp(target.background, alpha);
    current.fogColor.lerp(target.fogColor, alpha);
    current.fogDensity += (target.fogDensity - current.fogDensity) * alpha;
    current.rayOpacity += (target.rayOpacity - current.rayOpacity) * alpha;
    current.envIntensity += (target.envIntensity - current.envIntensity) * alpha;
    current.exposure += (target.exposure - current.exposure) * alpha;

    hemi.intensity = current.hemiIntensity;
    hemi.color.copy(current.hemiSky);
    hemi.groundColor.copy(current.hemiGround);
    sun.intensity = current.sunIntensity;
    sun.color.copy(current.sunColor);
    fill.intensity = current.fillIntensity;
    fill.color.copy(current.fillColor);
    screenLight.intensity = current.screenIntensity;
    screenLight.color.copy(current.screenColor);
    screenLightWide.intensity = current.screenIntensityWide;
    screenLightWide.color.copy(current.screenColor);
    lamp.intensity = current.lampIntensity;
    rim.intensity = current.rimIntensity;
    screenMat.emissiveIntensity = current.emissive;
    screenMat.emissive.copy(current.screenColor);
    bloom.strength = current.bloomStrength;
    (scene.background as THREE.Color).copy(current.background);
    fog.color.copy(current.fogColor);
    fog.density = current.fogDensity;
    renderer.toneMappingExposure = current.exposure;
    for (const ray of rays) {
      (ray.material as THREE.MeshBasicMaterial).opacity =
        current.rayOpacity * (0.5 + 0.5 * Math.sin(t * 0.6));
    }

    chat.cursorOn = Math.floor(t * 2) % 2 === 0;
    chat.draw();

    camera.position.set(
      camBase.x + Math.sin(t * 0.35) * 0.06,
      camBase.y + Math.sin(t * 0.5) * 0.035,
      camBase.z + Math.cos(t * 0.3) * 0.05,
    );
    camera.lookAt(0, 1.3, 0);

    composer.render();
  }
  animate();

  function dispose() {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);
    composer.dispose();
    renderer.dispose();
    envTex.dispose();
    pmrem.dispose();
    if (renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement);
    }
  }

  return {
    setMode,
    addMessage: (user, text) => chat.addMessage(user, text),
    setDraft: (text) => chat.setDraft(text),
    dispose,
  };
}
