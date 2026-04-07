import * as THREE from "three";
import { CONFIG } from "../data/config.js";

/**
 * Hover-style runner: wedge/boxy car, smooth lane lerp.
 */
export class Player {
  constructor(scene) {
    this.scene = scene;
    this.laneIndex = 1;
    this.targetLaneIndex = 1;
    this.mesh = this._buildMesh();
    this.mesh.position.set(
      CONFIG.LANES[this.laneIndex],
      CONFIG.PLAYER_Y,
      0
    );
    scene.add(this.mesh);

    this.flowGlow = null;
    this._buildFlowGlow();
  }

  _buildMesh() {
    const g = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      metalness: 0.35,
      roughness: 0.45,
      emissive: 0x001a22,
      emissiveIntensity: 0.4,
    });
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.45, 1.8),
      bodyMat
    );
    hull.position.y = 0.1;
    g.add(hull);

    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 0.9, 4),
      bodyMat.clone()
    );
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.15, -0.95);
    g.add(nose);

    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.35, 0.4),
      new THREE.MeshStandardMaterial({
        color: 0xff3366,
        emissive: 0x440011,
        emissiveIntensity: 0.5,
      })
    );
    fin.position.set(0, 0.45, 0.5);
    g.add(fin);

    const glow = new THREE.PointLight(0x00ffff, 0.6, 8);
    glow.position.set(0, 0.5, 0);
    g.add(glow);
    this.pointLight = glow;

    g.castShadow = true;
    return g;
  }

  _buildFlowGlow() {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.08, 8, 24),
      new THREE.MeshBasicMaterial({
        color: 0x66ffcc,
        transparent: true,
        opacity: 0,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05;
    this.mesh.add(ring);
    this.flowGlow = ring;
  }

  setAutomationFlowActive(on) {
    if (!this.flowGlow) return;
    this.flowGlow.material.opacity = on ? 0.85 : 0;
    this.pointLight.intensity = on ? 1.2 : 0.6;
    this.pointLight.color.setHex(on ? 0x66ffcc : 0x00ffff);
  }

  moveLeft() {
    if (this.targetLaneIndex > 0) {
      this.targetLaneIndex--;
    }
  }

  moveRight() {
    if (this.targetLaneIndex < 2) {
      this.targetLaneIndex++;
    }
  }

  update(dt) {
    const tx = CONFIG.LANES[this.targetLaneIndex];
    this.laneIndex = this.targetLaneIndex;
    this.mesh.position.x = THREE.MathUtils.lerp(
      this.mesh.position.x,
      tx,
      1 - Math.exp(-CONFIG.LANE_LERP * dt)
    );

    const bob = Math.sin(performance.now() * 0.004) * 0.04;
    this.mesh.position.y = CONFIG.PLAYER_Y + bob;
    this.mesh.rotation.z = THREE.MathUtils.lerp(
      this.mesh.rotation.z,
      -(this.mesh.position.x - tx) * 0.12,
      0.15
    );
    this.mesh.rotation.y = Math.sin(performance.now() * 0.002) * 0.03;

    if (this.flowGlow && this.flowGlow.material.opacity > 0.01) {
      this.flowGlow.rotation.z += dt * 2.2;
    }
  }

  getWorldBox(target) {
    const hw = CONFIG.PLAYER_HALF_WIDTH;
    const hd = CONFIG.PLAYER_HALF_DEPTH;
    const p = this.mesh.position;
    target.min.set(p.x - hw, p.y - 0.35, p.z - hd);
    target.max.set(p.x + hw, p.y + 0.45, p.z + hd);
    return target;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        const m = c.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
    });
  }
}
