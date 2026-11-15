import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TROPHIES, TrophyId } from '../types/game';

function detectSoftwareGl(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class TrophyRoomScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private isSoftwareGl: boolean;
  private frameId = 0;
  private disposed = false;
  private trophyGroups: Array<{ id: TrophyId; group: THREE.Group; hitMesh: THREE.Mesh; unlocked: boolean }> = [];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private onSelect: (id: TrophyId) => void;
  private cleanupEvents = () => {};

  constructor(
    container: HTMLElement,
    unlocked: TrophyId[],
    onSelect: (id: TrophyId) => void
  ) {
    this.container = container;
    this.onSelect = onSelect;
    this.isSoftwareGl = detectSoftwareGl();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#090e17');
    this.scene.fog = new THREE.FogExp2('#090e17', 0.032);

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 500;
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    this.camera.position.set(0, 4.2, 11.5);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.target.set(0, 1.35, 0);
    this.controls.minDistance = 4;
    this.controls.maxDistance = 18;
    this.controls.maxPolarAngle = Math.PI * 0.48;

    // Gallery lighting
    const hemi = new THREE.HemisphereLight('#bae6fd', '#0f172a', 0.65);
    const key = new THREE.DirectionalLight('#fef3c7', 2.0);
    key.position.set(6, 12, 8);
    const rim = new THREE.DirectionalLight('#38bdf8', 0.9);
    rim.position.set(-8, 6, -6);
    this.scene.add(hemi, key, rim);

    // Polished marble gallery floor
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(16, 48),
      new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.28, metalness: 0.2 })
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    this.buildTrophies(unlocked);
    this.bindEvents();
    this.startLoop();
  }

  private buildTrophies(unlocked: TrophyId[]) {
    const profile = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.32, 0.0),
      new THREE.Vector2(0.28, 0.14),
      new THREE.Vector2(0.11, 0.25),
      new THREE.Vector2(0.09, 0.55),
      new THREE.Vector2(0.36, 0.85),
      new THREE.Vector2(0.42, 1.25),
      new THREE.Vector2(0.38, 1.3),
      new THREE.Vector2(0.0, 1.2),
    ];
    const cupGeo = new THREE.LatheGeometry(profile, 24);
    const handleGeo = new THREE.TorusGeometry(0.18, 0.032, 8, 16, Math.PI);
    const plinthGeo = new THREE.CylinderGeometry(0.55, 0.62, 1.0, 16);

    const tierColors: Record<string, { color: string; metal: number; rough: number }> = {
      bronze: { color: '#cd7f32', metal: 0.88, rough: 0.26 },
      silver: { color: '#e2e8f0', metal: 0.94, rough: 0.16 },
      gold: { color: '#facc15', metal: 0.95, rough: 0.14 },
      platinum: { color: '#fef08a', metal: 0.98, rough: 0.1 },
    };

    TROPHIES.forEach((t, i) => {
      const isUnlocked = unlocked.includes(t.id);
      const angle = ((i - 3.5) / 7) * Math.PI * 0.72;
      const radius = 5.4;
      const px = Math.sin(angle) * radius;
      const pz = -Math.cos(angle) * radius + 3.2;

      const root = new THREE.Group();
      root.position.set(px, 0, pz);
      root.lookAt(0, 0, 4);

      const plinth = new THREE.Mesh(
        plinthGeo,
        new THREE.MeshStandardMaterial({
          color: isUnlocked ? '#1e293b' : '#090d16',
          roughness: 0.4,
          metalness: 0.3,
        })
      );
      plinth.position.y = 0.5;
      root.add(plinth);

      // Glowing ring on unlocked pedestals
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.48, 0.54, 24),
        new THREE.MeshBasicMaterial({
          color: isUnlocked ? '#facc15' : '#1e293b',
          side: THREE.DoubleSide,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 1.01;
      root.add(ring);

      const spec = tierColors[t.tier];
      const mat = isUnlocked
        ? new THREE.MeshStandardMaterial({
            color: spec.color,
            metalness: spec.metal,
            roughness: spec.rough,
          })
        : new THREE.MeshStandardMaterial({
            color: '#0b111e',
            metalness: 0.05,
            roughness: 0.95,
          });

      const trophyObj = new THREE.Group();
      trophyObj.position.y = 1.02;

      const cup = new THREE.Mesh(cupGeo, mat);
      const scale = t.id === 'trophy_worldcup_final' ? 1.25 : 0.95 + i * 0.03;
      cup.scale.setScalar(scale);
      trophyObj.add(cup);

      const hLeft = new THREE.Mesh(handleGeo, mat);
      hLeft.position.set(-0.35 * scale, 0.95 * scale, 0);
      hLeft.rotation.z = Math.PI / 2;
      const hRight = new THREE.Mesh(handleGeo, mat);
      hRight.position.set(0.35 * scale, 0.95 * scale, 0);
      hRight.rotation.z = -Math.PI / 2;
      trophyObj.add(hLeft, hRight);

      // World Cup globe top for World Cup trophies
      if (t.tier === 'platinum') {
        const globe = new THREE.Mesh(new THREE.SphereGeometry(0.24 * scale, 16, 14), mat);
        globe.position.y = 1.48 * scale;
        trophyObj.add(globe);
      }

      root.add(trophyObj);

      const hitMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.65, 2.8, 10),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitMesh.position.y = 1.4;
      hitMesh.userData.trophyId = t.id;
      root.add(hitMesh);

      this.scene.add(root);
      this.trophyGroups.push({ id: t.id, group: trophyObj, hitMesh, unlocked: isUnlocked });
    });
  }

  private bindEvents() {
    const el = this.renderer.domElement;
    const onResize = () => {
      if (this.disposed) return;
      const w = this.container.clientWidth || 800;
      const h = this.container.clientHeight || 500;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    const onClick = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(
        this.trophyGroups.map((t) => t.hitMesh),
        false
      );
      if (hits.length > 0) {
        this.onSelect(hits[0].object.userData.trophyId);
      }
    };

    window.addEventListener('resize', onResize);
    el.addEventListener('click', onClick);
    this.cleanupEvents = () => {
      window.removeEventListener('resize', onResize);
      el.removeEventListener('click', onClick);
    };
  }

  private startLoop() {
    const clock = new THREE.Clock();
    const tick = () => {
      if (this.disposed) return;
      const dt = clock.getDelta();
      this.trophyGroups.forEach((t) => {
        if (t.unlocked) t.group.rotation.y += dt * 0.45;
      });
      this.controls.update();
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.frameId = window.setTimeout(() => requestAnimationFrame(tick), 80);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };
    this.frameId = requestAnimationFrame(tick);
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.cleanupEvents();
    this.controls.dispose();
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose();
        if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
        else m.material?.dispose();
      }
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
