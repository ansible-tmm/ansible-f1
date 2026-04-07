import * as THREE from "three";
/**
 * Dark roadway, glowing lane markers, rack props, horizon grid.
 */
export class Track {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);

    this._road();
    this._laneMarkers();
    this._sideProps();
    this._horizon();
    this._lights();
  }

  _road() {
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 400),
      new THREE.MeshStandardMaterial({
        color: 0x0a0a12,
        metalness: 0.2,
        roughness: 0.85,
      })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0;
    road.receiveShadow = true;
    this.group.add(road);

    const edgeL = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.08, 420),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        emissive: 0x220044,
        emissiveIntensity: 0.6,
      })
    );
    edgeL.position.set(-5.8, 0.05, -40);
    this.group.add(edgeL);

    const edgeR = edgeL.clone();
    edgeR.position.x = 5.8;
    this.group.add(edgeR);
  }

  _laneMarkers() {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      transparent: true,
      opacity: 0.85,
    });
    for (let z = -200; z < 80; z += 8) {
      for (const x of [-1.6, 1.6]) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 3.2), mat);
        m.position.set(x, 0.03, z);
        this.group.add(m);
      }
    }
  }

  _sideProps() {
    const rackMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a3a,
      metalness: 0.5,
      roughness: 0.4,
      emissive: 0x001020,
      emissiveIntensity: 0.3,
    });
    for (let i = 0; i < 24; i++) {
      const z = -180 + i * 14;
      const rack = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 3 + Math.random() * 1.5, 1.5),
        rackMat
      );
      rack.position.set(-8.5, 1.5, z);
      this.group.add(rack);
      const rack2 = rack.clone();
      rack2.position.x = 8.5;
      this.group.add(rack2);

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 5, 6),
        new THREE.MeshStandardMaterial({
          color: 0x333344,
          emissive: 0x110022,
          emissiveIntensity: 0.2,
        })
      );
      pole.position.set(-11, 2.5, z + 4);
      this.group.add(pole);
      const pole2 = pole.clone();
      pole2.position.x = 11;
      this.group.add(pole2);
    }
  }

  _horizon() {
    const grid = new THREE.GridHelper(400, 80, 0x224466, 0x112233);
    grid.position.y = 0.01;
    grid.position.z = -120;
    const s = grid.scale;
    s.x = 1.2;
    s.z = 1.5;
    this.group.add(grid);

    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 200),
      new THREE.MeshBasicMaterial({
        color: 0x050510,
        transparent: true,
        opacity: 0.95,
      })
    );
    sky.position.set(0, 80, -200);
    this.group.add(sky);
  }

  _lights() {
    const amb = new THREE.AmbientLight(0x334455, 0.45);
    this.group.add(amb);
    const d = new THREE.DirectionalLight(0xaaccff, 0.35);
    d.position.set(10, 40, 20);
    this.group.add(d);
    const p = new THREE.PointLight(0xff00aa, 0.4, 100);
    p.position.set(0, 8, -30);
    this.group.add(p);
  }

  update(dt, scrollOffset) {
    // Subtle parallax: shift lane marker material feel via group z drift optional
    this.group.position.z = (scrollOffset * 0.02) % 4;
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        const m = c.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
    });
  }
}
