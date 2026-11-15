import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ActiveIncident,
  DivisionConfig,
  GameSettings,
  IncidentType,
  MultiplayerRole,
} from '../types/game';
import { GeneratedMatchFixture } from '../data/leagues';
import { MovementVector } from '../input/InputManager';
import { soundEngine } from '../audio/SoundEngine';

// Pitch dimensions in world units (half-length X = 28, half-width Z = 18)
export const PITCH_HALF_X = 28;
export const PITCH_HALF_Z = 18;
const PENALTY_BOX_X = 19.5;
const PENALTY_BOX_Z = 9.5;
const GOAL_HALF_Z = 3.2;
const BALL_RADIUS = 0.28;

// Pre-allocated math helpers for zero GC inside render loop
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

export interface PlayerSim {
  id: string;
  team: 'home' | 'away';
  number: number;
  name: string;
  role: 'gk' | 'def' | 'mid' | 'fwd';
  homePos: THREE.Vector2;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rotY: number;
  animPhase: number;
  fallenTimer: number;
  cardState: 'none' | 'yellow' | 'red';
  sentOff: boolean;
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  hitProxy: THREE.Mesh;
  cardBadge: THREE.Mesh;
}

export interface StadiumCallbacks {
  onIncidentSpawn: (incident: ActiveIncident) => void;
  onIncidentExpire: (incident: ActiveIncident) => void;
  onGoalScored: (team: 'home' | 'away', scorerName: string) => void;
  onMatchMinute: (minute: number) => void;
  onPlayerSelected: (player: { team: 'home' | 'away'; number: number; name: string; cardState: string }) => void;
  onStaminaChange: (stamina: number) => void;
  onReplayProgress?: (norm: number, currentSec: number, totalSec: number) => void;
  onSyncBroadcast?: (payload: Record<string, unknown>) => void;
  onSetPieceBanner?: (key: string, team?: 'home' | 'away') => void;
}

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

function createPitchTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Striped emerald turf
  const stripes = 18;
  const sw = canvas.width / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1c6d38' : '#227c41';
    ctx.fillRect(i * sw, 0, sw + 1, canvas.height);
  }

  // Subtle organic turf grain
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  for (let i = 0; i < 6000; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 3, 3);
  }

  // Crisp white chalk lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.96)';
  ctx.lineWidth = 9;

  const padX = 80;
  const padY = 60;
  const W = canvas.width - padX * 2;
  const H = canvas.height - padY * 2;

  // Touchlines & goal lines
  ctx.strokeRect(padX, padY, W, H);

  // Halfway line
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, padY);
  ctx.lineTo(canvas.width / 2, canvas.height - padY);
  ctx.stroke();

  // Center circle & spot
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 135, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 9, 0, Math.PI * 2);
  ctx.fill();

  // Left & Right penalty areas
  const boxW = 280;
  const boxH = 490;
  const sixW = 100;
  const sixH = 230;

  // Left
  ctx.strokeRect(padX, (canvas.height - boxH) / 2, boxW, boxH);
  ctx.strokeRect(padX, (canvas.height - sixH) / 2, sixW, sixH);
  ctx.beginPath();
  ctx.arc(padX + 195, canvas.height / 2, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(padX + 195, canvas.height / 2, 125, -0.68, 0.68);
  ctx.stroke();

  // Right
  ctx.strokeRect(canvas.width - padX - boxW, (canvas.height - boxH) / 2, boxW, boxH);
  ctx.strokeRect(canvas.width - padX - sixW, (canvas.height - sixH) / 2, sixW, sixH);
  ctx.beginPath();
  ctx.arc(canvas.width - padX - 195, canvas.height / 2, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(canvas.width - padX - 195, canvas.height / 2, 125, Math.PI - 0.68, Math.PI + 0.68);
  ctx.stroke();

  // Corner arcs
  const cr = 26;
  ctx.beginPath(); ctx.arc(padX, padY, cr, 0, Math.PI / 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(canvas.width - padX, padY, cr, Math.PI / 2, Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(canvas.width - padX, canvas.height - padY, cr, Math.PI, Math.PI * 1.5); ctx.stroke();
  ctx.beginPath(); ctx.arc(padX, canvas.height - padY, cr, Math.PI * 1.5, Math.PI * 2); ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = '#0f172a';
  for (let x = 32; x < 512; x += 96) {
    for (let y = 32; y < 256; y += 96) {
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = (k * Math.PI * 2) / 5 - Math.PI / 2;
        const px = x + Math.cos(a) * 24;
        const py = y + Math.sin(a) * 24;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createAdBoardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#09111e';
  ctx.fillRect(0, 0, 1024, 128);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(0, 0, 1024, 8);
  ctx.fillRect(0, 120, 1024, 8);

  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText('FAIR PLAY  ·  WORLD REFEREE FEDERATION  ·  RESPECT THE WHISTLE', 512, 66);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

function createJerseyNumberTexture(
  jerseyColor: string,
  trimColor: string,
  playerNumber: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = jerseyColor;
  ctx.fillRect(0, 0, 128, 128);

  // Contrasting collar & shoulder trim band
  ctx.fillStyle = trimColor;
  ctx.fillRect(0, 0, 128, 16);
  ctx.fillRect(0, 118, 128, 10);

  // High-contrast crisp player number (outlined for legibility on any kit color)
  ctx.font = '900 58px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#090f19';
  ctx.strokeText(String(playerNumber), 64, 68);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(String(playerNumber), 64, 68);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildHumanFigure(options: {
  jerseyColor: string;
  shortsColor: string;
  trimColor?: string;
  skinTone?: string;
  hairColor?: string;
  playerNumber?: number;
  isRef?: boolean;
  isLinesman?: boolean;
}) {
  const group = new THREE.Group();

  const jerseyMat = new THREE.MeshStandardMaterial({
    color: options.jerseyColor,
    roughness: 0.65,
    metalness: 0.05,
  });
  const shortsMat = new THREE.MeshStandardMaterial({
    color: options.shortsColor,
    roughness: 0.72,
    metalness: 0.04,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: options.skinTone || '#d69e72',
    roughness: 0.6,
    metalness: 0.02,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.35,
    metalness: 0.25,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: options.hairColor || '#1e293b',
    roughness: 0.8,
  });

  // Contact shadow disc grounded at y=0.015
  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.45, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.015;
  group.add(shadowDisc);

  // Legs (pivot at hip y = 0.78)
  const legGeo = new THREE.BoxGeometry(0.18, 0.68, 0.2);
  legGeo.translate(0, -0.34, 0);
  const leftLeg = new THREE.Mesh(legGeo, shortsMat);
  leftLeg.position.set(-0.12, 0.78, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, shortsMat);
  rightLeg.position.set(0.12, 0.78, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // Boots attached to legs
  const bootGeo = new THREE.BoxGeometry(0.19, 0.14, 0.28);
  const leftBoot = new THREE.Mesh(bootGeo, bootMat);
  leftBoot.position.set(0, -0.68, 0.04);
  leftLeg.add(leftBoot);

  const rightBoot = new THREE.Mesh(bootGeo, bootMat);
  rightBoot.position.set(0, -0.68, 0.04);
  rightLeg.add(rightBoot);

  // Torso (primary silhouette with numbered front/back jersey texture when provided)
  let torsoMat: THREE.Material | THREE.Material[] = jerseyMat;
  if (options.playerNumber !== undefined) {
    const tex = createJerseyNumberTexture(
      options.jerseyColor,
      options.trimColor || '#f8fafc',
      options.playerNumber
    );
    const numFaceMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.62,
      metalness: 0.05,
    });
    torsoMat = [jerseyMat, jerseyMat, jerseyMat, jerseyMat, numFaceMat, numFaceMat];
  }
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.62, 0.28), torsoMat);
  torso.position.y = 1.09;
  torso.castShadow = true;
  group.add(torso);

  // Trim collar / chest badge
  if (options.trimColor) {
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.14, 0.03),
      new THREE.MeshStandardMaterial({ color: options.trimColor, roughness: 0.3, metalness: 0.5 })
    );
    badge.position.set(0.12, 1.2, 0.145);
    group.add(badge);
  }

  // Head + hair cap
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), skinMat);
  head.position.y = 1.58;
  head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.188, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hairMat
  );
  hair.position.y = 1.6;
  group.add(hair);

  // Arms (pivot at shoulder y = 1.32)
  const armGeo = new THREE.BoxGeometry(0.14, 0.54, 0.15);
  armGeo.translate(0, -0.22, 0);
  const leftArm = new THREE.Mesh(armGeo, jerseyMat);
  leftArm.position.set(-0.33, 1.32, 0);
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, jerseyMat);
  rightArm.position.set(0.33, 1.32, 0);
  rightArm.castShadow = true;
  group.add(rightArm);

  let cardMesh: THREE.Mesh | null = null;
  if (options.isRef) {
    cardMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.18, 0.015),
      new THREE.MeshStandardMaterial({ color: '#facc15', emissive: '#ca8a04', emissiveIntensity: 0.25 })
    );
    cardMesh.position.set(0, -0.52, 0.08);
    cardMesh.visible = false;
    rightArm.add(cardMesh);
  }

  let flagGroup: THREE.Group | null = null;
  if (options.isLinesman) {
    flagGroup = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.72, 8),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.7, roughness: 0.2 })
    );
    pole.position.y = 0.36;
    const cloth = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.28, 0.36),
      new THREE.MeshStandardMaterial({ color: '#f59e0b', emissive: '#d97706', emissiveIntensity: 0.2 })
    );
    cloth.position.set(0, 0.58, 0.18);
    flagGroup.add(pole, cloth);
    flagGroup.position.set(0, -0.45, 0.08);
    flagGroup.rotation.x = Math.PI * 0.45;
    rightArm.add(flagGroup);
  }

  // Clickable raycast proxy cylinder on layer 1
  const hitProxy = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 1.9, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitProxy.position.y = 0.95;
  hitProxy.layers.set(1);
  group.add(hitProxy);

  // Floating booked-card badge above head
  const cardBadge = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.24, 0.04),
    new THREE.MeshBasicMaterial({ color: '#facc15' })
  );
  cardBadge.position.set(0, 2.08, 0);
  cardBadge.visible = false;
  group.add(cardBadge);

  return { group, leftLeg, rightLeg, leftArm, rightArm, cardMesh, flagGroup, hitProxy, cardBadge };
}

