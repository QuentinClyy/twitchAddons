import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import type { SceneHandle } from '../createScene';
import type { EditorState } from './editorState';
import { createSceneGraph } from './sceneGraph';

export interface EditorHandle {
  unmount(): void;
}

const MARKER_GEOMETRY = new THREE.SphereGeometry(0.08, 16, 16);

function createMarker(color: string): THREE.Mesh {
  const material = new THREE.MeshBasicMaterial({ color, depthTest: false });
  const marker = new THREE.Mesh(MARKER_GEOMETRY, material);
  marker.renderOrder = 999;
  return marker;
}

export function mountEditor(handle: SceneHandle, container: HTMLElement): EditorHandle {
  const { edit } = handle;
  const { camera, renderer, scene, monitor, lights } = edit;

  edit.setIdleAnimationEnabled(false);

  const editorState: EditorState = { previewMode: 'night' };
  const sceneGraph = createSceneGraph(edit, editorState, container.clientWidth);
  sceneGraph.canvasElement.style.zIndex = '20';
  container.appendChild(sceneGraph.canvasElement);

  const orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.target.copy(edit.camLookAt);

  const transformControls = new TransformControls(camera, renderer.domElement);
  scene.add(transformControls);
  transformControls.addEventListener('dragging-changed', (event) => {
    orbitControls.enabled = !(event as unknown as { value: boolean }).value;
  });

  const lightMarkers: THREE.Mesh[] = [];
  const positionedLights = [lights.sun, lights.lamp, lights.rim];
  for (const light of positionedLights) {
    const marker = createMarker('#ffcc00');
    light.add(marker);
    lightMarkers.push(marker);
  }

  const camBaseMarker = createMarker('#00ccff');
  camBaseMarker.position.copy(edit.camBase);
  scene.add(camBaseMarker);

  const camLookAtMarker = createMarker('#ff00cc');
  camLookAtMarker.position.copy(edit.camLookAt);
  scene.add(camLookAtMarker);

  const pickableRoots: THREE.Object3D[] = [
    monitor,
    lights.sun,
    lights.lamp,
    lights.rim,
    camBaseMarker,
    camLookAtMarker,
  ];

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function resolveRoot(obj: THREE.Object3D): THREE.Object3D | null {
    let current: THREE.Object3D | null = obj;
    while (current) {
      if (pickableRoots.includes(current)) return current;
      current = current.parent;
    }
    return null;
  }

  function onPointerDown(event: PointerEvent) {
    if (transformControls.dragging) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pickableRoots, true);
    if (hits.length === 0) return;
    const root = resolveRoot(hits[0].object);
    if (!root) return;
    transformControls.attach(root);
    if (root === camBaseMarker || root === camLookAtMarker) {
      transformControls.setMode('translate');
    }
  }
  renderer.domElement.addEventListener('pointerdown', onPointerDown);

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'w') transformControls.setMode('translate');
    else if (event.key === 'e') transformControls.setMode('rotate');
    else if (event.key === 'r') transformControls.setMode('scale');
    else if (event.key === 'Escape') transformControls.detach();
  }
  window.addEventListener('keydown', onKeyDown);

  let rafId = 0;
  function tick() {
    rafId = requestAnimationFrame(tick);
    orbitControls.update();

    const draggingCamBase =
      transformControls.object === camBaseMarker && transformControls.dragging;
    const draggingCamLookAt =
      transformControls.object === camLookAtMarker && transformControls.dragging;
    if (draggingCamBase) edit.camBase.copy(camBaseMarker.position);
    else camBaseMarker.position.copy(edit.camBase);
    if (draggingCamLookAt) edit.camLookAt.copy(camLookAtMarker.position);
    else camLookAtMarker.position.copy(edit.camLookAt);

    if (!sceneGraph.isPointerActive()) {
      sceneGraph.syncFromLive();
    }
  }
  tick();

  function unmount() {
    cancelAnimationFrame(rafId);
    renderer.domElement.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('keydown', onKeyDown);

    sceneGraph.dispose();
    if (sceneGraph.canvasElement.parentElement === container) {
      container.removeChild(sceneGraph.canvasElement);
    }

    transformControls.detach();
    transformControls.dispose();
    scene.remove(transformControls);
    orbitControls.dispose();

    for (let i = 0; i < positionedLights.length; i++) {
      const marker = lightMarkers[i];
      positionedLights[i].remove(marker);
      (marker.material as THREE.Material).dispose();
    }

    scene.remove(camBaseMarker);
    scene.remove(camLookAtMarker);
    (camBaseMarker.material as THREE.Material).dispose();
    (camLookAtMarker.material as THREE.Material).dispose();

    edit.setIdleAnimationEnabled(true);
  }

  return { unmount };
}
