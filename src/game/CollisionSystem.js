import * as THREE from "three";
const _playerBox = new THREE.Box3();
const _entityBox = new THREE.Box3();

export class CollisionSystem {
  /**
   * @param {import('./Player.js').Player} player
   * @param {Array<{ box: THREE.Box3, userData: object }>} entityBoxes — updated each frame from entities
   */
  constructor(player) {
    this.player = player;
  }

  /**
   * @returns {Array<{ entity: object, overlap: boolean }>}
   */
  testEntities(entities) {
    this.player.getWorldBox(_playerBox);
    const hits = [];
    for (const e of entities) {
      if (!e.active) continue;
      _entityBox.copy(e.worldBox);
      if (_playerBox.intersectsBox(_entityBox)) {
        hits.push({ entity: e, overlap: true });
      }
    }
    return hits;
  }
}

/**
 * Build AABB for obstacle/pickup mesh group at origin scale.
 */
export function setEntityBoxFromMesh(mesh, halfW, halfH, halfD, box) {
  const p = mesh.position;
  box.min.set(p.x - halfW, p.y - halfH, p.z - halfD);
  box.max.set(p.x + halfW, p.y + halfH, p.z + halfD);
}

export const HIT = {
  obstacle: { w: 0.85, h: 0.9, d: 0.95 },
  pickup: { w: 0.5, h: 0.55, d: 0.5 },
};
