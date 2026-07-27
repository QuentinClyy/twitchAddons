import { LGraphNode } from 'litegraph.js';
import type { SceneEditAccess } from '../../createScene';
import type { EditorState } from '../editorState';

export class SceneModeNode extends LGraphNode {
  constructor(edit: SceneEditAccess, editorState: EditorState) {
    super('Preview Mode');
    this.addWidget(
      'combo',
      'mode',
      editorState.previewMode,
      (v: string) => {
        const isNight = v === 'night';
        editorState.previewMode = isNight ? 'night' : 'day';
        edit.setPreviewMode(isNight);
      },
      { values: ['day', 'night'] },
    );
    this.size = [200, 60];
  }
}
