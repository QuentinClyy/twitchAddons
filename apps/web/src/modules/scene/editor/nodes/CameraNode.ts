import { LGraphNode } from 'litegraph.js';
import type { SceneEditAccess } from '../../createScene';

export class CameraNode extends LGraphNode {
  private baseWidgets: { x: { value: number }; y: { value: number }; z: { value: number } };
  private lookAtWidgets: { x: { value: number }; y: { value: number }; z: { value: number } };
  private fovWidget: { value: number };

  constructor(private edit: SceneEditAccess) {
    super('Camera');
    const { camBase, camLookAt, camera } = edit;

    const bx = this.addWidget('number', 'base x', camBase.x, (v: number) => {
      camBase.x = v;
    });
    const by = this.addWidget('number', 'base y', camBase.y, (v: number) => {
      camBase.y = v;
    });
    const bz = this.addWidget('number', 'base z', camBase.z, (v: number) => {
      camBase.z = v;
    });
    this.baseWidgets = { x: bx, y: by, z: bz };

    const lx = this.addWidget('number', 'lookAt x', camLookAt.x, (v: number) => {
      camLookAt.x = v;
    });
    const ly = this.addWidget('number', 'lookAt y', camLookAt.y, (v: number) => {
      camLookAt.y = v;
    });
    const lz = this.addWidget('number', 'lookAt z', camLookAt.z, (v: number) => {
      camLookAt.z = v;
    });
    this.lookAtWidgets = { x: lx, y: ly, z: lz };

    this.fovWidget = this.addWidget('number', 'fov', camera.fov, (v: number) => {
      camera.fov = v;
      camera.updateProjectionMatrix();
    });

    this.size = [220, 220];
  }

  syncFromLive() {
    const { camBase, camLookAt, camera } = this.edit;
    this.baseWidgets.x.value = camBase.x;
    this.baseWidgets.y.value = camBase.y;
    this.baseWidgets.z.value = camBase.z;
    this.lookAtWidgets.x.value = camLookAt.x;
    this.lookAtWidgets.y.value = camLookAt.y;
    this.lookAtWidgets.z.value = camLookAt.z;
    this.fovWidget.value = camera.fov;
    this.setDirtyCanvas(true, true);
  }
}
