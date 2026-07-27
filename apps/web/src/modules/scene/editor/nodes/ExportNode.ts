import { LGraphNode } from 'litegraph.js';
import type * as THREE from 'three';
import type { SceneEditAccess, LightingState } from '../../createScene';
import type { SceneConfig, LightingConfigState, Vec3Tuple } from '../../sceneConfig';

// THREE.Color stores components in linear space internally; getHexString() converts back to
// sRGB (matching how `new THREE.Color('#hex')`/`.set('#hex')` interpret hex strings elsewhere in
// this codebase). A naive r/g/b*255 byte conversion here would skip that conversion and produce
// a hex value that gets progressively wrong every export->reload->re-tune round trip.
function colorToHex(color: THREE.Color): string {
  return `#${color.getHexString()}`;
}

function toVec3Tuple(v: { x: number; y: number; z: number }): Vec3Tuple {
  return { x: v.x, y: v.y, z: v.z };
}

function toLightingConfigState(state: LightingState): LightingConfigState {
  return {
    hemiIntensity: state.hemiIntensity,
    hemiSky: colorToHex(state.hemiSky),
    hemiGround: colorToHex(state.hemiGround),
    sunIntensity: state.sunIntensity,
    sunColor: colorToHex(state.sunColor),
    fillIntensity: state.fillIntensity,
    fillColor: colorToHex(state.fillColor),
    lampIntensity: state.lampIntensity,
    lampColor: colorToHex(state.lampColor),
    rimIntensity: state.rimIntensity,
    rimColor: colorToHex(state.rimColor),
    background: colorToHex(state.background),
    envIntensity: state.envIntensity,
    exposure: state.exposure,
  };
}

function buildSceneConfig(edit: SceneEditAccess): SceneConfig {
  return {
    version: 1,
    day: toLightingConfigState(edit.dayState),
    night: toLightingConfigState(edit.nightState),
    lightPositions: {
      sun: toVec3Tuple(edit.lights.sun.position),
      lamp: toVec3Tuple(edit.lights.lamp.position),
      rim: toVec3Tuple(edit.lights.rim.position),
    },
    camera: {
      base: toVec3Tuple(edit.camBase),
      lookAt: toVec3Tuple(edit.camLookAt),
      fov: edit.camera.fov,
    },
    model: {
      position: toVec3Tuple(edit.monitor.position),
      scale: edit.monitor.scale.x,
    },
  };
}

export class ExportNode extends LGraphNode {
  constructor(private edit: SceneEditAccess) {
    super('Export Scene Config');
    this.addWidget('button', 'Export', null, () => {
      this.exportConfig();
    });
    this.size = [200, 50];
  }

  private exportConfig() {
    const config = buildSceneConfig(this.edit);
    const json = JSON.stringify(config, null, 2);

    navigator.clipboard?.writeText(json).catch(() => {
      // Clipboard access can fail (permissions/insecure context) — the download still works.
    });

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sceneConfig.json';
    link.click();
    URL.revokeObjectURL(url);
  }
}