export class StadiumScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;

  // Lights
  private keyLight!: THREE.DirectionalLight;

  // Crowd
  private crowdMesh!: THREE.InstancedMesh;
  private crowdBasePositions: Array<{ x: number; y: number; z: number; rotY: number; phase: number }> = [];
  private crowdMood: 'calm' | 'cheer' | 'boo' = 'calm';
  private crowdMoodTimer = 0;

  // Actors
  private referee!: ReturnType<typeof buildHumanFigure>;
  private refPos = new THREE.Vector3(0, 0, 2);
  private refYaw = 0;
  private refPitch = 0.28;
  private refMoveYaw = 0;
  private refAnimPhase = 0;
  private refCardTimer = 0;
  private stamina = 100;
  private lastReportedStamina = 100;

  private linesmen: Array<{ fig: ReturnType<typeof buildHumanFigure>; side: 1 | -1; z: number; flagTimer: number }> = [];
  private players: PlayerSim[] = [];
  private selectionRing!: THREE.Mesh;

  // Ball
  private ballMesh!: THREE.Mesh;
  private ballShadowMesh!: THREE.Mesh;
  private ballPos = new THREE.Vector3(0, BALL_RADIUS, 0);
  private ballVel = new THREE.Vector3(2.2, 0, 1.1);

  // Offside / Replay / Incident actor markers
  private offsideLineMesh!: THREE.Mesh;
  private incidentMarkerMesh!: THREE.Mesh;
  private offenderRingMesh!: THREE.Mesh;
  private victimRingMesh!: THREE.Mesh;
  private scoreboardCtx!: CanvasRenderingContext2D;
  private scoreboardTex!: THREE.CanvasTexture;

  // Mode & state
  public mode: 'menu' | 'match' | 'replay' = 'menu';
  public role: MultiplayerRole = 'main_referee';
  public paused = false;
  private matchTimeElapsed = 0;
  private matchDurationSec = 150;
  private lastReportedMinute = -1;
  private homeScore = 0;
  private awayScore = 0;
  private lastTouchTeam: 'home' | 'away' = 'home';
  private possessionTeam: 'home' | 'away' = 'home';
  private outOfPlayCooldown = 0;
  private fixture!: GeneratedMatchFixture;
  private division!: DivisionConfig;
  private settings!: GameSettings;
  private callbacks: StadiumCallbacks;

  // Incidents & Replay
  private activeIncident: ActiveIncident | null = null;
  private replayIncident: ActiveIncident | null = null;
  private replaySavedBall = new THREE.Vector3();
  private replaySavedActors: Array<{
    player: PlayerSim;
    x: number;
    z: number;
    rotY: number;
    rotX: number;
  }> = [];
  private nextIncidentTimer = 4.5;
  private replayTimer = 0;
  public replayPaused = false;
  public replaySpeed = 0.35;
  public replayAngle: 'side' | 'closeup' | 'offside' = 'side';
  private readonly replayLoopDuration = 2.0;
  private replayNorm = 0;
  private replayProgressAccum = 0;
  private liveIncidentTimer = 0;
  private replayFramesBuffer: ActiveIncident['replayFrames'] = [];
  private replayBufferAccum = 0;
  private surroundTimer = 0;

  // On-pitch Set-Piece enforcement (Kickoff / Penalty / Free Kick / Corner / Goal Kick / Throw-In)
  private setPiece: {
    type: 'kickoff' | 'penalty' | 'free_kick' | 'corner' | 'goal_kick' | 'throw_in';
    timer: number;
    duration: number;
    kicked: boolean;
    spot: THREE.Vector3;
    attackDir: number;
    taker: PlayerSim | null;
    gk: PlayerSim | null;
    goalAimZ: number;
    willScore: boolean;
  } | null = null;

  // Camera smoothing
  private camPosCurrent = new THREE.Vector3(0, 12, 22);
  private camTargetCurrent = new THREE.Vector3(0, 1, 0);
  private shakeAmount = 0;

  // Raycasting
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private isDraggingLook = false;
  private lastPointer = { x: 0, y: 0 };
  private dragDistance = 0;

  // Sync throttle
  private syncAccum = 0;

  constructor(
    container: HTMLElement,
    settings: GameSettings,
    callbacks: StadiumCallbacks
  ) {
    this.container = container;
    this.settings = settings;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareGl();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#07101c');
    this.scene.fog = new THREE.FogExp2('#07101c', 0.0085);

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(58, w / h, 0.2, 320);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && settings.graphics.antiAliasing,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2) * settings.graphics.resolutionScale
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && settings.graphics.shadowQuality !== 'off';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.raycaster.layers.set(1);

    this.buildLighting();
    this.buildStadium();
    this.buildActors();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.startLoop();
  }

  private buildLighting() {
    const hemi = new THREE.HemisphereLight('#93c5fd', '#1e293b', 0.65);
    this.scene.add(hemi);

    this.keyLight = new THREE.DirectionalLight('#fff7ed', 2.2);
    this.keyLight.position.set(24, 38, 18);
    this.keyLight.castShadow = !this.isSoftwareGl && this.settings.graphics.shadowQuality !== 'off';
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.camera.left = -35;
    this.keyLight.shadow.camera.right = 35;
    this.keyLight.shadow.camera.top = 26;
    this.keyLight.shadow.camera.bottom = -26;
    this.keyLight.shadow.camera.near = 5;
    this.keyLight.shadow.camera.far = 110;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    const rimLight = new THREE.DirectionalLight('#38bdf8', 0.65);
    rimLight.position.set(-28, 18, -22);
    this.scene.add(rimLight);
  }

  private buildStadium() {
    // Extended outer stadium apron so pitch never floats in a void
    const apron = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 240),
      new THREE.MeshStandardMaterial({ color: '#0c1624', roughness: 0.92 })
    );
    apron.rotation.x = -Math.PI / 2;
    apron.position.y = -0.05;
    apron.receiveShadow = true;
    this.scene.add(apron);

    // Track surround around pitch
    const track = new THREE.Mesh(
      new THREE.PlaneGeometry(72, 48),
      new THREE.MeshStandardMaterial({ color: '#1e3a5f', roughness: 0.85 })
    );
    track.rotation.x = -Math.PI / 2;
    track.position.y = -0.02;
    track.receiveShadow = true;
    this.scene.add(track);

    // Football Pitch
    const pitchTex = createPitchTexture();
    pitchTex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const pitch = new THREE.Mesh(
      new THREE.PlaneGeometry(PITCH_HALF_X * 2 + 4, PITCH_HALF_Z * 2 + 3.5),
      new THREE.MeshStandardMaterial({ map: pitchTex, roughness: 0.88, metalness: 0.02 })
    );
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = 0;
    pitch.receiveShadow = true;
    this.scene.add(pitch);

    // Goals (Left x = -PITCH_HALF_X, Right x = +PITCH_HALF_X)
    const postMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.25, metalness: 0.5 });
    const netMat = new THREE.MeshStandardMaterial({
      color: '#cbd5e1',
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });

    [-1, 1].forEach((dir) => {
      const goalGroup = new THREE.Group();
      const x = dir * PITCH_HALF_X;
      const postH = 2.45;
      const depth = 2.1;

      const leftPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, postH, 10), postMat);
      leftPost.position.set(x, postH / 2, -GOAL_HALF_Z);
      const rightPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, postH, 10), postMat);
      rightPost.position.set(x, postH / 2, GOAL_HALF_Z);
      const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, GOAL_HALF_Z * 2 + 0.16, 10), postMat);
      crossbar.rotation.x = Math.PI / 2;
      crossbar.position.set(x, postH, 0);

      const netBox = new THREE.Mesh(new THREE.BoxGeometry(depth, postH, GOAL_HALF_Z * 2), netMat);
      netBox.position.set(x + dir * (depth / 2), postH / 2, 0);

      goalGroup.add(leftPost, rightPost, crossbar, netBox);
      this.scene.add(goalGroup);
    });

    // Corner Flags
    const flagPoleMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 });
    const flagClothMat = new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.7 });
    [
      [-PITCH_HALF_X, -PITCH_HALF_Z],
      [-PITCH_HALF_X, PITCH_HALF_Z],
      [PITCH_HALF_X, -PITCH_HALF_Z],
      [PITCH_HALF_X, PITCH_HALF_Z],
    ].forEach(([cx, cz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 6), flagPoleMat);
      pole.position.set(cx, 0.65, cz);
      const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.02), flagClothMat);
      cloth.position.set(cx + 0.18, 1.15, cz);
      this.scene.add(pole, cloth);
    });

    // Advertising Boards
    const adTex = createAdBoardTexture();
    const adMat = new THREE.MeshStandardMaterial({ map: adTex, emissive: '#064e3b', emissiveIntensity: 0.35, roughness: 0.4 });
    const adNorth = new THREE.Mesh(new THREE.BoxGeometry(58, 1.1, 0.3), adMat);
    adNorth.position.set(0, 0.55, -PITCH_HALF_Z - 3.2);
    const adSouth = new THREE.Mesh(new THREE.BoxGeometry(58, 1.1, 0.3), adMat);
    adSouth.position.set(0, 0.55, PITCH_HALF_Z + 3.2);
    this.scene.add(adNorth, adSouth);

    // Multi-Tier Stadium Stands
    const standMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.5, metalness: 0.4 });

    // North & South grandstands
    [-1, 1].forEach((side) => {
      for (let tier = 0; tier < 4; tier++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(68, 2.1, 3.8), standMat);
        step.position.set(0, 1.2 + tier * 1.9, side * (PITCH_HALF_Z + 6.5 + tier * 3.2));
        step.receiveShadow = true;
        this.scene.add(step);
      }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(70, 0.6, 15), roofMat);
      roof.position.set(0, 12.2, side * (PITCH_HALF_Z + 12.5));
      this.scene.add(roof);
    });

    // East & West stands behind goals
    [-1, 1].forEach((side) => {
      for (let tier = 0; tier < 4; tier++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.1, 44), standMat);
        step.position.set(side * (PITCH_HALF_X + 6.5 + tier * 3.2), 1.2 + tier * 1.9, 0);
        this.scene.add(step);
      }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(15, 0.6, 46), roofMat);
      roof.position.set(side * (PITCH_HALF_X + 12.5), 12.2, 0);
      this.scene.add(roof);
    });

    // 4 Towering Floodlight Pylons
    const pylonMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.7, roughness: 0.35 });
    const lampMat = new THREE.MeshBasicMaterial({ color: '#fef9c3' });
    [
      [-37, -26],
      [37, -26],
      [-37, 26],
      [37, 26],
    ].forEach(([px, pz]) => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.75, 26, 8), pylonMat);
      tower.position.set(px, 13, pz);
      const bank = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.2, 0.6), lampMat);
      bank.position.set(px, 26.2, pz);
      bank.lookAt(0, 0, 0);
      this.scene.add(tower, bank);
    });

    // Stadium Scoreboard Jumbotron (North Roof)
    const sbCanvas = document.createElement('canvas');
    sbCanvas.width = 512;
    sbCanvas.height = 160;
    this.scoreboardCtx = sbCanvas.getContext('2d')!;
    this.scoreboardTex = new THREE.CanvasTexture(sbCanvas);
    this.scoreboardTex.colorSpace = THREE.SRGBColorSpace;
    const sbMesh = new THREE.Mesh(
      new THREE.BoxGeometry(14, 4.4, 0.6),
      new THREE.MeshBasicMaterial({ map: this.scoreboardTex })
    );
    sbMesh.position.set(0, 14.5, -PITCH_HALF_Z - 11.5);
    this.scene.add(sbMesh);
    this.updateScoreboardTexture('HOME', 'AWAY', 0, 0, 0);

    // Animated Instanced Crowd (~1,400 spectators)
    const specGeo = new THREE.BoxGeometry(0.55, 0.85, 0.45);
    specGeo.translate(0, 0.425, 0);
    const specMat = new THREE.MeshStandardMaterial({ roughness: 0.75 });
    const maxCrowd = 1440;
    this.crowdMesh = new THREE.InstancedMesh(specGeo, specMat, maxCrowd);

    let idx = 0;
    const palette = ['#ef4444', '#3b82f6', '#facc15', '#f8fafc', '#10b981', '#cbd5e1'];
    // North & South tiers
    [-1, 1].forEach((side) => {
      for (let tier = 0; tier < 4; tier++) {
        for (let x = -31; x <= 31; x += 1.15) {
          if (idx >= maxCrowd) break;
          const px = x + (Math.random() - 0.5) * 0.3;
          const py = 2.25 + tier * 1.9;
          const pz = side * (PITCH_HALF_Z + 6.5 + tier * 3.2);
          const rotY = side === -1 ? 0 : Math.PI;
          this.crowdBasePositions.push({ x: px, y: py, z: pz, rotY, phase: Math.random() * Math.PI * 2 });
          _dummy.position.set(px, py, pz);
          _dummy.rotation.set(0, rotY, 0);
          _dummy.scale.setScalar(0.88 + Math.random() * 0.24);
          _dummy.updateMatrix();
          this.crowdMesh.setMatrixAt(idx, _dummy.matrix);
          _color.set(palette[Math.floor(Math.random() * palette.length)]);
          this.crowdMesh.setColorAt(idx, _color);
          idx++;
        }
      }
    });
    // East & West tiers
    [-1, 1].forEach((side) => {
      for (let tier = 0; tier < 4; tier++) {
        for (let z = -19; z <= 19; z += 1.2) {
          if (idx >= maxCrowd) break;
          const px = side * (PITCH_HALF_X + 6.5 + tier * 3.2);
          const py = 2.25 + tier * 1.9;
          const pz = z + (Math.random() - 0.5) * 0.3;
          const rotY = side === -1 ? Math.PI / 2 : -Math.PI / 2;
          this.crowdBasePositions.push({ x: px, y: py, z: pz, rotY, phase: Math.random() * Math.PI * 2 });
          _dummy.position.set(px, py, pz);
          _dummy.rotation.set(0, rotY, 0);
          _dummy.scale.setScalar(0.88 + Math.random() * 0.24);
          _dummy.updateMatrix();
          this.crowdMesh.setMatrixAt(idx, _dummy.matrix);
          _color.set(palette[Math.floor(Math.random() * palette.length)]);
          this.crowdMesh.setColorAt(idx, _color);
          idx++;
        }
      }
    });
    this.crowdMesh.count = idx;
    this.crowdMesh.instanceMatrix.needsUpdate = true;
    if (this.crowdMesh.instanceColor) this.crowdMesh.instanceColor.needsUpdate = true;
    this.crowdMesh.computeBoundingSphere();
    this.scene.add(this.crowdMesh);
  }

  private buildActors() {
    // Main Referee
    this.referee = buildHumanFigure({
      jerseyColor: '#111827',
      shortsColor: '#0f172a',
      trimColor: '#facc15',
      isRef: true,
    });
    this.referee.group.position.copy(this.refPos);
    this.scene.add(this.referee.group);

    // 2 Assistant Referees (Linesmen)
    [-1, 1].forEach((side) => {
      const fig = buildHumanFigure({
        jerseyColor: '#fde047',
        shortsColor: '#0f172a',
        trimColor: '#111827',
        isLinesman: true,
      });
      fig.group.position.set(0, 0, side * (PITCH_HALF_Z + 0.9));
      this.scene.add(fig.group);
      this.linesmen.push({ fig, side: side as 1 | -1, z: side * (PITCH_HALF_Z + 0.9), flagTimer: 0 });
    });

    // Football + crisp ground shadow disc
    const ballTex = createBallTexture();
    this.ballMesh = new THREE.Mesh(
      new THREE.SphereGeometry(BALL_RADIUS, 20, 16),
      new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.42, metalness: 0.08 })
    );
    this.ballMesh.castShadow = true;
    this.ballMesh.position.copy(this.ballPos);
    this.scene.add(this.ballMesh);

    this.ballShadowMesh = new THREE.Mesh(
      new THREE.CircleGeometry(BALL_RADIUS * 1.25, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false })
    );
    this.ballShadowMesh.rotation.x = -Math.PI / 2;
    this.ballShadowMesh.position.set(this.ballPos.x, 0.025, this.ballPos.z);
    this.scene.add(this.ballShadowMesh);

    // Selection Ring under clicked player
    this.selectionRing = new THREE.Mesh(
      new THREE.RingGeometry(0.52, 0.68, 24),
      new THREE.MeshBasicMaterial({ color: '#facc15', side: THREE.DoubleSide })
    );
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.position.y = 0.03;
    this.selectionRing.visible = false;
    this.scene.add(this.selectionRing);

    // Offside VAR laser line
    this.offsideLineMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.06, PITCH_HALF_Z * 2),
      new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.88 })
    );
    this.offsideLineMesh.position.y = 0.04;
    this.offsideLineMesh.visible = false;
    this.scene.add(this.offsideLineMesh);

    // Incident highlight ring
    this.incidentMarkerMesh = new THREE.Mesh(
      new THREE.RingGeometry(1.15, 1.5, 28),
      new THREE.MeshBasicMaterial({ color: '#ef4444', side: THREE.DoubleSide })
    );
    this.incidentMarkerMesh.rotation.x = -Math.PI / 2;
    this.incidentMarkerMesh.position.y = 0.035;
    this.incidentMarkerMesh.visible = false;
    this.scene.add(this.incidentMarkerMesh);

    // Offender & victim actor highlight rings for instant visual clarity
    this.offenderRingMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.48, 0.64, 24),
      new THREE.MeshBasicMaterial({ color: '#f97316', side: THREE.DoubleSide })
    );
    this.offenderRingMesh.rotation.x = -Math.PI / 2;
    this.offenderRingMesh.position.y = 0.038;
    this.offenderRingMesh.visible = false;
    this.scene.add(this.offenderRingMesh);

    this.victimRingMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.48, 0.64, 24),
      new THREE.MeshBasicMaterial({ color: '#38bdf8', side: THREE.DoubleSide })
    );
    this.victimRingMesh.rotation.x = -Math.PI / 2;
    this.victimRingMesh.position.y = 0.038;
    this.victimRingMesh.visible = false;
    this.scene.add(this.victimRingMesh);
  }

  private spawnPlayersForFixture(fixture: GeneratedMatchFixture) {
    // Clean old players and dispose their textures/materials/geometries
    for (const p of this.players) {
      p.group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mat) => {
            if (!mat) return;
            const stdMat = mat as THREE.MeshStandardMaterial;
            stdMat.map?.dispose();
            mat.dispose();
          });
        }
      });
      this.scene.remove(p.group);
    }
    this.players = [];

    const formationHome: Array<{ role: PlayerSim['role']; x: number; z: number }> = [
      { role: 'gk', x: -26.2, z: 0 },
      { role: 'def', x: -18, z: -10 },
      { role: 'def', x: -19, z: -3.5 },
      { role: 'def', x: -19, z: 3.5 },
      { role: 'def', x: -18, z: 10 },
      { role: 'mid', x: -8, z: -8 },
      { role: 'mid', x: -9, z: 0 },
      { role: 'mid', x: -8, z: 8 },
      { role: 'fwd', x: 3, z: -8 },
      { role: 'fwd', x: 5, z: 0 },
      { role: 'fwd', x: 3, z: 8 },
    ];

    const createTeam = (team: 'home' | 'away') => {
      const club = team === 'home' ? fixture.home : fixture.away;
      const roster = team === 'home' ? fixture.homeRoster : fixture.awayRoster;

      formationHome.forEach((slot, i) => {
        const isGk = slot.role === 'gk';
        const info = roster[i] || { number: i + 1, name: `Player ${i + 1}` };
        const fig = buildHumanFigure({
          jerseyColor: isGk ? club.gkColor : club.primaryColor,
          shortsColor: club.secondaryColor,
          trimColor: isGk ? '#facc15' : club.secondaryColor,
          skinTone: ['#f1c27d', '#c68642', '#8d5524', '#e0ac69'][i % 4],
          hairColor: ['#1e293b', '#451a03', '#78350f', '#0f172a', '#92400e'][i % 5],
          playerNumber: info.number,
        });
        const hx = team === 'home' ? slot.x : -slot.x;
        const hz = team === 'home' ? slot.z : -slot.z;
        fig.group.position.set(hx, 0, hz);
        fig.hitProxy.userData.playerIndex = this.players.length;
        this.scene.add(fig.group);

        this.players.push({
          id: `${team}_${info.number}`,
          team,
          number: info.number,
          name: info.name,
          role: slot.role,
          homePos: new THREE.Vector2(hx, hz),
          pos: new THREE.Vector3(hx, 0, hz),
          vel: new THREE.Vector3(),
          rotY: team === 'home' ? Math.PI / 2 : -Math.PI / 2,
          animPhase: Math.random() * Math.PI * 2,
          fallenTimer: 0,
          cardState: 'none',
          sentOff: false,
          group: fig.group,
          leftLeg: fig.leftLeg,
          rightLeg: fig.rightLeg,
          leftArm: fig.leftArm,
          rightArm: fig.rightArm,
          hitProxy: fig.hitProxy,
          cardBadge: fig.cardBadge,
        });
      });
    };

    createTeam('home');
    createTeam('away');
  }

  public startMatch(
    fixture: GeneratedMatchFixture,
    division: DivisionConfig,
    role: MultiplayerRole = 'main_referee'
  ) {
    this.fixture = fixture;
    this.division = division;
    this.role = role;
    this.mode = 'match';
    this.paused = false;
    this.matchTimeElapsed = 0;
    this.matchDurationSec = this.settings.gameplay.matchLengthSeconds;
    this.lastReportedMinute = -1;
    this.homeScore = 0;
    this.awayScore = 0;
    this.lastTouchTeam = 'home';
    this.possessionTeam = 'home';
    this.outOfPlayCooldown = 1.6;
    this.stamina = 100;
    this.lastReportedStamina = 100;
    this.activeIncident = null;
    this.replayIncident = null;
    this.replaySavedActors = [];
    this.setPiece = null;
    this.liveIncidentTimer = 0;
    this.nextIncidentTimer = 4.5;
    this.replayFramesBuffer = [];
    this.surroundTimer = 0;
    this.incidentMarkerMesh.visible = false;
    this.offenderRingMesh.visible = false;
    this.victimRingMesh.visible = false;
    this.offsideLineMesh.visible = false;
    this.selectionRing.visible = false;

    if (role === 'main_referee') {
      this.refPos.set(0, 0, 5);
      this.refYaw = 0;
      this.refPitch = 0.28;
    } else if (role === 'assistant_referee_1') {
      this.refPos.set(0, 0, -PITCH_HALF_Z - 1.0);
      this.refYaw = Math.PI;
      this.refPitch = 0.25;
    } else if (role === 'assistant_referee_2') {
      this.refPos.set(0, 0, PITCH_HALF_Z + 1.0);
      this.refYaw = 0;
      this.refPitch = 0.25;
    } else {
      // var_referee: overhead tactical VAR booth vantage
      this.refPos.set(0, 0, 0);
      this.refYaw = 0;
      this.refPitch = 0.45;
    }

    this.spawnPlayersForFixture(fixture);
    this.setupKickoff('home', true);
    this.updateScoreboardTexture(fixture.home.shortName, fixture.away.shortName, 0, 0, 0);
    soundEngine.startStadiumAmbience(division.crowdIntensity);
    soundEngine.whistle('kickoff');
  }

  private resetActorPose(p: PlayerSim) {
    p.fallenTimer = 0;
    p.pos.y = 0;
    p.group.position.set(p.pos.x, 0, p.pos.z);
    p.group.rotation.set(0, p.rotY, 0);
    p.leftLeg.rotation.set(0, 0, 0);
    p.rightLeg.rotation.set(0, 0, 0);
    p.leftArm.rotation.set(0, 0, 0);
    p.rightArm.rotation.set(0, 0, 0);
  }

  private applySlidePose(p: PlayerSim, amount: number) {
    const a = THREE.MathUtils.clamp(amount, 0, 1);
    p.group.position.y = THREE.MathUtils.lerp(0, 0.26, a);
    p.group.rotation.x = THREE.MathUtils.lerp(0, -1.18, a);
    p.rightLeg.rotation.x = THREE.MathUtils.lerp(0, -0.25, a);
    p.leftLeg.rotation.x = THREE.MathUtils.lerp(0, 0.95, a);
    p.leftArm.rotation.x = THREE.MathUtils.lerp(0, 0.72, a);
    p.rightArm.rotation.x = THREE.MathUtils.lerp(0, -0.45, a);
  }

  private setupKickoff(kickingTeam: 'home' | 'away', isInitial = false) {
    const attackDir = kickingTeam === 'home' ? 1 : -1;
    this.lastTouchTeam = kickingTeam;
    this.possessionTeam = kickingTeam;
    this.outOfPlayCooldown = 2.0;

    let taker: PlayerSim | null = null;
    for (const p of this.players) {
      if (p.sentOff) continue;
      // Keep every player cleanly in their own half
      let x = p.homePos.x;
      let z = p.homePos.y;
      if (p.team === 'home' && x > -1.5) x = -2.8;
      if (p.team === 'away' && x < 1.5) x = 2.8;

      if (p.team === kickingTeam && p.role === 'fwd' && Math.abs(z) < 2.5 && !taker) {
        taker = p;
        x = -attackDir * 0.7;
        z = 0;
      }
      p.pos.set(x, 0, z);
      p.rotY = p.team === 'home' ? Math.PI / 2 : -Math.PI / 2;
      this.resetActorPose(p);
    }

    const spot = new THREE.Vector3(0, BALL_RADIUS, 0);
    this.ballPos.copy(spot);
    this.ballVel.set(0, 0, 0);
    this.ballMesh.position.copy(spot);
    this.ballShadowMesh.position.set(0, 0.025, 0);

    this.setPiece = {
      type: 'kickoff',
      timer: 0,
      duration: 1.65,
      kicked: false,
      spot,
      attackDir,
      taker,
      gk: null,
      goalAimZ: (Math.random() - 0.5) * 4,
      willScore: false,
    };
    if (!isInitial) {
      this.callbacks.onSetPieceBanner?.('sp_kickoff', kickingTeam);
    }
  }

  private triggerCornerKick(attackingTeam: 'home' | 'away', endSide: 1 | -1, zSign: 1 | -1) {
    const defendingTeam: 'home' | 'away' = attackingTeam === 'home' ? 'away' : 'home';
    const attackDir = attackingTeam === 'home' ? 1 : -1;
    const cornerX = endSide * (PITCH_HALF_X - 0.5);
    const cornerZ = zSign * (PITCH_HALF_Z - 0.5);
    const spot = new THREE.Vector3(cornerX, BALL_RADIUS, cornerZ);

    this.lastTouchTeam = attackingTeam;
    this.possessionTeam = attackingTeam;
    this.outOfPlayCooldown = 2.2;

    const availAtt = this.players.filter((p) => p.team === attackingTeam && p.role !== 'gk' && !p.sentOff);
    const taker = availAtt.find((p) => p.role === 'mid') || availAtt[0] || null;
    const defGk = this.players.find((p) => p.team === defendingTeam && p.role === 'gk') || null;

    this.ballPos.copy(spot);
    this.ballVel.set(0, 0, 0);
    this.ballMesh.position.copy(spot);
    this.ballShadowMesh.position.set(spot.x, 0.025, spot.z);

    if (taker) {
      taker.pos.set(cornerX, 0, cornerZ + zSign * 0.9);
      taker.rotY = Math.atan2(-endSide * 3, -zSign * 6);
      this.resetActorPose(taker);
    }
    if (defGk) {
      defGk.pos.set(endSide * (PITCH_HALF_X - 0.8), 0, zSign * 0.6);
      defGk.rotY = Math.atan2(-endSide, 0);
      this.resetActorPose(defGk);
    }

    // Organize box attackers & markers neatly around the penalty area
    const boxSlotsZ = [-4.2, -1.4, 1.4, 4.2];
    let attIdx = 0;
    let defIdx = 0;
    for (const p of this.players) {
      if (p.sentOff || p === taker || p === defGk) continue;
      if (p.role === 'gk') {
        p.pos.set(p.homePos.x, 0, 0);
      } else if (p.team === attackingTeam && attIdx < 4 && (p.role === 'fwd' || p.role === 'mid')) {
        p.pos.set(endSide * (PITCH_HALF_X - 4.6 - (attIdx % 2) * 2.2), 0, boxSlotsZ[attIdx]);
        p.rotY = Math.atan2(endSide, 0);
        attIdx++;
      } else if (p.team === defendingTeam && defIdx < 4 && (p.role === 'def' || p.role === 'mid')) {
        p.pos.set(endSide * (PITCH_HALF_X - 3.6 - (defIdx % 2) * 2.0), 0, boxSlotsZ[defIdx] + 0.5);
        p.rotY = Math.atan2(-endSide, 0);
        defIdx++;
      } else {
        p.pos.set(endSide * (p.team === attackingTeam ? 4 : 8), 0, p.homePos.y * 0.8);
      }
      this.resetActorPose(p);
    }

    this.setPiece = {
      type: 'corner',
      timer: 0,
      duration: 2.35,
      kicked: false,
      spot,
      attackDir,
      taker,
      gk: defGk,
      goalAimZ: 0,
      willScore: false,
    };
    this.callbacks.onSetPieceBanner?.('sp_corner_kick', attackingTeam);
  }

  private triggerGoalKick(defendingTeam: 'home' | 'away', endSide: 1 | -1, zSign: 1 | -1) {
    const attackDir = defendingTeam === 'home' ? 1 : -1;
    const spotX = endSide * (PITCH_HALF_X - 3.5);
    const spotZ = zSign * 2.2;
    const spot = new THREE.Vector3(spotX, BALL_RADIUS, spotZ);

    this.lastTouchTeam = defendingTeam;
    this.possessionTeam = defendingTeam;
    this.outOfPlayCooldown = 2.2;

    const gk = this.players.find((p) => p.team === defendingTeam && p.role === 'gk') || null;
    const taker = gk || this.players.find((p) => p.team === defendingTeam && !p.sentOff) || null;

    this.ballPos.copy(spot);
    this.ballVel.set(0, 0, 0);
    this.ballMesh.position.copy(spot);
    this.ballShadowMesh.position.set(spot.x, 0.025, spot.z);

    if (taker) {
      taker.pos.set(spotX + endSide * 1.4, 0, spotZ);
      taker.rotY = Math.atan2(attackDir, 0);
      this.resetActorPose(taker);
    }

    // Space both teams upfield outside the penalty box for a clean goal kick
    for (const p of this.players) {
      if (p.sentOff || p === taker) continue;
      if (p.role === 'gk') {
        p.pos.set(p.homePos.x, 0, 0);
      } else if (p.team === defendingTeam) {
        p.pos.set(
          p.role === 'def' ? endSide * 12.5 : p.role === 'mid' ? endSide * 3.0 : -endSide * 6.0,
          0,
          p.homePos.y * 0.9
        );
      } else {
        p.pos.set(
          p.role === 'fwd' ? endSide * 9.5 : p.role === 'mid' ? -endSide * 2.0 : -endSide * 14.0,
          0,
          p.homePos.y * 0.85
        );
      }
      p.rotY = Math.atan2(p.team === 'home' ? 1 : -1, 0);
      this.resetActorPose(p);
    }

    this.setPiece = {
      type: 'goal_kick',
      timer: 0,
      duration: 2.1,
      kicked: false,
      spot,
      attackDir,
      taker,
      gk: null,
      goalAimZ: (Math.random() - 0.5) * 6,
      willScore: false,
    };
    this.callbacks.onSetPieceBanner?.('sp_goal_kick', defendingTeam);
  }

  private triggerAutoThrowIn(awardedTeam: 'home' | 'away', x: number, zSide: 1 | -1) {
    const ix = THREE.MathUtils.clamp(x, -PITCH_HALF_X + 2.5, PITCH_HALF_X - 2.5);
    const iz = zSide * (PITCH_HALF_Z - 0.15);
    const spot = new THREE.Vector3(ix, BALL_RADIUS, iz);
    const attackDir = awardedTeam === 'home' ? 1 : -1;

    this.lastTouchTeam = awardedTeam;
    this.possessionTeam = awardedTeam;
    this.outOfPlayCooldown = 2.0;

    const pool = this.players.filter((p) => p.team === awardedTeam && p.role !== 'gk' && !p.sentOff);
    const taker =
      pool.length > 0
        ? pool.reduce((best, p) => (p.pos.distanceToSquared(spot) < best.pos.distanceToSquared(spot) ? p : best))
        : null;

    this.ballPos.set(ix, 1.85, iz);
    this.ballVel.set(0, 0, 0);
    this.ballMesh.position.copy(this.ballPos);
    this.ballShadowMesh.position.set(ix, 0.025, iz);

    if (taker) {
      taker.pos.set(ix, 0, zSide * (PITCH_HALF_Z + 0.4));
      taker.rotY = Math.atan2(0, -zSide);
      this.resetActorPose(taker);
    }

    // Ensure receivers wait cleanly 3.5m inside the touchline
    let recCount = 0;
    for (const p of this.players) {
      if (p.sentOff || p === taker || p.role === 'gk') continue;
      if (p.team === awardedTeam && recCount < 2) {
        p.pos.set(
          THREE.MathUtils.clamp(ix + (recCount === 0 ? attackDir * 3.8 : -attackDir * 2.5), -PITCH_HALF_X + 2, PITCH_HALF_X - 2),
          0,
          zSide * (PITCH_HALF_Z - 3.6 - recCount * 2.2)
        );
        p.rotY = Math.atan2(0, zSide);
        this.resetActorPose(p);
        recCount++;
      }
    }

    this.setPiece = {
      type: 'throw_in',
      timer: 0,
      duration: 1.9,
      kicked: false,
      spot,
      attackDir,
      taker,
      gk: null,
      goalAimZ: 0,
      willScore: false,
    };
    this.callbacks.onSetPieceBanner?.('sp_throw_in', awardedTeam);
  }

  public setMenuMode() {
    this.mode = 'menu';
    this.paused = false;
    this.activeIncident = null;
    this.incidentMarkerMesh.visible = false;
    this.offsideLineMesh.visible = false;
    this.refPos.set(0, 0, 0);
    this.referee.group.position.set(0, 0, 0);
    if (this.players.length === 0) {
      // Populate ambient showcase players on pitch for menu background
      import('../data/leagues').then(({ generateFixtureForDivision }) => {
        if (this.disposed) return;
        const fx = generateFixtureForDivision('worldcup_final');
        this.fixture = fx;
        this.spawnPlayersForFixture(fx);
      });
    }
  }

  public updateSettings(settings: GameSettings) {
    this.settings = settings;
    if (!this.isSoftwareGl) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * settings.graphics.resolutionScale);
      this.renderer.shadowMap.enabled = settings.graphics.shadowQuality !== 'off';
      this.keyLight.castShadow = settings.graphics.shadowQuality !== 'off';
    }
  }

  public triggerCardVisual(type: 'yellow' | 'red') {
    this.refCardTimer = 1.6;
    if (this.referee.cardMesh) {
      const mat = this.referee.cardMesh.material as THREE.MeshStandardMaterial;
      mat.color.set(type === 'yellow' ? '#facc15' : '#ef4444');
      mat.emissive.set(type === 'yellow' ? '#ca8a04' : '#b91c1c');
      this.referee.cardMesh.visible = true;
    }
  }

  public triggerLinesmanFlag(side: 0 | 1 = 1) {
    this.linesmen[side].flagTimer = 2.4;
  }

  public triggerCrowdReaction(mood: 'cheer' | 'boo', duration = 2.5) {
    this.crowdMood = mood;
    this.crowdMoodTimer = duration;
    if (mood === 'cheer') soundEngine.cheer(this.division?.crowdIntensity ?? 0.7);
    else soundEngine.boo(this.division?.crowdIntensity ?? 0.7);
  }

  public startReplayMode(incident: ActiveIncident) {
    if (this.mode !== 'replay') {
      this.replaySavedBall.copy(this.ballPos);
      this.replaySavedActors = [];
      const offender = this.players.find(
        (p) =>
          (incident.offenderPlayerId && p.id === incident.offenderPlayerId) ||
          (p.team === incident.offendingTeam && p.number === incident.offendingPlayerNumber)
      );
      const victim = this.players.find(
        (p) =>
          (incident.victimPlayerId && p.id === incident.victimPlayerId) ||
          (p.team !== incident.offendingTeam && p.number === incident.victimPlayerNumber)
      );
      if (offender) {
        this.replaySavedActors.push({
          player: offender,
          x: offender.pos.x,
          z: offender.pos.z,
          rotY: offender.rotY,
          rotX: offender.group.rotation.x,
        });
      }
      if (victim) {
        this.replaySavedActors.push({
          player: victim,
          x: victim.pos.x,
          z: victim.pos.z,
          rotY: victim.rotY,
          rotX: victim.group.rotation.x,
        });
      }
    }

    this.replayIncident = incident;
    this.mode = 'replay';
    this.replayTimer = 0;
    this.replayNorm = 0;
    this.replayPaused = false;
    this.replaySpeed = 0.35;
    this.replayAngle = incident.type === 'offside' ? 'offside' : 'side';
    this.replayProgressAccum = 0;

    // Move non-involved players clear of the replay spot so no bystander blocks the VAR camera
    for (const p of this.players) {
      if (p.sentOff) continue;
      if (p.id === incident.offenderPlayerId || p.id === incident.victimPlayerId) continue;
      const dx = p.pos.x - incident.position.x;
      const dz = p.pos.z - incident.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 4.8) {
        const nx = d > 0.05 ? dx / d : 1;
        const nz = d > 0.05 ? dz / d : 0;
        p.pos.x = THREE.MathUtils.clamp(incident.position.x + nx * 5.0, -PITCH_HALF_X + 1, PITCH_HALF_X - 1);
        p.pos.z = THREE.MathUtils.clamp(incident.position.z + nz * 5.0, -PITCH_HALF_Z + 1, PITCH_HALF_Z - 1);
        p.group.position.copy(p.pos);
      }
    }

    this.incidentMarkerMesh.visible = true;
    this.incidentMarkerMesh.position.set(incident.position.x, 0.035, incident.position.z);
    if (incident.type === 'offside' && incident.replayFrames.length > 0) {
      const last = incident.replayFrames[incident.replayFrames.length - 1];
      this.offsideLineMesh.position.set(last.defenderLineZ, 0.04, 0);
      this.offsideLineMesh.visible = true;
    } else {
      this.offsideLineMesh.visible = false;
    }

    this.applyReplayFrame(0, 0.016);
    this.callbacks.onReplayProgress?.(0, 0, this.replayLoopDuration);
  }

  public setReplayPaused(paused: boolean) {
    this.replayPaused = paused;
  }

  public setReplaySpeed(speed: number) {
    this.replaySpeed = THREE.MathUtils.clamp(speed, 0.15, 1.5);
  }

  public setReplayAngle(angle: 'side' | 'closeup' | 'offside') {
    this.replayAngle = angle;
  }

  public seekReplay(norm: number) {
    const clamped = THREE.MathUtils.clamp(norm, 0, 1);
    this.replayNorm = clamped;
    this.replayTimer = clamped * this.replayLoopDuration;
    this.applyReplayFrame(clamped, 0.016);
    this.callbacks.onReplayProgress?.(
      clamped,
      clamped * this.replayLoopDuration,
      this.replayLoopDuration
    );
  }

  public stopReplayMode() {
    if (this.mode === 'replay') {
      this.ballPos.copy(this.replaySavedBall);
      this.ballMesh.position.copy(this.ballPos);
      this.ballShadowMesh.position.set(this.ballPos.x, 0.025, this.ballPos.z);
      for (const saved of this.replaySavedActors) {
        saved.player.pos.set(saved.x, 0, saved.z);
        saved.player.rotY = saved.rotY;
        saved.player.group.position.set(saved.x, 0, saved.z);
        saved.player.group.rotation.y = saved.rotY;
        saved.player.group.rotation.x = saved.rotX;
        saved.player.leftLeg.rotation.set(0, 0, 0);
        saved.player.rightLeg.rotation.set(0, 0, 0);
        saved.player.leftArm.rotation.set(0, 0, 0);
        saved.player.rightArm.rotation.set(0, 0, 0);
      }
      this.replaySavedActors = [];
    }
    this.replayIncident = null;
    this.replayPaused = false;
    if (this.mode !== 'menu') {
      this.mode = 'match';
    }
    this.offsideLineMesh.visible = false;
    const showActive = Boolean(this.activeIncident && !this.activeIncident.resolved);
    this.incidentMarkerMesh.visible = showActive;
    if (!showActive) {
      this.offenderRingMesh.visible = false;
      this.victimRingMesh.visible = false;
    }
  }

  public focusOnIncident() {
    const target = this.activeIncident?.position || { x: this.ballPos.x, z: this.ballPos.z };
    const dx = target.x - this.refPos.x;
    const dz = target.z - this.refPos.z;
    if (Math.hypot(dx, dz) > 0.4) {
      // Camera sits behind referee along +sin(refYaw), +cos(refYaw) looking toward refPos,
      // so pointing camera toward target sets refYaw = atan2(-dx, -dz)
      this.refYaw = Math.atan2(-dx, -dz);
      this.refPitch = 0.34;
    }
  }

  public executeDecisionOnPitch(
    action: string,
    incident: ActiveIncident | null,
    selectedPlayer?: { team: 'home' | 'away'; number: number } | null
  ): {
    secondYellowRed?: boolean;
    sentOffPlayer?: { number: number; name: string };
    awardedTeam?: 'home' | 'away';
    setPieceType?: 'penalty' | 'free_kick' | 'throw_in';
  } {
    const result: {
      secondYellowRed?: boolean;
      sentOffPlayer?: { number: number; name: string };
      awardedTeam?: 'home' | 'away';
      setPieceType?: 'penalty' | 'free_kick' | 'throw_in';
    } = {};

    // Identify target player for disciplinary cards
    const findPlayer = (team?: 'home' | 'away', num?: number, id?: string) =>
      this.players.find(
        (p) => (id && p.id === id) || (team && num !== undefined && p.team === team && p.number === num)
      );

    const cardTarget =
      (selectedPlayer && findPlayer(selectedPlayer.team, selectedPlayer.number)) ||
      (incident &&
        findPlayer(incident.offendingTeam, incident.offendingPlayerNumber, incident.offenderPlayerId)) ||
      null;

    if (action === 'yellow_card' && cardTarget) {
      if (cardTarget.cardState === 'yellow') {
        cardTarget.cardState = 'red';
        cardTarget.sentOff = true;
        (cardTarget.cardBadge.material as THREE.MeshBasicMaterial).color.set('#ef4444');
        cardTarget.cardBadge.visible = true;
        result.secondYellowRed = true;
        result.sentOffPlayer = { number: cardTarget.number, name: cardTarget.name };
        this.triggerCardVisual('red');
        soundEngine.redCard();
      } else if (cardTarget.cardState === 'none') {
        cardTarget.cardState = 'yellow';
        (cardTarget.cardBadge.material as THREE.MeshBasicMaterial).color.set('#facc15');
        cardTarget.cardBadge.visible = true;
      }
    } else if (action === 'red_card' && cardTarget) {
      cardTarget.cardState = 'red';
      cardTarget.sentOff = true;
      (cardTarget.cardBadge.material as THREE.MeshBasicMaterial).color.set('#ef4444');
      cardTarget.cardBadge.visible = true;
      result.sentOffPlayer = { number: cardTarget.number, name: cardTarget.name };
    }

    if (action === 'no_foul' || action === 'advantage') {
      // Wave play on, clear fallen player, push ball forward
      for (const p of this.players) {
        if (p.fallenTimer > 0) {
          p.fallenTimer = 0;
          p.group.rotation.x = 0;
        }
      }
      if (this.ballVel.lengthSq() < 16) {
        const dir = incident?.offendingTeam === 'home' ? -1 : 1;
        this.ballVel.set(dir * 7.5, 0.4, (Math.random() - 0.5) * 4);
      }
      return result;
    }

    // Determine which team gets the restart / penalty
    const offendingTeam: 'home' | 'away' = incident?.offendingTeam ?? cardTarget?.team ?? 'away';
    const awardedTeam: 'home' | 'away' = offendingTeam === 'home' ? 'away' : 'home';
    const attackDir = awardedTeam === 'home' ? 1 : -1;
    result.awardedTeam = awardedTeam;

    const availOutfield = (team: 'home' | 'away') =>
      this.players.filter((p) => p.team === team && p.role !== 'gk' && !p.sentOff);

    const pickTaker = (team: 'home' | 'away', spot: THREE.Vector3) => {
      const pool = availOutfield(team);
      if (pool.length === 0) return null;
      return pool.reduce((best, p) =>
        p.pos.distanceToSquared(spot) < best.pos.distanceToSquared(spot) ? p : best
      );
    };

    if (
      action === 'penalty' ||
      ((action === 'yellow_card' || action === 'red_card') &&
        incident?.inPenaltyBox &&
        incident.type !== 'diving')
    ) {
      // REAL 3D PENALTY KICK!
      const spotX = attackDir * (PITCH_HALF_X - 6.0);
      const spot = new THREE.Vector3(spotX, BALL_RADIUS, 0);
      const fwds = availOutfield(awardedTeam).filter((p) => p.role === 'fwd');
      const taker = fwds[0] || pickTaker(awardedTeam, spot);
      const gk = this.players.find((p) => p.team === offendingTeam && p.role === 'gk') || null;

      this.ballPos.copy(spot);
      this.ballVel.set(0, 0, 0);
      this.ballMesh.position.copy(this.ballPos);
      this.ballShadowMesh.position.set(this.ballPos.x, 0.025, this.ballPos.z);

      if (taker) {
        taker.fallenTimer = 0;
        taker.pos.set(spotX - attackDir * 2.8, 0, 0);
        taker.rotY = Math.atan2(attackDir, 0);
        taker.group.position.copy(taker.pos);
        taker.group.rotation.set(0, taker.rotY, 0);
      }
      if (gk) {
        gk.fallenTimer = 0;
        gk.pos.set(attackDir * (PITCH_HALF_X - 0.5), 0, 0);
        gk.rotY = Math.atan2(-attackDir, 0);
        gk.group.position.copy(gk.pos);
        gk.group.rotation.set(0, gk.rotY, 0);
      }
      // Clear all other players outside the penalty box
      for (const p of this.players) {
        if (p === taker || p === gk || p.sentOff) continue;
        p.fallenTimer = 0;
        if (p.role === 'gk') continue;
        if (Math.sign(p.pos.x) === attackDir && Math.abs(p.pos.x) > PENALTY_BOX_X - 2.0) {
          p.pos.x = attackDir * (PENALTY_BOX_X - 2.5);
        }
      }

      const willScore = Math.random() < 0.78;
      const aimSide = Math.random() > 0.5 ? 1 : -1;
      const goalAimZ = willScore
        ? aimSide * (GOAL_HALF_Z - 0.75)
        : aimSide * (GOAL_HALF_Z + 0.9);

      this.setPiece = {
        type: 'penalty',
        timer: 0,
        duration: 3.3,
        kicked: false,
        spot,
        attackDir,
        taker,
        gk,
        goalAimZ,
        willScore,
      };
      result.setPieceType = 'penalty';
      return result;
    }

    if (action === 'throw_in') {
      const ix = THREE.MathUtils.clamp(incident?.position.x ?? this.ballPos.x, -PITCH_HALF_X + 3, PITCH_HALF_X - 3);
      const side = (incident?.position.z ?? this.ballPos.z) >= 0 ? 1 : -1;
      const iz = side * (PITCH_HALF_Z - 0.15);
      const spot = new THREE.Vector3(ix, BALL_RADIUS, iz);
      const taker = pickTaker(awardedTeam, spot);

      this.ballPos.set(ix, 1.85, iz);
      this.ballVel.set(0, 0, 0);
      if (taker) {
        taker.fallenTimer = 0;
        taker.pos.set(ix, 0, side * (PITCH_HALF_Z + 0.35));
        taker.rotY = Math.atan2(0, -side);
        taker.group.position.copy(taker.pos);
        taker.group.rotation.set(0, taker.rotY, 0);
      }
      this.setPiece = {
        type: 'throw_in',
        timer: 0,
        duration: 1.9,
        kicked: false,
        spot,
        attackDir,
        taker,
        gk: null,
        goalAimZ: 0,
        willScore: false,
      };
      result.setPieceType = 'throw_in';
      return result;
    }

    // Free kick (for Foul, Handball, Offside, or Cards outside box)
    const fx = THREE.MathUtils.clamp(incident?.position.x ?? this.ballPos.x, -PITCH_HALF_X + 2.5, PITCH_HALF_X - 2.5);
    const fz = THREE.MathUtils.clamp(incident?.position.z ?? this.ballPos.z, -PITCH_HALF_Z + 2, PITCH_HALF_Z - 2);
    const spot = new THREE.Vector3(fx, BALL_RADIUS, fz);
    const taker = pickTaker(awardedTeam, spot);

    this.ballPos.copy(spot);
    this.ballVel.set(0, 0, 0);
    this.ballMesh.position.copy(this.ballPos);
    this.ballShadowMesh.position.set(this.ballPos.x, 0.025, this.ballPos.z);

    if (taker) {
      taker.fallenTimer = 0;
      taker.pos.set(fx - attackDir * 1.8, 0, fz);
      taker.rotY = Math.atan2(attackDir, 0);
      this.resetActorPose(taker);
    }

    // Organize a realistic 3-defender wall when free kick is within shooting range, and push others back 5m
    const goalX = attackDir * PITCH_HALF_X;
    const distToGoal = Math.hypot(goalX - fx, -fz);
    const toGoalX = distToGoal > 0.1 ? (goalX - fx) / distToGoal : attackDir;
    const toGoalZ = distToGoal > 0.1 ? -fz / distToGoal : 0;
    const wallCandidates = availOutfield(offendingTeam);
    let wallPlaced = 0;

    for (const p of wallCandidates) {
      if (distToGoal < 23 && wallPlaced < 3) {
        const lateral = (wallPlaced - 1) * 0.85;
        p.pos.set(
          THREE.MathUtils.clamp(fx + toGoalX * 4.8 - toGoalZ * lateral, -PITCH_HALF_X + 1.5, PITCH_HALF_X - 1.5),
          0,
          THREE.MathUtils.clamp(fz + toGoalZ * 4.8 + toGoalX * lateral, -PITCH_HALF_Z + 1.2, PITCH_HALF_Z - 1.2)
        );
        p.rotY = Math.atan2(-toGoalX, -toGoalZ);
        this.resetActorPose(p);
        wallPlaced++;
      } else if (p.pos.distanceTo(spot) < 5.0) {
        p.pos.x = THREE.MathUtils.clamp(fx + attackDir * 5.2, -PITCH_HALF_X + 1.5, PITCH_HALF_X - 1.5);
        this.resetActorPose(p);
      }
    }

    this.lastTouchTeam = awardedTeam;
    this.possessionTeam = awardedTeam;
    this.outOfPlayCooldown = 2.0;

    this.setPiece = {
      type: 'free_kick',
      timer: 0,
      duration: 2.1,
      kicked: false,
      spot,
      attackDir,
      taker,
      gk: null,
      goalAimZ: (Math.random() - 0.5) * 3.5,
      willScore: false,
    };
    result.setPieceType = 'free_kick';
    return result;
  }

  public clearActiveIncident(wasControversial = false) {
    if (this.mode === 'replay') {
      this.stopReplayMode();
    }
    this.activeIncident = null;
    this.liveIncidentTimer = 0;
    this.incidentMarkerMesh.visible = false;
    this.offenderRingMesh.visible = false;
    this.victimRingMesh.visible = false;
    this.offsideLineMesh.visible = false;

    // Ensure players stand cleanly back up with feet on turf
    for (const p of this.players) {
      if (!p.sentOff) {
        this.resetActorPose(p);
      }
    }
    if (!this.setPiece && this.ballVel.lengthSq() < 4) {
      const dir = Math.random() > 0.5 ? 1 : -1;
      this.ballVel.set(dir * 5.5, 0.5, (Math.random() - 0.5) * 4);
    }

    const avgInterval = Math.max(5.5, Math.min(9.5, this.matchDurationSec / 14));
    this.nextIncidentTimer = avgInterval * (0.75 + Math.random() * 0.45);

    if (wasControversial && this.division?.surroundRefOnControversy) {
      this.surroundTimer = 3.2;
      this.shakeAmount = 0.25;
      this.triggerCrowdReaction('boo', 3.0);
    }
  }

  public applyNetworkStateSync(msg: Record<string, any>) {
    if (this.role === 'main_referee') return;
    if (typeof msg.minute === 'number' && msg.minute !== this.lastReportedMinute) {
      this.lastReportedMinute = msg.minute;
      this.callbacks.onMatchMinute(msg.minute);
    }
    if (typeof msg.homeScore === 'number' && typeof msg.awayScore === 'number') {
      this.homeScore = msg.homeScore;
      this.awayScore = msg.awayScore;
      if (this.fixture) {
        this.updateScoreboardTexture(
          this.fixture.home.shortName,
          this.fixture.away.shortName,
          this.homeScore,
          this.awayScore,
          this.lastReportedMinute
        );
      }
    }
    if (msg.ball) {
      this.ballPos.set(msg.ball.x, msg.ball.y, msg.ball.z);
      this.ballMesh.position.copy(this.ballPos);
      this.ballShadowMesh.position.set(this.ballPos.x, 0.025, this.ballPos.z);
    }
    if (Array.isArray(msg.players)) {
      msg.players.forEach((pd: { x: number; z: number; rot: number }, idx: number) => {
        const pl = this.players[idx];
        if (pl) {
          pl.pos.set(pd.x, 0, pd.z);
          pl.rotY = pd.rot;
          pl.group.position.set(pd.x, 0, pd.z);
          pl.group.rotation.y = pd.rot;
        }
      });
    }
    if (msg.mainRef) {
      this.referee.group.position.set(msg.mainRef.x, 0, msg.mainRef.z);
      this.referee.group.rotation.y = msg.mainRef.rot;
    }
  }

  public syncIncidentFromNetwork(incident: ActiveIncident | null, status: 'spawn' | 'resolved') {
    if (status === 'spawn' && incident) {
      this.activeIncident = incident;
      this.incidentMarkerMesh.position.set(incident.position.x, 0.035, incident.position.z);
      this.incidentMarkerMesh.visible = true;
    } else {
      this.activeIncident = null;
      this.incidentMarkerMesh.visible = false;
      this.offenderRingMesh.visible = false;
      this.victimRingMesh.visible = false;
      this.offsideLineMesh.visible = false;
      if (this.mode === 'replay') {
        this.stopReplayMode();
      }
    }
  }

  public updateScoreboardTexture(home: string, away: string, hs: number, as: number, min: number) {
    const ctx = this.scoreboardCtx;
    ctx.fillStyle = '#090f19';
    ctx.fillRect(0, 0, 512, 160);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 504, 152);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${home}   ${hs} - ${as}   ${away}`, 256, 74);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(`${Math.max(0, min)}'`, 256, 126);
    this.scoreboardTex.needsUpdate = true;
  }

  private bindEvents() {
    const el = this.renderer.domElement;

    const onResize = () => {
      if (this.disposed) return;
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (this.mode !== 'match' || this.paused) return;
      this.isDraggingLook = true;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      this.dragDistance = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!this.isDraggingLook || (this.mode !== 'match' && this.mode !== 'replay') || this.paused) return;
      const dx = e.clientX - this.lastPointer.x;
      const dy = e.clientY - this.lastPointer.y;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      this.dragDistance += Math.hypot(dx, dy);
      const sens = 0.0045 * this.settings.gameplay.cameraSensitivity;
      this.refYaw -= dx * sens;
      this.refPitch = THREE.MathUtils.clamp(this.refPitch + dy * sens, 0.08, 0.95);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (this.isDraggingLook && this.dragDistance < 8 && this.mode === 'match' && !this.paused) {
        // Left-click player selection via Raycaster on layer 1
        const rect = el.getBoundingClientRect();
        this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const proxies = this.players.map((p) => p.hitProxy);
        const hits = this.raycaster.intersectObjects(proxies, false);
        if (hits.length > 0) {
          const idx = hits[0].object.userData.playerIndex;
          const player = this.players[idx];
          if (player) {
            this.selectionRing.position.set(player.pos.x, 0.03, player.pos.z);
            this.selectionRing.visible = true;
            this.callbacks.onPlayerSelected({
              team: player.team,
              number: player.number,
              name: player.name,
              cardState: player.cardState,
            });
          }
        }
      }
      this.isDraggingLook = false;
    };

    window.addEventListener('resize', onResize);
    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    this.cleanupEvents = () => {
      window.removeEventListener('resize', onResize);
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }

  private cleanupEvents = () => {};

  private updateRefereeControl(dt: number, input: MovementVector) {
    // Camera rotation from right stick / mobile look
    this.refYaw -= input.lookX * dt * 1.4;
    this.refPitch = THREE.MathUtils.clamp(this.refPitch + input.lookY * dt * 0.9, 0.08, 0.95);

    const isMoving = Math.abs(input.moveX) > 0.05 || Math.abs(input.moveY) > 0.05;
    let speed = input.precision ? 3.5 : 6.8;
    if (input.sprint && this.stamina > 3 && isMoving) {
      speed = 10.6;
      this.stamina = Math.max(0, this.stamina - 16 * dt);
    } else {
      this.stamina = Math.min(100, this.stamina + 11 * dt);
    }
    const roundedStamina = Math.round(this.stamina);
    if (roundedStamina !== this.lastReportedStamina) {
      this.lastReportedStamina = roundedStamina;
      this.callbacks.onStaminaChange(roundedStamina);
    }

    if (this.role === 'var_referee') {
      // VAR reviewer stays stationary in overhead camera booth (mouse drag tilts/orbits slightly)
      return;
    }

    const isLinesman1 = this.role === 'assistant_referee_1';
    const isLinesman2 = this.role === 'assistant_referee_2';
    const isLinesman = isLinesman1 || isLinesman2;

    if (isMoving) {
      // Camera-relative movement on XZ plane
      const sin = Math.sin(this.refYaw);
      const cos = Math.cos(this.refYaw);
      const fwdX = -sin;
      const fwdZ = -cos;
      const rightX = cos;
      const rightZ = -sin;

      const vx = (fwdX * input.moveY + rightX * input.moveX) * speed;
      const vz = (fwdZ * input.moveY + rightZ * input.moveX) * speed;

      this.refPos.x = THREE.MathUtils.clamp(this.refPos.x + vx * dt, -PITCH_HALF_X - 1.5, PITCH_HALF_X + 1.5);
      this.refPos.z = THREE.MathUtils.clamp(
        this.refPos.z + vz * dt,
        isLinesman1 ? -PITCH_HALF_Z - 1.8 : isLinesman2 ? PITCH_HALF_Z + 0.6 : -PITCH_HALF_Z - 1.5,
        isLinesman1 ? -PITCH_HALF_Z - 0.6 : PITCH_HALF_Z + 1.8
      );
      this.refMoveYaw = Math.atan2(vx, vz);
      this.refAnimPhase += dt * (input.sprint ? 14 : 9);
    }

    if (!isLinesman) {
      this.referee.group.position.copy(this.refPos);
      this.referee.group.rotation.y = this.refMoveYaw;

      const stride = isMoving ? Math.sin(this.refAnimPhase) * 0.55 : 0;
      this.referee.leftLeg.rotation.x = stride;
      this.referee.rightLeg.rotation.x = -stride;
      this.referee.leftArm.rotation.x = -stride * 0.7;

      if (this.refCardTimer > 0) {
        this.refCardTimer -= dt;
        this.referee.rightArm.rotation.x = -Math.PI * 0.88;
        if (this.refCardTimer <= 0 && this.referee.cardMesh) {
          this.referee.cardMesh.visible = false;
        }
      } else {
        this.referee.rightArm.rotation.x = stride * 0.7;
      }
    } else {
      // Linesman 1 controls North touchline (index 0); Linesman 2 controls South touchline (index 1)
      const lmIdx = isLinesman1 ? 0 : 1;
      const lm = this.linesmen[lmIdx];
      const fixedZ = isLinesman1 ? -PITCH_HALF_Z - 1.0 : PITCH_HALF_Z + 1.0;
      lm.fig.group.position.set(this.refPos.x, 0, fixedZ);
      lm.fig.group.rotation.y = isLinesman1 ? 0 : Math.PI;
      const stride = isMoving ? Math.sin(this.refAnimPhase) * 0.5 : 0;
      lm.fig.leftLeg.rotation.x = stride;
      lm.fig.rightLeg.rotation.x = -stride;
    }
  }

  private updateFootballSimulation(dt: number) {
    if (!this.fixture || this.players.length === 0) return;

    const speedScale =
      (this.division?.gameplaySpeed ?? 1.0) *
      (this.settings.gameplay.difficulty === 'easy'
        ? 0.85
        : this.settings.gameplay.difficulty === 'hard'
        ? 1.15
        : this.settings.gameplay.difficulty === 'realistic'
        ? 1.2
        : 1.0);

    // Pause match clock & open-play movement once live tackle choreography finishes while awaiting referee whistle decision!
    const incidentPlayStopped = Boolean(
      this.activeIncident && !this.activeIncident.resolved && this.liveIncidentTimer <= 0 && !this.setPiece
    );

    if (!incidentPlayStopped) {
      this.matchTimeElapsed += dt;
    }
    const minute = Math.min(90, Math.floor((this.matchTimeElapsed / this.matchDurationSec) * 90));
    if (minute !== this.lastReportedMinute) {
      this.lastReportedMinute = minute;
      this.callbacks.onMatchMinute(minute);
      this.updateScoreboardTexture(
        this.fixture.home.shortName,
        this.fixture.away.shortName,
        this.homeScore,
        this.awayScore,
        minute
      );
    }

    if (this.outOfPlayCooldown > 0) {
      this.outOfPlayCooldown = Math.max(0, this.outOfPlayCooldown - dt);
    }

    // Handle active set-piece (Kickoff / Penalty / Free Kick / Corner / Goal Kick / Throw-In)
    if (this.setPiece) {
      const sp = this.setPiece;
      sp.timer += dt;

      if (!sp.kicked) {
        const kickAt = sp.type === 'penalty' ? 1.35 : sp.type === 'corner' ? 1.2 : 0.9;
        if (sp.taker) {
          if (sp.type === 'throw_in') {
            sp.taker.leftArm.rotation.x = -Math.PI * 0.9;
            sp.taker.rightArm.rotation.x = -Math.PI * 0.9;
          } else {
            const runProg = THREE.MathUtils.clamp(sp.timer / kickAt, 0, 1);
            const targetX = sp.spot.x - sp.attackDir * (1.8 * (1 - runProg) + 0.45);
            sp.taker.pos.x = THREE.MathUtils.damp(sp.taker.pos.x, targetX, 10, dt);
            sp.taker.pos.z = THREE.MathUtils.damp(sp.taker.pos.z, sp.spot.z, 10, dt);
            sp.taker.group.position.copy(sp.taker.pos);
            sp.taker.animPhase += dt * 11;
            const stride = Math.sin(sp.taker.animPhase) * 0.55;
            sp.taker.leftLeg.rotation.x = stride;
            sp.taker.rightLeg.rotation.x = -stride;
          }
        }

        if (sp.timer >= kickAt) {
          sp.kicked = true;
          soundEngine.whistle('short');
          if (sp.type === 'kickoff') {
            soundEngine.kick();
            this.ballVel.set(-sp.attackDir * 5.2, 0.2, (Math.random() - 0.5) * 4.5);
          } else if (sp.type === 'penalty') {
            soundEngine.kick();
            this.ballVel.set(sp.attackDir * 22, 2.6, sp.goalAimZ * 1.4);
            if (sp.gk) {
              const diveDir = sp.willScore ? -Math.sign(sp.goalAimZ || 1) : Math.sign(sp.goalAimZ || 1);
              sp.gk.pos.z = THREE.MathUtils.clamp(diveDir * 2.2, -GOAL_HALF_Z, GOAL_HALF_Z);
              sp.gk.group.position.copy(sp.gk.pos);
              sp.gk.fallenTimer = 1.2;
            }
          } else if (sp.type === 'corner') {
            soundEngine.kick();
            const inwardX = sp.spot.x > 0 ? -1 : 1;
            const inwardZ = sp.spot.z > 0 ? -1 : 1;
            this.ballVel.set(inwardX * 5.5, 4.8, inwardZ * 10.5);
          } else if (sp.type === 'goal_kick') {
            soundEngine.kick();
            this.ballVel.set(sp.attackDir * 15.5, 5.2, sp.goalAimZ);
          } else if (sp.type === 'throw_in') {
            const inwardDir = sp.spot.z >= 0 ? -1 : 1;
            this.ballPos.set(sp.spot.x, 1.5, sp.spot.z + inwardDir * 0.4);
            this.ballVel.set(sp.attackDir * 4.8, 3.8, inwardDir * 7.8);
            if (sp.taker) {
              sp.taker.leftArm.rotation.x = 0;
              sp.taker.rightArm.rotation.x = 0;
            }
          } else {
            soundEngine.kick();
            const nearGoal = Math.abs(sp.spot.x - sp.attackDir * PITCH_HALF_X) < 18;
            this.ballVel.set(
              sp.attackDir * (nearGoal ? 16.5 : 11.5),
              nearGoal ? 3.8 : 2.2,
              sp.goalAimZ
            );
          }
        }
      }

      if (sp.timer >= sp.duration) {
        this.setPiece = null;
      }
    }

    // Ball physics (STRICT ground clamp so ball NEVER goes underground!)
    if (incidentPlayStopped || (this.setPiece && !this.setPiece.kicked)) {
      this.ballVel.set(0, 0, 0);
      if (this.setPiece?.type !== 'throw_in') {
        this.ballPos.y = BALL_RADIUS;
      }
    } else {
      this.ballPos.x += this.ballVel.x * dt * speedScale;
      this.ballPos.z += this.ballVel.z * dt * speedScale;
      this.ballPos.y += this.ballVel.y * dt;

      const horizDamp = Math.pow(0.58, dt);
      this.ballVel.x *= horizDamp;
      this.ballVel.z *= horizDamp;

      if (this.ballPos.y > BALL_RADIUS || this.ballVel.y > 0) {
        this.ballVel.y -= 19.6 * dt;
      }
      if (this.ballPos.y <= BALL_RADIUS) {
        this.ballPos.y = BALL_RADIUS;
        if (this.ballVel.y < -1.1) {
          this.ballVel.y = -this.ballVel.y * 0.48;
        } else {
          this.ballVel.y = 0;
        }
      }
    }

    this.ballMesh.position.copy(this.ballPos);
    this.ballMesh.rotation.z -= this.ballVel.x * dt * 2.5;
    this.ballMesh.rotation.x += this.ballVel.z * dt * 2.5;
    this.ballShadowMesh.position.set(this.ballPos.x, 0.025, this.ballPos.z);
    const shadowScale = Math.max(0.45, 1 - (this.ballPos.y - BALL_RADIUS) * 0.14);
    this.ballShadowMesh.scale.setScalar(shadowScale);

    // Goal detection! (checked BEFORE outer boundary checks; resets organized kickoff in both halves!)
    if (Math.abs(this.ballPos.z) < GOAL_HALF_Z && Math.abs(this.ballPos.x) >= PITCH_HALF_X - 0.35) {
      const scoringTeam: 'home' | 'away' = this.ballPos.x > 0 ? 'home' : 'away';
      if (scoringTeam === 'home') this.homeScore++;
      else this.awayScore++;

      const fwds = this.players.filter((p) => p.team === scoringTeam && p.role === 'fwd' && !p.sentOff);
      const scorer = fwds[Math.floor(Math.random() * fwds.length)]?.name || 'Striker';
      this.callbacks.onGoalScored(scoringTeam, scorer);
      this.triggerCrowdReaction('cheer', 3.5);
      soundEngine.whistle('short');
      this.setupKickoff(scoringTeam === 'home' ? 'away' : 'home');
      return;
    }

    // Out-of-bounds restart detection (Corner Kick / Goal Kick / Throw-In)
    if (!this.setPiece && !this.activeIncident && this.outOfPlayCooldown <= 0) {
      if (Math.abs(this.ballPos.x) >= PITCH_HALF_X - 0.12) {
        const endSide = (this.ballPos.x > 0 ? 1 : -1) as 1 | -1;
        const defendingTeam: 'home' | 'away' = endSide === 1 ? 'away' : 'home';
        const attackingTeam: 'home' | 'away' = defendingTeam === 'home' ? 'away' : 'home';
        const zSign = (this.ballPos.z >= 0 ? 1 : -1) as 1 | -1;
        soundEngine.whistle('short');
        if (this.lastTouchTeam === defendingTeam) {
          this.triggerCornerKick(attackingTeam, endSide, zSign);
        } else {
          this.triggerGoalKick(defendingTeam, endSide, zSign);
        }
        return;
      }
      if (Math.abs(this.ballPos.z) >= PITCH_HALF_Z - 0.12) {
        const zSide = (this.ballPos.z >= 0 ? 1 : -1) as 1 | -1;
        const awardedTeam: 'home' | 'away' = this.lastTouchTeam === 'home' ? 'away' : 'home';
        soundEngine.whistle('short');
        this.triggerAutoThrowIn(awardedTeam, this.ballPos.x, zSide);
        return;
      }
    }

    // Keep ball inside bounds if triggered during cooldown or incident
    if (Math.abs(this.ballPos.x) > PITCH_HALF_X - 0.3) {
      this.ballPos.x = Math.sign(this.ballPos.x) * (PITCH_HALF_X - 0.4);
      this.ballVel.x *= -0.75;
    }
    if (Math.abs(this.ballPos.z) > PITCH_HALF_Z - 0.3) {
      this.ballPos.z = Math.sign(this.ballPos.z) * (PITCH_HALF_Z - 0.4);
      this.ballVel.z *= -0.75;
    }

    // Update 22 players
    let closestHome: PlayerSim | null = null;
    let closestAway: PlayerSim | null = null;
    let minH = Infinity;
    let minA = Infinity;

    for (const p of this.players) {
      if (p.sentOff) continue;
      const dist = p.pos.distanceTo(this.ballPos);
      if (p.team === 'home' && dist < minH && p.role !== 'gk') {
        minH = dist;
        closestHome = p;
      }
      if (p.team === 'away' && dist < minA && p.role !== 'gk') {
        minA = dist;
        closestAway = p;
      }
    }

    if (this.surroundTimer > 0) this.surroundTimer -= dt;

    // Live 3D sliding tackle / dive / handball choreography right after incident spawns
    if (this.liveIncidentTimer > 0 && this.activeIncident) {
      this.liveIncidentTimer = Math.max(0, this.liveIncidentTimer - dt);
      const inc = this.activeIncident;
      const frames = inc.replayFrames;
      if (frames.length > 1) {
        const progress = 1 - this.liveIncidentTimer / 1.15;
        const exactIdx = THREE.MathUtils.clamp(progress, 0, 1) * (frames.length - 1);
        const i0 = Math.min(frames.length - 1, Math.floor(exactIdx));
        const i1 = Math.min(frames.length - 1, i0 + 1);
        const alpha = exactIdx - i0;
        const f0 = frames[i0];
        const f1 = frames[i1];

        const offender = this.players.find((p) => p.id === inc.offenderPlayerId);
        const victim = this.players.find((p) => p.id === inc.victimPlayerId);
        if (offender) {
          offender.pos.set(
            THREE.MathUtils.lerp(f0.offender.x, f1.offender.x, alpha),
            0,
            THREE.MathUtils.lerp(f0.offender.z, f1.offender.z, alpha)
          );
          offender.rotY = THREE.MathUtils.lerp(f0.offender.rot, f1.offender.rot, alpha);
          offender.group.position.copy(offender.pos);
          offender.group.rotation.y = offender.rotY;
          if (inc.type === 'handball') {
            offender.rightArm.rotation.z = -1.35;
          } else if (inc.type === 'violent_conduct' && progress > 0.35) {
            offender.rightArm.rotation.x = -1.85;
          } else if (
            inc.type === 'dangerous_tackle' ||
            inc.type === 'penalty_incident' ||
            inc.type === 'clean_tackle' ||
            inc.type === 'normal_foul'
          ) {
            const slideAmt = progress > 0.25 ? Math.min(1, (progress - 0.25) / 0.25) : 0;
            this.applySlidePose(offender, slideAmt);
          }
          this.offenderRingMesh.position.set(offender.pos.x, 0.038, offender.pos.z);
          this.offenderRingMesh.visible = true;
        }
        if (victim) {
          victim.pos.set(
            THREE.MathUtils.lerp(f0.victim.x, f1.victim.x, alpha),
            0,
            THREE.MathUtils.lerp(f0.victim.z, f1.victim.z, alpha)
          );
          victim.rotY = THREE.MathUtils.lerp(f0.victim.rot, f1.victim.rot, alpha);
          victim.group.position.copy(victim.pos);
          victim.group.rotation.y = victim.rotY;
          if (inc.type === 'diving' && progress > 0.35) {
            victim.group.position.y = 0.2;
            victim.group.rotation.x = Math.PI * 0.48;
            victim.leftArm.rotation.x = -Math.PI * 0.75;
            victim.rightArm.rotation.x = -Math.PI * 0.75;
          }
          this.victimRingMesh.position.set(victim.pos.x, 0.038, victim.pos.z);
          this.victimRingMesh.visible = true;
        }
        this.ballPos.set(
          THREE.MathUtils.lerp(f0.ball.x, f1.ball.x, alpha),
          Math.max(BALL_RADIUS, THREE.MathUtils.lerp(f0.ball.y, f1.ball.y, alpha)),
          THREE.MathUtils.lerp(f0.ball.z, f1.ball.z, alpha)
        );
        this.ballMesh.position.copy(this.ballPos);
        this.ballShadowMesh.position.set(this.ballPos.x, 0.025, this.ballPos.z);
      }
    }

    for (const p of this.players) {
      if (p.sentOff) {
        p.pos.x = THREE.MathUtils.damp(p.pos.x, p.homePos.x * 0.15, 3, dt);
        p.pos.z = THREE.MathUtils.damp(p.pos.z, -PITCH_HALF_Z - 4.2, 3, dt);
        p.group.position.set(p.pos.x, 0, p.pos.z);
        p.group.rotation.x = 0;
        p.leftLeg.rotation.x = 0;
        p.rightLeg.rotation.x = 0;
        continue;
      }

      if (
        this.setPiece &&
        (p === this.setPiece.taker ||
          (this.setPiece.type === 'penalty' && p === this.setPiece.gk && this.setPiece.kicked))
      ) {
        if (p.fallenTimer > 0) {
          p.fallenTimer -= dt;
          p.group.rotation.z = THREE.MathUtils.damp(p.group.rotation.z, Math.PI / 2, 10, dt);
        }
        continue;
      }

      // Keep non-takers organized cleanly in place until set-piece kick occurs
      if (this.setPiece && !this.setPiece.kicked) {
        p.leftLeg.rotation.x = 0;
        p.rightLeg.rotation.x = 0;
        p.leftArm.rotation.x = 0;
        p.rightArm.rotation.x = 0;
        p.group.position.set(p.pos.x, 0, p.pos.z);
        p.group.rotation.set(0, p.rotY, 0);
        continue;
      }

      if (incidentPlayStopped && this.activeIncident) {
        const inc = this.activeIncident;
        const isInvolved = p.id === inc.offenderPlayerId || p.id === inc.victimPlayerId;
        if (isInvolved) {
          if (p.id === inc.victimPlayerId && p.fallenTimer > 0) {
            p.group.position.y = THREE.MathUtils.damp(p.group.position.y, 0.2, 10, dt);
            p.group.rotation.x = THREE.MathUtils.damp(p.group.rotation.x, -Math.PI / 2, 10, dt);
          } else if (
            p.id === inc.offenderPlayerId &&
            (inc.type === 'dangerous_tackle' ||
              inc.type === 'penalty_incident' ||
              inc.type === 'clean_tackle' ||
              inc.type === 'normal_foul')
          ) {
            this.applySlidePose(p, 1.0);
          } else {
            p.group.position.y = THREE.MathUtils.damp(p.group.position.y, 0, 10, dt);
            p.group.rotation.x = THREE.MathUtils.damp(p.group.rotation.x, 0, 10, dt);
          }
          p.group.position.x = p.pos.x;
          p.group.position.z = p.pos.z;
          p.group.rotation.y = p.rotY;
          if (p.id === inc.offenderPlayerId) {
            this.offenderRingMesh.position.set(p.pos.x, 0.038, p.pos.z);
            this.offenderRingMesh.visible = true;
          }
          if (p.id === inc.victimPlayerId) {
            this.victimRingMesh.position.set(p.pos.x, 0.038, p.pos.z);
            this.victimRingMesh.visible = true;
          }
        } else {
          p.group.position.y = THREE.MathUtils.damp(p.group.position.y, 0, 10, dt);
          p.group.rotation.x = THREE.MathUtils.damp(p.group.rotation.x, 0, 10, dt);
          const dx = p.pos.x - inc.position.x;
          const dz = p.pos.z - inc.position.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 4.8) {
            const nx = dist > 0.05 ? dx / dist : 1;
            const nz = dist > 0.05 ? dz / dist : 0;
            const push = Math.min(4.8 - dist, 6.0 * dt);
            p.pos.x = THREE.MathUtils.clamp(p.pos.x + nx * push, -PITCH_HALF_X + 0.8, PITCH_HALF_X - 0.8);
            p.pos.z = THREE.MathUtils.clamp(p.pos.z + nz * push, -PITCH_HALF_Z + 0.8, PITCH_HALF_Z - 0.8);
            p.rotY = Math.atan2(nx, nz);
            p.animPhase += dt * 7;
            const stride = Math.sin(p.animPhase) * 0.35;
            p.leftLeg.rotation.x = stride;
            p.rightLeg.rotation.x = -stride;
          } else {
            p.rotY = Math.atan2(inc.position.x - p.pos.x, inc.position.z - p.pos.z);
            p.leftLeg.rotation.x = 0;
            p.rightLeg.rotation.x = 0;
            p.leftArm.rotation.x = 0;
            p.rightArm.rotation.x = 0;
          }
          p.group.position.x = p.pos.x;
          p.group.position.z = p.pos.z;
          p.group.rotation.y = p.rotY;
        }
        continue;
      }

      if (p.fallenTimer > 0) {
        p.fallenTimer -= dt;
        p.group.position.y = THREE.MathUtils.damp(p.group.position.y, 0.2, 10, dt);
        p.group.rotation.x = THREE.MathUtils.damp(p.group.rotation.x, -Math.PI / 2, 10, dt);
        continue;
      }
      p.group.position.y = THREE.MathUtils.damp(p.group.position.y, 0, 12, dt);
      p.group.rotation.x = THREE.MathUtils.damp(p.group.rotation.x, 0, 10, dt);
      p.group.rotation.z = THREE.MathUtils.damp(p.group.rotation.z, 0, 10, dt);
      p.rightArm.rotation.z = THREE.MathUtils.damp(p.rightArm.rotation.z, 0, 10, dt);

      if (
        this.liveIncidentTimer > 0 &&
        this.activeIncident &&
        (p.id === this.activeIncident.offenderPlayerId || p.id === this.activeIncident.victimPlayerId)
      ) {
        continue;
      }

      const isChaser = p === closestHome || p === closestAway;
      const teamDir = p.team === 'home' ? 1 : -1;
      const tacticalShift = p.team === this.possessionTeam ? teamDir * 3.2 : -teamDir * 2.4;
      let targetX = p.homePos.x + this.ballPos.x * 0.34 + tacticalShift;
      let targetZ = p.homePos.y + this.ballPos.z * 0.24;

      if (this.surroundTimer > 0 && p.role !== 'gk' && p.pos.distanceTo(this.refPos) < 15) {
        const ang = Math.atan2(p.pos.z - this.refPos.z, p.pos.x - this.refPos.x);
        targetX = this.refPos.x + Math.cos(ang) * 2.4;
        targetZ = this.refPos.z + Math.sin(ang) * 2.4;
      } else if (p.role === 'gk') {
        targetX = p.homePos.x;
        targetZ = THREE.MathUtils.clamp(this.ballPos.z * 0.35, -GOAL_HALF_Z + 0.5, GOAL_HALF_Z - 0.5);
      } else if (isChaser) {
        const sideOffset = p.team === 'home' ? -0.45 : 0.45;
        targetX = this.ballPos.x + sideOffset;
        targetZ = this.ballPos.z + (p.team === 'home' ? 0.35 : -0.35);
      }

      if (this.activeIncident && !this.activeIncident.resolved) {
        const idx = targetX - this.activeIncident.position.x;
        const idz = targetZ - this.activeIncident.position.z;
        const idist = Math.hypot(idx, idz);
        if (idist < 4.5 && idist > 0.01) {
          targetX = this.activeIncident.position.x + (idx / idist) * 4.8;
          targetZ = this.activeIncident.position.z + (idz / idist) * 4.8;
        }
      }

      targetX = THREE.MathUtils.clamp(targetX, -PITCH_HALF_X + 0.8, PITCH_HALF_X - 0.8);
      targetZ = THREE.MathUtils.clamp(targetZ, -PITCH_HALF_Z + 0.8, PITCH_HALF_Z - 0.8);

      const dx = targetX - p.pos.x;
      const dz = targetZ - p.pos.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.25) {
        const moveSpd = (isChaser ? 5.2 : 3.6) * speedScale;
        p.pos.x += (dx / dist) * moveSpd * dt;
        p.pos.z += (dz / dist) * moveSpd * dt;
        p.rotY = Math.atan2(dx, dz);
        p.animPhase += dt * (isChaser ? 11 : 7);
      }

      // Smart open-play kick: shoot near goal, else pass toward open forward teammate
      if (!this.setPiece && (!this.activeIncident || this.activeIncident.resolved) && p.pos.distanceTo(this.ballPos) < 0.9) {
        this.lastTouchTeam = p.team;
        this.possessionTeam = p.team;
        const attackDir = p.team === 'home' ? 1 : -1;
        const nearGoal = Math.abs(p.pos.x - attackDir * PITCH_HALF_X) < 15;
        if (nearGoal) {
          const goalZ = (Math.random() - 0.5) * (GOAL_HALF_Z * 1.7);
          const dGoal = Math.hypot(attackDir * PITCH_HALF_X - p.pos.x, goalZ - p.pos.z) || 1;
          this.ballVel.set(
            ((attackDir * PITCH_HALF_X - p.pos.x) / dGoal) * 14.5,
            2.9,
            ((goalZ - p.pos.z) / dGoal) * 14.5
          );
        } else {
          const mates = this.players.filter(
            (m) => m.team === p.team && m !== p && !m.sentOff && (m.pos.x - p.pos.x) * attackDir > 1.5
          );
          const targetMate = mates[Math.floor(Math.random() * mates.length)];
          if (targetMate) {
            const pd = Math.hypot(targetMate.pos.x - p.pos.x, targetMate.pos.z - p.pos.z) || 1;
            const passSpd = Math.min(12, Math.max(7.5, pd * 0.72));
            this.ballVel.set(
              ((targetMate.pos.x - p.pos.x) / pd) * passSpd,
              0.9,
              ((targetMate.pos.z - p.pos.z) / pd) * passSpd
            );
          } else {
            this.ballVel.set(attackDir * 9.0, 1.0, (Math.random() - 0.5) * 5);
          }
        }
        soundEngine.kick();
      }

      p.group.position.x = p.pos.x;
      p.group.position.z = p.pos.z;
      p.group.rotation.y = p.rotY;
      const stride = dist > 0.25 ? Math.sin(p.animPhase) * 0.5 : 0;
      p.leftLeg.rotation.x = stride;
      p.rightLeg.rotation.x = -stride;
      p.leftArm.rotation.x = -stride * 0.6;
      p.rightArm.rotation.x = stride * 0.6;
    }

    // 2-pass pairwise separation solver so players NEVER merge 2-in-1 on the pitch
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < this.players.length; i++) {
        const a = this.players[i];
        if (a.sentOff) continue;
        for (let j = i + 1; j < this.players.length; j++) {
          const b = this.players[j];
          if (b.sentOff) continue;
          const dx = b.pos.x - a.pos.x;
          const dz = b.pos.z - a.pos.z;
          const dSq = dx * dx + dz * dz;
          const minSep = 1.08;
          if (dSq < minSep * minSep) {
            const d = Math.sqrt(dSq);
            const nx = d > 0.001 ? dx / d : 1;
            const nz = d > 0.001 ? dz / d : 0;
            const push = (minSep - d) * 0.5;
            a.pos.x = THREE.MathUtils.clamp(a.pos.x - nx * push, -PITCH_HALF_X + 0.6, PITCH_HALF_X - 0.6);
            a.pos.z = THREE.MathUtils.clamp(a.pos.z - nz * push, -PITCH_HALF_Z + 0.6, PITCH_HALF_Z - 0.6);
            b.pos.x = THREE.MathUtils.clamp(b.pos.x + nx * push, -PITCH_HALF_X + 0.6, PITCH_HALF_X - 0.6);
            b.pos.z = THREE.MathUtils.clamp(b.pos.z + nz * push, -PITCH_HALF_Z + 0.6, PITCH_HALF_Z - 0.6);
          }
        }
      }
    }
    for (const p of this.players) {
      if (!p.sentOff) {
        p.group.position.x = p.pos.x;
        p.group.position.z = p.pos.z;
      }
    }

    // Update patrolling linesmen
    this.linesmen.forEach((lm, i) => {
      const targetX = THREE.MathUtils.clamp(this.ballPos.x * 0.75, -PITCH_HALF_X + 2, PITCH_HALF_X - 2);
      const controlled =
        (this.role === 'assistant_referee_1' && i === 0) ||
        (this.role === 'assistant_referee_2' && i === 1);
      if (!controlled && !incidentPlayStopped) {
        lm.fig.group.position.x = THREE.MathUtils.damp(lm.fig.group.position.x, targetX, 4, dt);
        lm.fig.group.rotation.y = lm.side === -1 ? 0 : Math.PI;
      }
      if (lm.flagTimer > 0) {
        lm.flagTimer -= dt;
        lm.fig.rightArm.rotation.x = -Math.PI * 0.85;
      } else {
        lm.fig.rightArm.rotation.x = 0;
      }
    });

    // Record rolling 3D replay buffer every 0.15s
    if (!incidentPlayStopped) {
      this.replayBufferAccum += dt;
      if (this.replayBufferAccum >= 0.15 && closestHome && closestAway) {
        this.replayBufferAccum = 0;
        this.replayFramesBuffer.push({
          ball: { x: this.ballPos.x, y: this.ballPos.y, z: this.ballPos.z },
          offender: { x: closestHome.pos.x, z: closestHome.pos.z, rot: closestHome.rotY },
          victim: { x: closestAway.pos.x, z: closestAway.pos.z, rot: closestAway.rotY },
          defenderLineZ: closestAway.pos.x,
        });
        if (this.replayFramesBuffer.length > 20) this.replayFramesBuffer.shift();
      }
    }

    // Spawn incidents on Main Referee (authoritative) when not executing a set piece or awaiting decision
    if (this.role === 'main_referee' && !this.setPiece && !this.activeIncident) {
      this.nextIncidentTimer -= dt;
      if (this.nextIncidentTimer <= 0 && minute < 88) {
        this.spawnIncident(closestHome, closestAway, minute);
        const avgInterval = Math.max(5.5, Math.min(9.5, this.matchDurationSec / 14));
        this.nextIncidentTimer = avgInterval * (0.75 + Math.random() * 0.45);
      }
    }
  }

  private buildIncidentChoreography(
    type: IncidentType,
    ix: number,
    iz: number,
    _offenderRot: number,
    _victimRot: number
  ): ActiveIncident['replayFrames'] {
    const frames: ActiveIncident['replayFrames'] = [];
    const steps = 14;
    const defLine = ix + (type === 'offside' ? -0.6 : 0.4);
    const rotSlide = Math.atan2(1.9, -1.6); // Offender slides diagonally forward toward ball & victim path

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      let bx = ix;
      let by = BALL_RADIUS;
      let bz = iz;
      let ox = ix;
      let oz = iz;
      let vx = ix;
      let vz = iz;
      let oRot = Math.atan2(1, 0);
      let vRot = Math.atan2(1, 0);

      if (type === 'diving') {
        vx = THREE.MathUtils.lerp(ix - 2.3, ix + 0.85, t);
        vz = iz - 0.55;
        ox = THREE.MathUtils.lerp(ix - 2.6, ix - 0.95, t);
        oz = THREE.MathUtils.lerp(iz + 2.1, iz + 0.95, t);
        bx = vx + 0.45;
        oRot = Math.atan2(0.8, -0.6);
      } else if (type === 'clean_tackle') {
        // Offender sprints in and performs a visible 3.2m turf slide cleanly sweeping the ball away
        vx = THREE.MathUtils.lerp(ix - 2.3, ix - 0.45, Math.min(1, t * 1.15));
        vz = iz - 0.65;
        ox = THREE.MathUtils.lerp(ix - 2.0, ix + 1.25, t);
        oz = THREE.MathUtils.lerp(iz + 2.3, iz + 0.25, t);
        bx = t < 0.5 ? vx + 0.55 : THREE.MathUtils.lerp(ix + 0.25, ix + 3.8, (t - 0.5) / 0.5);
        oRot = rotSlide;
      } else if (type === 'handball') {
        ox = THREE.MathUtils.lerp(ix - 1.3, ix - 0.35, t);
        oz = iz - 0.6;
        vx = ix + 1.25;
        vz = iz + 0.7;
        bx = THREE.MathUtils.lerp(ix + 1.4, ix - 0.1, t);
        by = BALL_RADIUS + Math.sin(t * Math.PI) * 1.18;
        bz = THREE.MathUtils.lerp(iz + 0.6, iz - 0.25, t);
        oRot = Math.atan2(1, 0.3);
        vRot = Math.atan2(-1, -0.3);
      } else if (type === 'offside') {
        const forward = ix >= 0 ? 1 : -1;
        ox = ix;
        oz = iz - 1.25;
        vx = THREE.MathUtils.lerp(ix - forward * 1.3, ix + forward * 1.85, t);
        vz = iz + 0.75;
        bx = THREE.MathUtils.lerp(ix - forward * 3.0, ix + forward * 2.2, t);
        oRot = Math.atan2(forward, 0);
        vRot = Math.atan2(forward, 0);
      } else {
        // Visible low sliding tackle across grass cleanly timed into victim's path without overlapping
        vx = THREE.MathUtils.lerp(ix - 2.4, ix + 0.75, Math.min(1, t * 1.2));
        vz = iz - 0.45;
        ox = THREE.MathUtils.lerp(ix - 2.1, ix + 0.25, t);
        oz = THREE.MathUtils.lerp(iz + 2.5, iz + 0.35, t);
        bx = t < 0.55 ? vx + 0.45 : ix + 1.1 + 1.6 * ((t - 0.55) / 0.45);
        oRot = rotSlide;
      }

      frames.push({
        ball: { x: bx, y: Math.max(BALL_RADIUS, by), z: bz },
        offender: { x: ox, z: oz, rot: oRot },
        victim: { x: vx, z: vz, rot: vRot },
        defenderLineZ: defLine,
      });
    }
    return frames;
  }

  private spawnIncident(pA: PlayerSim | null, pB: PlayerSim | null, minute: number) {
    if (!pA || !pB) return;

    const div = this.division;
    const roll = Math.random();
    let type: IncidentType = 'normal_foul';

    // Periodically generate box incidents near goal so Penalty vs Outside Box decisions happen naturally
    let ix = THREE.MathUtils.clamp(this.ballPos.x, -PITCH_HALF_X + 2.2, PITCH_HALF_X - 2.2);
    let iz = THREE.MathUtils.clamp(this.ballPos.z, -PITCH_HALF_Z + 1.8, PITCH_HALF_Z - 1.8);

    const inBox = Math.abs(ix) > PENALTY_BOX_X + 0.4 && Math.abs(iz) < PENALTY_BOX_Z - 0.4;
    const nearTouchline = Math.abs(iz) > PITCH_HALF_Z - 3.5;

    if (inBox && roll < div.diveFrequency) {
      type = 'diving';
    } else if (inBox && roll < div.diveFrequency + 0.55) {
      type = 'penalty_incident';
    } else if (nearTouchline && roll < 0.28) {
      type = 'incorrect_throw_in';
    } else if (roll < 0.16) {
      type = 'offside';
    } else if (roll < 0.3) {
      type = 'handball';
    } else if (roll < 0.45) {
      type = 'dangerous_tackle';
    } else if (roll < 0.56) {
      type = 'violent_conduct';
    } else if (roll < 0.72) {
      type = 'clean_tackle';
    } else {
      type = 'normal_foul';
    }

    const offender = Math.random() > 0.5 ? pA : pB;
    const victim = offender === pA ? pB : pA;

    const frames = this.buildIncidentChoreography(type, ix, iz, offender.rotY, victim.rotY);
    const firstFrame = frames[0];
    offender.pos.set(firstFrame.offender.x, 0, firstFrame.offender.z);
    victim.pos.set(firstFrame.victim.x, 0, firstFrame.victim.z);

    if (type !== 'incorrect_throw_in' && type !== 'offside' && type !== 'handball' && type !== 'clean_tackle') {
      victim.fallenTimer = 3.2;
    }
    this.liveIncidentTimer = 1.15;
    soundEngine.collision();

    let correctDecisions: ActiveIncident['correctDecisions'] = ['foul'];
    let isMajorIncident = false;

    switch (type) {
      case 'normal_foul':
        correctDecisions = ['foul'];
        break;
      case 'dangerous_tackle':
        correctDecisions = inBox ? ['penalty', 'yellow_card'] : ['yellow_card', 'foul'];
        isMajorIncident = true;
        break;
      case 'violent_conduct':
        correctDecisions = ['red_card'];
        isMajorIncident = true;
        break;
      case 'handball':
        correctDecisions = inBox ? ['penalty', 'handball'] : ['handball', 'foul'];
        isMajorIncident = inBox;
        break;
      case 'penalty_incident':
        correctDecisions = ['penalty'];
        isMajorIncident = true;
        break;
      case 'diving':
        correctDecisions = ['no_foul', 'yellow_card'];
        isMajorIncident = true;
        break;
      case 'offside':
        correctDecisions = ['offside'];
        this.linesmen[1].flagTimer = 2.5;
        this.offsideLineMesh.position.set(frames[frames.length - 1].defenderLineZ, 0.04, 0);
        this.offsideLineMesh.visible = true;
        break;
      case 'incorrect_throw_in':
        correctDecisions = ['throw_in', 'no_foul'];
        break;
      case 'clean_tackle':
        correctDecisions = ['no_foul'];
        break;
    }

    const incident: ActiveIncident = {
      id: `inc_${Date.now()}`,
      type,
      minute: Math.max(1, minute),
      position: { x: ix, z: iz },
      offendingTeam: offender.team,
      offenderPlayerId: offender.id,
      offendingPlayerName: offender.name,
      offendingPlayerNumber: offender.number,
      victimPlayerId: victim.id,
      victimPlayerName: victim.name,
      victimPlayerNumber: victim.number,
      inPenaltyBox: inBox,
      correctDecisions,
      allowNoFoul: type === 'clean_tackle' || type === 'diving',
      allowAdvantage: type === 'normal_foul' && !inBox,
      isMajorIncident,
      difficulty: div.tightOffsideChance,
      resolved: false,
      varReviewed: false,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15000,
      replayFrames: frames,
    };

    this.activeIncident = incident;
    this.incidentMarkerMesh.position.set(ix, 0.035, iz);
    this.incidentMarkerMesh.visible = true;
    // Automatically orient referee view toward the incident so the tackle is never missed off-camera
    if (!this.isDraggingLook && this.role === 'main_referee') {
      this.focusOnIncident();
    }
    this.callbacks.onIncidentSpawn(incident);
  }

  private updateCamera(dt: number, elapsed: number) {
    if (this.mode === 'menu') {
      const ang = elapsed * 0.14;
      _v1.set(Math.cos(ang) * 28, 12.5, Math.sin(ang) * 24);
      _v2.set(0, 1.4, 0);
      this.camera.position.lerp(_v1, 1 - Math.exp(-3 * dt));
      this.camera.lookAt(_v2);
      return;
    }

    const replayTarget = this.replayIncident || this.activeIncident;
    if (this.mode === 'replay' && replayTarget) {
      const { x, z } = replayTarget.position;
      const zSign = z >= 0 ? -1 : 1;
      const xSign = x >= 0 ? -1 : 1;
      if (this.replayAngle === 'closeup') {
        _v1.set(x + xSign * 3.4, 2.15, z + zSign * 3.4);
        _v2.set(x, 0.78, z);
      } else if (this.replayAngle === 'offside') {
        _v1.set(x, 9.4, z + zSign * 9.8);
        _v2.set(x, 0.35, z);
      } else {
        _v1.set(x + xSign * 2.2, 5.2, z + zSign * 8.6);
        _v2.set(x, 0.85, z);
      }
      this.camPosCurrent.lerp(_v1, 1 - Math.exp(-7 * dt));
      this.camTargetCurrent.lerp(_v2, 1 - Math.exp(-9 * dt));
      this.camera.position.copy(this.camPosCurrent);
      this.camera.lookAt(this.camTargetCurrent);
      return;
    }

    // Frame penalty kick clearly so player sees their awarded penalty executed!
    if (this.setPiece?.type === 'penalty' && this.role === 'main_referee') {
      const sp = this.setPiece;
      _v1.set(sp.spot.x - sp.attackDir * 9.5, 4.6, 5.5);
      _v2.set(sp.attackDir * (PITCH_HALF_X - 2.0), 1.0, 0);
      this.camPosCurrent.lerp(_v1, 1 - Math.exp(-5 * dt));
      this.camTargetCurrent.lerp(_v2, 1 - Math.exp(-7 * dt));
      this.camera.position.copy(this.camPosCurrent);
      this.camera.lookAt(this.camTargetCurrent);
      return;
    }

    // Unobstructed incident inspection vantage while play is stopped awaiting call
    if (
      this.activeIncident &&
      !this.activeIncident.resolved &&
      this.mode === 'match' &&
      !this.setPiece &&
      this.role === 'main_referee'
    ) {
      const { x, z } = this.activeIncident.position;
      const distInc = Math.max(6.2, this.settings.gameplay.cameraDistance * 0.9);
      const sin = Math.sin(this.refYaw);
      const cos = Math.cos(this.refYaw);
      _v1.set(
        x + sin * distInc * Math.cos(this.refPitch),
        3.2 + distInc * Math.sin(this.refPitch),
        z + cos * distInc * Math.cos(this.refPitch)
      );
      _v2.set(x, 0.78, z);

      this.camPosCurrent.x = THREE.MathUtils.damp(this.camPosCurrent.x, _v1.x, 7, dt);
      this.camPosCurrent.y = THREE.MathUtils.damp(this.camPosCurrent.y, _v1.y, 7, dt);
      this.camPosCurrent.z = THREE.MathUtils.damp(this.camPosCurrent.z, _v1.z, 7, dt);

      this.camTargetCurrent.x = THREE.MathUtils.damp(this.camTargetCurrent.x, _v2.x, 9, dt);
      this.camTargetCurrent.y = THREE.MathUtils.damp(this.camTargetCurrent.y, _v2.y, 9, dt);
      this.camTargetCurrent.z = THREE.MathUtils.damp(this.camTargetCurrent.z, _v2.z, 9, dt);

      this.camera.position.copy(this.camPosCurrent);
      this.camera.lookAt(this.camTargetCurrent);
      return;
    }

    // Match camera per role
    const dist = this.settings.gameplay.cameraDistance;
    if (this.role === 'assistant_referee_1') {
      // North touchline linesman vantage looking across pitch width
      _v1.set(this.refPos.x, 4.2, -PITCH_HALF_Z - 5.5);
      _v2.set(this.refPos.x, 1.0, 0);
    } else if (this.role === 'assistant_referee_2') {
      // South touchline linesman vantage looking across pitch width
      _v1.set(this.refPos.x, 4.2, PITCH_HALF_Z + 5.5);
      _v2.set(this.refPos.x, 1.0, 0);
    } else if (this.role === 'var_referee') {
      // Elevated VAR tactical broadcast booth camera following ball or incident
      const focusX = this.activeIncident && !this.activeIncident.resolved ? this.activeIncident.position.x : this.ballPos.x * 0.55;
      const focusZ = this.activeIncident && !this.activeIncident.resolved ? this.activeIncident.position.z : this.ballPos.z * 0.35;
      _v1.set(focusX + Math.sin(this.refYaw) * 6, 15.5, focusZ + 22.0);
      _v2.set(focusX, 0.8, focusZ);
    } else {
      const sin = Math.sin(this.refYaw);
      const cos = Math.cos(this.refYaw);
      _v1.set(
        this.refPos.x + sin * dist * Math.cos(this.refPitch),
        1.8 + dist * Math.sin(this.refPitch),
        this.refPos.z + cos * dist * Math.cos(this.refPitch)
      );
      _v2.set(this.refPos.x, 1.35, this.refPos.z);
    }

    if (this.shakeAmount > 0 && !this.settings.accessibility.reducedCameraShake) {
      _v1.x += (Math.random() - 0.5) * this.shakeAmount;
      _v1.y += (Math.random() - 0.5) * this.shakeAmount;
      this.shakeAmount = Math.max(0, this.shakeAmount - dt * 0.9);
    }

    this.camPosCurrent.x = THREE.MathUtils.damp(this.camPosCurrent.x, _v1.x, 8, dt);
    this.camPosCurrent.y = THREE.MathUtils.damp(this.camPosCurrent.y, _v1.y, 8, dt);
    this.camPosCurrent.z = THREE.MathUtils.damp(this.camPosCurrent.z, _v1.z, 8, dt);

    this.camTargetCurrent.x = THREE.MathUtils.damp(this.camTargetCurrent.x, _v2.x, 10, dt);
    this.camTargetCurrent.y = THREE.MathUtils.damp(this.camTargetCurrent.y, _v2.y, 10, dt);
    this.camTargetCurrent.z = THREE.MathUtils.damp(this.camTargetCurrent.z, _v2.z, 10, dt);

    this.camera.position.copy(this.camPosCurrent);
    this.camera.lookAt(this.camTargetCurrent);
  }

  private updateCrowd(dt: number, elapsed: number) {
    if (this.crowdMoodTimer > 0) {
      this.crowdMoodTimer -= dt;
      if (this.crowdMoodTimer <= 0) this.crowdMood = 'calm';
    }

    const skip = this.settings.graphics.crowdDetail === 'low' ? 3 : this.settings.graphics.crowdDetail === 'medium' ? 2 : 1;
    const amp = this.crowdMood === 'cheer' ? 0.42 : this.crowdMood === 'boo' ? 0.18 : 0.05;
    const freq = this.crowdMood === 'cheer' ? 9 : this.crowdMood === 'boo' ? 14 : 2.5;

    for (let i = 0; i < this.crowdBasePositions.length; i += skip) {
      const b = this.crowdBasePositions[i];
      const bounce = Math.abs(Math.sin(elapsed * freq + b.phase)) * amp;
      _dummy.position.set(b.x, b.y + bounce, b.z);
      _dummy.rotation.set(0, b.rotY, this.crowdMood === 'boo' ? Math.sin(elapsed * 12 + b.phase) * 0.14 : 0);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      this.crowdMesh.setMatrixAt(i, _dummy.matrix);
    }
    this.crowdMesh.instanceMatrix.needsUpdate = true;
  }

  private applyReplayFrame(norm: number, dt: number) {
    const inc = this.replayIncident || this.activeIncident;
    if (!inc || inc.replayFrames.length === 0) return;

    const frames = inc.replayFrames;
    const exactIdx = THREE.MathUtils.clamp(norm, 0, 1) * Math.max(0, frames.length - 1);
    const i0 = Math.min(frames.length - 1, Math.floor(exactIdx));
    const i1 = Math.min(frames.length - 1, i0 + 1);
    const alpha = exactIdx - i0;

    const f0 = frames[i0];
    const f1 = frames[i1];

    this.ballMesh.position.set(
      THREE.MathUtils.lerp(f0.ball.x, f1.ball.x, alpha),
      Math.max(BALL_RADIUS, THREE.MathUtils.lerp(f0.ball.y, f1.ball.y, alpha)),
      THREE.MathUtils.lerp(f0.ball.z, f1.ball.z, alpha)
    );
    this.ballShadowMesh.position.set(this.ballMesh.position.x, 0.025, this.ballMesh.position.z);

    const offender = this.players.find(
      (p) =>
        (inc.offenderPlayerId && p.id === inc.offenderPlayerId) ||
        (p.team === inc.offendingTeam && p.number === inc.offendingPlayerNumber)
    );
    const victim = this.players.find(
      (p) =>
        (inc.victimPlayerId && p.id === inc.victimPlayerId) ||
        (p.team !== inc.offendingTeam && p.number === inc.victimPlayerNumber)
    );

    const stride = this.replayPaused ? 0 : Math.sin(norm * Math.PI * 6) * 0.48;
    const isSlideIncident =
      inc.type === 'dangerous_tackle' ||
      inc.type === 'penalty_incident' ||
      inc.type === 'clean_tackle' ||
      inc.type === 'normal_foul';
    if (offender) {
      offender.group.position.set(
        THREE.MathUtils.lerp(f0.offender.x, f1.offender.x, alpha),
        0,
        THREE.MathUtils.lerp(f0.offender.z, f1.offender.z, alpha)
      );
      offender.group.rotation.y = THREE.MathUtils.lerp(f0.offender.rot, f1.offender.rot, alpha);
      offender.leftLeg.rotation.set(stride, 0, 0);
      offender.rightLeg.rotation.set(-stride, 0, 0);
      offender.leftArm.rotation.set(-stride * 0.5, 0, 0);
      offender.rightArm.rotation.set(stride * 0.5, 0, inc.type === 'handball' ? -1.35 : 0);
      if (inc.type === 'violent_conduct' && norm > 0.35) {
        offender.rightArm.rotation.x = -1.85;
      }
      if (isSlideIncident && norm > 0.25) {
        const slideAmt = Math.min(1, (norm - 0.25) / 0.22);
        this.applySlidePose(offender, slideAmt);
      } else {
        offender.group.rotation.x = 0;
        offender.group.position.y = 0;
      }
      this.offenderRingMesh.position.set(offender.group.position.x, 0.038, offender.group.position.z);
      this.offenderRingMesh.visible = true;
    }

    if (victim) {
      victim.group.position.set(
        THREE.MathUtils.lerp(f0.victim.x, f1.victim.x, alpha),
        0,
        THREE.MathUtils.lerp(f0.victim.z, f1.victim.z, alpha)
      );
      victim.group.rotation.y = THREE.MathUtils.lerp(f0.victim.rot, f1.victim.rot, alpha);
      const fell =
        norm > 0.58 &&
        inc.type !== 'incorrect_throw_in' &&
        inc.type !== 'offside' &&
        inc.type !== 'handball' &&
        inc.type !== 'clean_tackle';
      if (inc.type === 'diving' && norm > 0.35) {
        victim.group.position.y = 0.2;
        victim.group.rotation.x = Math.PI * 0.48;
      } else if (fell) {
        victim.group.position.y = 0.2;
        victim.group.rotation.x = this.replayPaused
          ? -Math.PI / 2
          : THREE.MathUtils.damp(victim.group.rotation.x, -Math.PI / 2, 10, dt);
      } else {
        victim.group.position.y = 0;
        victim.group.rotation.x = 0;
      }
      victim.leftArm.rotation.x = inc.type === 'diving' && norm > 0.3 ? -Math.PI * 0.75 : 0;
      victim.rightArm.rotation.x = inc.type === 'diving' && norm > 0.3 ? -Math.PI * 0.75 : 0;
      victim.leftLeg.rotation.x = fell ? 0 : -stride;
      victim.rightLeg.rotation.x = fell ? 0 : stride;
      this.victimRingMesh.position.set(victim.group.position.x, 0.038, victim.group.position.z);
      this.victimRingMesh.visible = true;
    }
  }

  private updateReplayPlayback(dt: number) {
    const inc = this.replayIncident || this.activeIncident;
    if (!inc || inc.replayFrames.length === 0) return;

    if (!this.replayPaused) {
      this.replayTimer = (this.replayTimer + dt * this.replaySpeed) % this.replayLoopDuration;
      this.replayNorm = this.replayTimer / this.replayLoopDuration;
      this.replayProgressAccum += dt;
      if (this.replayProgressAccum >= 0.06) {
        this.replayProgressAccum = 0;
        this.callbacks.onReplayProgress?.(
          this.replayNorm,
          this.replayNorm * this.replayLoopDuration,
          this.replayLoopDuration
        );
      }
    }

    this.applyReplayFrame(this.replayNorm, dt);
  }

  private startLoop() {
    const tick = () => {
      if (this.disposed) return;
      const dt = Math.min(0.05, this.clock.getDelta());
      const elapsed = this.clock.elapsedTime;

      // Prevent active incident from silently timing out while paused or inspecting VAR/Replay
      if ((this.paused || this.mode === 'replay') && this.activeIncident && !this.activeIncident.resolved) {
        this.activeIncident.expiresAt += dt * 1000;
      }

      if (this.mode === 'replay' && !this.paused) {
        if ((window as any).__refInputPoll) {
          (window as any).__refInputPoll(this.settings.gameplay.cameraSensitivity);
        }
        this.updateReplayPlayback(dt);
      } else if (this.mode === 'match' && !this.paused) {
        const input = (window as any).__refInputPoll
          ? (window as any).__refInputPoll(this.settings.gameplay.cameraSensitivity)
          : { moveX: 0, moveY: 0, lookX: 0, lookY: 0, sprint: false, precision: false };

        this.updateRefereeControl(dt, input);
        if (this.role === 'main_referee') {
          this.updateFootballSimulation(dt);
          if (this.callbacks.onSyncBroadcast) {
            this.syncAccum += dt;
            if (this.syncAccum >= 0.08) {
              this.syncAccum = 0;
              this.callbacks.onSyncBroadcast({
                type: 'state_sync',
                minute: this.lastReportedMinute,
                homeScore: this.homeScore,
                awayScore: this.awayScore,
                ball: { x: this.ballPos.x, y: this.ballPos.y, z: this.ballPos.z },
                mainRef: { x: this.refPos.x, z: this.refPos.z, rot: this.refMoveYaw },
                players: this.players.map((p) => ({ x: p.pos.x, z: p.pos.z, rot: p.rotY })),
              });
            }
          }
        }
      } else if (this.mode === 'menu') {
        this.referee.leftArm.rotation.x = Math.sin(elapsed * 2) * 0.12;
        this.referee.rightArm.rotation.x = -Math.sin(elapsed * 2) * 0.12;
      }

      if (this.incidentMarkerMesh.visible) {
        const pulse = 1 + Math.sin(elapsed * 6) * 0.12;
        this.incidentMarkerMesh.scale.set(pulse, pulse, 1);
      }

      this.updateCrowd(dt, elapsed);
      this.updateCamera(dt, elapsed);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.frameId = requestAnimationFrame(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || !gl.fenceSync) {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.cleanupEvents();
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach((mat) => {
          if (!mat) return;
          const stdMat = mat as THREE.MeshStandardMaterial;
          stdMat.map?.dispose();
          mat.dispose();
        });
      }
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
