import { LGraphNode } from 'litegraph.js';
import type * as THREE from 'three';
import type { SceneEditAccess } from '../../createScene';
import { activeState, type EditorState } from '../editorState';

function addColorWidgets(
  node: LGraphNode,
  label: string,
  getColor: () => THREE.Color,
): { r: { value: number }; g: { value: number }; b: { value: number } } {
  const color = getColor();
  const r = node.addWidget(
    'slider',
    `${label} r`,
    color.r,
    (v: number) => {
      getColor().r = v;
    },
    { min: 0, max: 1 },
  );
  const g = node.addWidget(
    'slider',
    `${label} g`,
    color.g,
    (v: number) => {
      getColor().g = v;
    },
    { min: 0, max: 1 },
  );
  const b = node.addWidget(
    'slider',
    `${label} b`,
    color.b,
    (v: number) => {
      getColor().b = v;
    },
    { min: 0, max: 1 },
  );
  return { r, g, b };
}

function addPositionWidgets(
  node: LGraphNode,
  light: THREE.Object3D,
): { x: { value: number }; y: { value: number }; z: { value: number } } {
  const x = node.addWidget('number', 'pos x', light.position.x, (v: number) => {
    light.position.x = v;
  });
  const y = node.addWidget('number', 'pos y', light.position.y, (v: number) => {
    light.position.y = v;
  });
  const z = node.addWidget('number', 'pos z', light.position.z, (v: number) => {
    light.position.z = v;
  });
  return { x, y, z };
}

export class HemiLightNode extends LGraphNode {
  private intensityWidget: { value: number };
  private skyWidgets: ReturnType<typeof addColorWidgets>;
  private groundWidgets: ReturnType<typeof addColorWidgets>;

  constructor(
    private edit: SceneEditAccess,
    private editorState: EditorState,
  ) {
    super('Light: Hemisphere');
    this.intensityWidget = this.addWidget(
      'slider',
      'intensity',
      activeState(edit, editorState).hemiIntensity,
      (v: number) => {
        activeState(edit, editorState).hemiIntensity = v;
      },
      { min: 0, max: 2 },
    );
    this.skyWidgets = addColorWidgets(this, 'sky', () => activeState(edit, editorState).hemiSky);
    this.groundWidgets = addColorWidgets(
      this,
      'ground',
      () => activeState(edit, editorState).hemiGround,
    );
    this.size = [220, 140];
  }

  syncFromLive() {
    const state = activeState(this.edit, this.editorState);
    this.intensityWidget.value = state.hemiIntensity;
    this.skyWidgets.r.value = state.hemiSky.r;
    this.skyWidgets.g.value = state.hemiSky.g;
    this.skyWidgets.b.value = state.hemiSky.b;
    this.groundWidgets.r.value = state.hemiGround.r;
    this.groundWidgets.g.value = state.hemiGround.g;
    this.groundWidgets.b.value = state.hemiGround.b;
    this.setDirtyCanvas(true, true);
  }
}

export class SunLightNode extends LGraphNode {
  private intensityWidget: { value: number };
  private colorWidgets: ReturnType<typeof addColorWidgets>;
  private posWidgets: ReturnType<typeof addPositionWidgets>;

  constructor(
    private edit: SceneEditAccess,
    private editorState: EditorState,
  ) {
    super('Light: Sun');
    this.intensityWidget = this.addWidget(
      'slider',
      'intensity',
      activeState(edit, editorState).sunIntensity,
      (v: number) => {
        activeState(edit, editorState).sunIntensity = v;
      },
      { min: 0, max: 2 },
    );
    this.colorWidgets = addColorWidgets(
      this,
      'color',
      () => activeState(edit, editorState).sunColor,
    );
    this.posWidgets = addPositionWidgets(this, edit.lights.sun);
    this.size = [220, 160];
  }

  syncFromLive() {
    const state = activeState(this.edit, this.editorState);
    this.intensityWidget.value = state.sunIntensity;
    this.colorWidgets.r.value = state.sunColor.r;
    this.colorWidgets.g.value = state.sunColor.g;
    this.colorWidgets.b.value = state.sunColor.b;
    this.posWidgets.x.value = this.edit.lights.sun.position.x;
    this.posWidgets.y.value = this.edit.lights.sun.position.y;
    this.posWidgets.z.value = this.edit.lights.sun.position.z;
    this.setDirtyCanvas(true, true);
  }
}

export class FillLightNode extends LGraphNode {
  private intensityWidget: { value: number };
  private colorWidgets: ReturnType<typeof addColorWidgets>;

  constructor(
    private edit: SceneEditAccess,
    private editorState: EditorState,
  ) {
    super('Light: Fill');
    this.intensityWidget = this.addWidget(
      'slider',
      'intensity',
      activeState(edit, editorState).fillIntensity,
      (v: number) => {
        activeState(edit, editorState).fillIntensity = v;
      },
      { min: 0, max: 2 },
    );
    this.colorWidgets = addColorWidgets(
      this,
      'color',
      () => activeState(edit, editorState).fillColor,
    );
    this.size = [220, 120];
  }

  syncFromLive() {
    const state = activeState(this.edit, this.editorState);
    this.intensityWidget.value = state.fillIntensity;
    this.colorWidgets.r.value = state.fillColor.r;
    this.colorWidgets.g.value = state.fillColor.g;
    this.colorWidgets.b.value = state.fillColor.b;
    this.setDirtyCanvas(true, true);
  }
}

export class LampLightNode extends LGraphNode {
  private intensityWidget: { value: number };
  private posWidgets: ReturnType<typeof addPositionWidgets>;

  constructor(
    private edit: SceneEditAccess,
    private editorState: EditorState,
  ) {
    super('Light: Lamp');
    this.intensityWidget = this.addWidget(
      'slider',
      'intensity',
      activeState(edit, editorState).lampIntensity,
      (v: number) => {
        activeState(edit, editorState).lampIntensity = v;
      },
      { min: 0, max: 2 },
    );
    this.posWidgets = addPositionWidgets(this, edit.lights.lamp);
    this.size = [220, 140];
  }

  syncFromLive() {
    this.intensityWidget.value = activeState(this.edit, this.editorState).lampIntensity;
    this.posWidgets.x.value = this.edit.lights.lamp.position.x;
    this.posWidgets.y.value = this.edit.lights.lamp.position.y;
    this.posWidgets.z.value = this.edit.lights.lamp.position.z;
    this.setDirtyCanvas(true, true);
  }
}

export class RimLightNode extends LGraphNode {
  private intensityWidget: { value: number };
  private posWidgets: ReturnType<typeof addPositionWidgets>;

  constructor(
    private edit: SceneEditAccess,
    private editorState: EditorState,
  ) {
    super('Light: Rim');
    this.intensityWidget = this.addWidget(
      'slider',
      'intensity',
      activeState(edit, editorState).rimIntensity,
      (v: number) => {
        activeState(edit, editorState).rimIntensity = v;
      },
      { min: 0, max: 2 },
    );
    this.posWidgets = addPositionWidgets(this, edit.lights.rim);
    this.size = [220, 140];
  }

  syncFromLive() {
    this.intensityWidget.value = activeState(this.edit, this.editorState).rimIntensity;
    this.posWidgets.x.value = this.edit.lights.rim.position.x;
    this.posWidgets.y.value = this.edit.lights.rim.position.y;
    this.posWidgets.z.value = this.edit.lights.rim.position.z;
    this.setDirtyCanvas(true, true);
  }
}
