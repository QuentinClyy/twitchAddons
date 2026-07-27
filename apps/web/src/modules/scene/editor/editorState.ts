import type { SceneEditAccess, LightingState } from '../createScene';

export interface EditorState {
  previewMode: 'day' | 'night';
}

export function activeState(edit: SceneEditAccess, editorState: EditorState): LightingState {
  return editorState.previewMode === 'night' ? edit.nightState : edit.dayState;
}
