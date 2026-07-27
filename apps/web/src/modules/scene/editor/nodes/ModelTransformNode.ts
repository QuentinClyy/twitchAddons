import { LGraphNode } from 'litegraph.js';
import type { SceneEditAccess } from '../../createScene';

export class ModelTransformNode extends LGraphNode {
  private posWidgets: { x: { value: number }; y: { value: number }; z: { value: number } };
  private rotWidgets: { x: { value: number }; y: { value: number }; z: { value: number } };
  private scaleWidget: { value: number };

  constructor(private edit: SceneEditAccess) {
    super('Model Transform');
    const { monitor } = edit;

    const x = this.addWidget('number', 'pos x', monitor.position.x, (v: number) => {
      monitor.position.x = v;
    });
    const y = this.addWidget('number', 'pos y', monitor.position.y, (v: number) => {
      monitor.position.y = v;
    });
    const z = this.addWidget('number', 'pos z', monitor.position.z, (v: number) => {
      monitor.position.z = v;
    });
    this.posWidgets = { x, y, z };

    const rx = this.addWidget('number', 'rot x', monitor.rotation.x, (v: number) => {
      monitor.rotation.x = v;
    });
    const ry = this.addWidget('number', 'rot y', monitor.rotation.y, (v: number) => {
      monitor.rotation.y = v;
    });
    const rz = this.addWidget('number', 'rot z', monitor.rotation.z, (v: number) => {
      monitor.rotation.z = v;
    });
    this.rotWidgets = { x: rx, y: ry, z: rz };

    this.scaleWidget = this.addWidget('number', 'scale', monitor.scale.x, (v: number) => {
      monitor.scale.setScalar(v);
    });

    this.size = [220, 220];
  }

  syncFromLive() {
    const { monitor } = this.edit;
    this.posWidgets.x.value = monitor.position.x;
    this.posWidgets.y.value = monitor.position.y;
    this.posWidgets.z.value = monitor.position.z;
    this.rotWidgets.x.value = monitor.rotation.x;
    this.rotWidgets.y.value = monitor.rotation.y;
    this.rotWidgets.z.value = monitor.rotation.z;
    this.scaleWidget.value = monitor.scale.x;
    this.setDirtyCanvas(true, true);
  }
}
