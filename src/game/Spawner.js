import * as THREE from "three";
import { CONFIG, OBSTACLE_TYPES } from "../data/config.js";
import { HIT, setEntityBoxFromMesh } from "./CollisionSystem.js";

let _id = 0;

function nextId() {
  _id += 1;
  return _id;
}

export class Spawner {
  constructor(scene) {
    this.scene = scene;
    /** @type {any[]} */
    this.obstacles = [];
    /** @type {any[]} */
    this.pickups = [];
    this.obstacleTimer = 0;
    this.pickupTimer = 1.2;
  }

  reset() {
    for (const e of this.obstacles) this._removeEntity(e);
    for (const e of this.pickups) this._removeEntity(e);
    this.obstacles.length = 0;
    this.pickups.length = 0;
    this.obstacleTimer = 0;
    this.pickupTimer = 1.2;
  }

  _removeEntity(e) {
    if (e.mesh.parent === this.scene) this.scene.remove(e.mesh);
    e.mesh.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        const m = c.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
    });
  }

  /**
   * @param {number} dt
   * @param {number} worldSpeed
   * @param {number} elapsedRunSeconds
   * @param {number} timeScale
   */
  update(dt, worldSpeed, elapsedRunSeconds, timeScale) {
    const warm = elapsedRunSeconds < CONFIG.WARMUP_SECONDS;
    const t = Math.min(1, elapsedRunSeconds / 120);
    const obstacleInterval = THREE.MathUtils.lerp(
      CONFIG.OBSTACLE_SPAWN_BASE,
      CONFIG.OBSTACLE_SPAWN_MIN,
      t
    );
    const pickupInterval = THREE.MathUtils.lerp(
      CONFIG.PICKUP_SPAWN_BASE,
      CONFIG.PICKUP_SPAWN_MIN,
      t * 0.85
    );

    if (warm) {
      this.obstacleTimer += dt * 0.65 * timeScale;
      this.pickupTimer += dt * 0.7 * timeScale;
    } else {
      this.obstacleTimer += dt * timeScale;
      this.pickupTimer += dt * timeScale;
    }

    if (this.obstacleTimer >= obstacleInterval) {
      this.obstacleTimer = 0;
      this._spawnObstacleRow(elapsedRunSeconds, warm);
    }

    if (this.pickupTimer >= pickupInterval) {
      this.pickupTimer = 0;
      this._spawnPickup(elapsedRunSeconds, warm);
    }

    const dz = worldSpeed * dt * timeScale;
    this._advanceEntities(this.obstacles, dz);
    this._advanceEntities(this.pickups, dz);
    this._animateObstacles(dt);
    this._animatePickups(dt);

    for (const e of this.obstacles) {
      if (e.active) this._syncBox(e);
    }
    for (const e of this.pickups) {
      if (e.active) this._syncBox(e);
    }
  }

  _advanceEntities(list, dz) {
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      if (!e.active) continue;
      e.mesh.position.z += dz;
      e.z = e.mesh.position.z;
      if (e.mesh.position.z > CONFIG.DESPAWN_Z) {
        e.active = false;
        list.splice(i, 1);
        this._removeEntity(e);
      }
    }
  }

  _syncBox(e) {
    const h = e.hit;
    setEntityBoxFromMesh(e.mesh, h.w, h.h, h.d, e.worldBox);
  }

  _spawnObstacleRow(elapsed, warm) {
    const fullWall =
      !warm && Math.random() < CONFIG.FULL_WALL_CHANCE * (elapsed > 45 ? 1.2 : 0.5);

    let blocked = [];
    if (fullWall) {
      blocked = [0, 1, 2];
    } else {
      const count = warm
        ? 1
        : Math.random() < 0.52
          ? 1
          : Math.random() < 0.78
            ? 2
            : 3;
      if (count === 1) {
        blocked.push(lanes[Math.floor(Math.random() * 3)]);
      } else if (count === 2) {
        const a = Math.floor(Math.random() * 3);
        let b = Math.floor(Math.random() * 3);
        while (b === a) b = (b + 1) % 3;
        blocked.push(a, b);
      } else {
        blocked.push(0, 1, 2);
      }
    }

    const baseZ = CONFIG.SPAWN_Z - Math.random() * 4;
    for (const lane of blocked) {
      const type =
        OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
      const z = baseZ + (Math.random() - 0.5) * 0.4;
      this._addObstacle(type, lane, z);
    }
  }

  _spawnPickup(elapsed, warm) {
    const lane = Math.floor(Math.random() * 3);
    const z = CONFIG.SPAWN_Z - Math.random() * 15;

    // Boost token rarity
    let roll = Math.random();
    let type;
    if (roll < (warm ? 0.04 : 0.07)) {
      type = "BOOST_TOKEN";
    } else if (roll < 0.35) {
      type = "PLAYBOOK";
    } else if (roll < 0.6) {
      type = "CERTIFIED_COLLECTION";
    } else if (roll < 0.82) {
      type = "POLICY_SHIELD";
    } else {
      type = Math.random() < 0.5 ? "PLAYBOOK" : "CERTIFIED_COLLECTION";
    }

    // Try not to overlap pickup inside same lane very close to obstacle
    const tooClose = this.obstacles.some(
      (o) =>
        o.lane === lane &&
        Math.abs(o.mesh.position.z - z) < CONFIG.MIN_OBSTACLE_GAP * 0.9
    );
    if (tooClose) {
      const alt = (lane + 1) % 3;
      this._addPickup(type, alt, z);
    } else {
      this._addPickup(type, lane, z);
    }
  }

  _addObstacle(type, lane, z) {
    const mesh = this._makeObstacleMesh(type);
    const x = CONFIG.LANES[lane];
    mesh.position.set(x, 0.75, z);
    this.scene.add(mesh);
    const hit = { ...HIT.obstacle };
    if (type === "TICKET_FLOOD") {
      hit.w = 1.1;
      hit.h = 1.1;
      hit.d = 0.85;
    }
    if (type === "PATCH_FAILURE") {
      hit.w = 1.2;
      hit.h = 0.75;
      hit.d = 0.55;
    }
    const e = {
      id: nextId(),
      kind: "obstacle",
      subtype: type,
      lane,
      mesh,
      z,
      active: true,
      worldBox: new THREE.Box3(),
      hit,
      flashT: 0,
    };
    this._syncBox(e);
    this.obstacles.push(e);
  }

  _addPickup(type, lane, z) {
    const mesh = this._makePickupMesh(type);
    const x = CONFIG.LANES[lane];
    mesh.position.set(x, 0.65, z);
    this.scene.add(mesh);
    const e = {
      id: nextId(),
      kind: "pickup",
      subtype: type,
      lane,
      mesh,
      z,
      active: true,
      worldBox: new THREE.Box3(),
      hit: { ...HIT.pickup },
      bobPhase: Math.random() * Math.PI * 2,
    };
    this._syncBox(e);
    this.pickups.push(e);
  }

  _makeObstacleMesh(type) {
    const g = new THREE.Group();
    let mat;
    switch (type) {
      case "CONFIG_DRIFT": {
        mat = new THREE.MeshStandardMaterial({
          color: 0xff2222,
          emissive: 0xff0000,
          emissiveIntensity: 0.45,
        });
        const cube = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.2), mat);
        cube.position.y = 0.2;
        g.add(cube);
        const warn = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.15, 0.05),
          new THREE.MeshBasicMaterial({ color: 0xffff00 })
        );
        warn.position.set(0, 0.85, 0.61);
        g.add(warn);
        break;
      }
      case "PATCH_FAILURE": {
        mat = new THREE.MeshStandardMaterial({
          color: 0xff8800,
          emissive: 0xaa4400,
          emissiveIntensity: 0.35,
        });
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 1.0, 0.7),
          mat
        );
        bar.position.y = 0.35;
        g.add(bar);
        break;
      }
      case "TICKET_FLOOD": {
        mat = new THREE.MeshStandardMaterial({
          color: 0x8866ff,
          metalness: 0.3,
          roughness: 0.5,
        });
        for (let i = 0; i < 5; i++) {
          const s = new THREE.Mesh(
            new THREE.BoxGeometry(0.35 + Math.random() * 0.2, 0.25, 0.45),
            mat.clone()
          );
          s.position.set(
            (Math.random() - 0.5) * 0.5,
            i * 0.28,
            (Math.random() - 0.5) * 0.3
          );
          g.add(s);
        }
        break;
      }
      case "ALERT_STORM": {
        mat = new THREE.MeshStandardMaterial({
          color: 0xff0044,
          emissive: 0xff0000,
          emissiveIntensity: 0.9,
        });
        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.55, 2.4, 8),
          mat
        );
        pillar.position.y = 1.2;
        g.add(pillar);
        g.userData.flash = mat;
        break;
      }
      case "MANUAL_TOIL":
      default: {
        mat = new THREE.MeshStandardMaterial({
          color: 0x555560,
          metalness: 0.4,
          roughness: 0.55,
        });
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, 0.9, 1.0),
          mat
        );
        body.position.y = 0.35;
        g.add(body);
        const handle = new THREE.Mesh(
          new THREE.TorusGeometry(0.15, 0.04, 6, 12, Math.PI),
          new THREE.MeshStandardMaterial({ color: 0x333340 })
        );
        handle.position.set(0.5, 0.55, 0);
        handle.rotation.z = Math.PI / 2;
        g.add(handle);
        break;
      }
    }
    return g;
  }

  _makePickupMesh(type) {
    const g = new THREE.Group();
    let color = 0x0088ff;
    let emissive = 0x002244;
    if (type === "CERTIFIED_COLLECTION") {
      color = 0x00ff66;
      emissive = 0x004422;
    } else if (type === "POLICY_SHIELD") {
      color = 0xaa44ff;
      emissive = 0x220044;
    } else if (type === "BOOST_TOKEN") {
      color = 0xffdd00;
      emissive = 0xffaa00;
    }
    const mat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.25,
      roughness: 0.35,
      emissive,
      emissiveIntensity: 0.5,
    });
    const geo =
      type === "BOOST_TOKEN"
        ? new THREE.OctahedronGeometry(0.55, 0)
        : new THREE.IcosahedronGeometry(0.5, 0);
    const core = new THREE.Mesh(geo, mat);
    g.add(core);
    g.userData.core = core;
    return g;
  }

  _animateObstacles(dt) {
    const t = performance.now() * 0.001;
    for (const e of this.obstacles) {
      if (!e.active) continue;
      if (e.subtype === "ALERT_STORM" && e.mesh.userData.flash) {
        const m = e.mesh.userData.flash;
        m.emissiveIntensity = 0.5 + Math.sin(t * 12) * 0.45;
      }
      e.mesh.rotation.y += dt * 0.4;
    }
  }

  _animatePickups(dt) {
    const t = performance.now() * 0.001;
    for (const e of this.pickups) {
      if (!e.active) continue;
      const baseY = 0.65;
      e.mesh.position.y =
        baseY + Math.sin(t * 3 + e.bobPhase) * 0.12;
      const c = e.mesh.userData.core;
      if (c) {
        c.rotation.x += dt * 1.8;
        c.rotation.y += dt * 2.2;
      }
    }
  }

  /**
   * Pull pickups toward player X when magnet active
   */
  applyMagnet(playerX, strength, dt) {
    for (const e of this.pickups) {
      if (!e.active || e.subtype === "BOOST_TOKEN") continue;
      const x = e.mesh.position.x;
      const dx = playerX - x;
      e.mesh.position.x += dx * Math.min(1, strength * dt);
    }
  }

  getAllCollidable() {
    return [...this.obstacles, ...this.pickups].filter((e) => e.active);
  }

  removeEntity(e) {
    if (!e) return;
    e.active = false;
    const list = e.kind === "obstacle" ? this.obstacles : this.pickups;
    const i = list.indexOf(e);
    if (i >= 0) list.splice(i, 1);
    this._removeEntity(e);
  }
}
