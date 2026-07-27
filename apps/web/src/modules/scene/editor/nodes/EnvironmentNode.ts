import { LGraphNode } from 'litegraph.js';
import type { SceneEditAccess } from '../../createScene';
import { activeState, type EditorState } from '../editorState';

export class EnvironmentNode extends LGraphNode {
  private envWidget: { value: number };
  private exposureWidget: { value: number };

  constructor(
    private edit: SceneEditAccess,
    private editorState: EditorState,
  ) {
    super('Environment');
    this.envWidget = this.addWidget(
      'slider',
      'env intensity',
      activeState(edit, editorState).envIntensity,
      (v: number) => {
        activeState(edit, editorState).envIntensity = v;
      },
      { min: 0, max: 2 },
    );
    this.exposureWidget = this.addWidget(
      'slider',
      'exposure',
      activeState(edit, editorState).exposure,
      (v: number) => {
        activeState(edit, editorState).exposure = v;
      },
      { min: 0, max: 3 },
    );
    this.size = [220, 100];
  }

  syncFromLive() {
    const state = activeState(this.edit, this.editorState);
    this.envWidget.value = state.envIntensity;
    this.exposureWidget.value = state.exposure;
    this.setDirtyCanvas(true, true);
  }
}
