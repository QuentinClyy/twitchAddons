import { LGraph, LGraphCanvas, type LGraphNode } from 'litegraph.js';
import type { SceneEditAccess } from '../createScene';
import type { EditorState } from './editorState';
import {
  HemiLightNode,
  SunLightNode,
  FillLightNode,
  LampLightNode,
  RimLightNode,
} from './nodes/LightNode';
import { ModelTransformNode } from './nodes/ModelTransformNode';
import { CameraNode } from './nodes/CameraNode';
import { SceneModeNode } from './nodes/SceneModeNode';
import { ExportNode } from './nodes/ExportNode';
import { EnvironmentNode } from './nodes/EnvironmentNode';

export interface SceneGraphHandle {
  canvasElement: HTMLCanvasElement;
  syncFromLive(): void;
  isPointerActive(): boolean;
  dispose(): void;
}

interface SyncableNode extends LGraphNode {
  syncFromLive?(): void;
}

export function createSceneGraph(
  edit: SceneEditAccess,
  editorState: EditorState,
  panelWidth: number,
): SceneGraphHandle {
  const graph = new LGraph();

  const height = 260;
  const canvasEl = document.createElement('canvas');
  canvasEl.width = panelWidth;
  canvasEl.height = height;
  canvasEl.style.position = 'absolute';
  canvasEl.style.bottom = '0';
  canvasEl.style.left = '0';
  canvasEl.style.width = `${panelWidth}px`;
  canvasEl.style.height = `${height}px`;
  canvasEl.style.background = 'rgba(10,14,12,0.85)';

  const lgCanvas = new LGraphCanvas(canvasEl, graph);
  lgCanvas.allow_dragcanvas = true;

  const nodes: SyncableNode[] = [
    new HemiLightNode(edit, editorState),
    new SunLightNode(edit, editorState),
    new FillLightNode(edit, editorState),
    new LampLightNode(edit, editorState),
    new RimLightNode(edit, editorState),
    new EnvironmentNode(edit, editorState),
    new ModelTransformNode(edit),
    new CameraNode(edit),
    new SceneModeNode(edit, editorState),
    new ExportNode(edit),
  ];

  let x = 10;
  for (const node of nodes) {
    node.pos = [x, 10];
    graph.add(node);
    x += node.size[0] + 16;
  }

  lgCanvas.startRendering();

  let pointerActive = false;
  const onPointerDown = () => {
    pointerActive = true;
  };
  const onPointerUp = () => {
    pointerActive = false;
  };
  canvasEl.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  function syncFromLive() {
    for (const node of nodes) {
      node.syncFromLive?.();
    }
  }

  function dispose() {
    lgCanvas.stopRendering();
    canvasEl.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
  }

  return {
    canvasElement: canvasEl,
    syncFromLive,
    isPointerActive: () => pointerActive,
    dispose,
  };
}
