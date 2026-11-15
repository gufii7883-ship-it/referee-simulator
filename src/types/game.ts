export type DivisionId =
  | 'div4'
  | 'div3'
  | 'div2'
  | 'div1'
  | 'premier'
  | 'international'
  | 'champions'
  | 'worldcup'
  | 'worldcup_final';

export interface DivisionConfig {
  id: DivisionId;
  level: number; // 1..9
  nameKey: string;
  varChecksAllowed: number; // 1 for lvl 1-5, 0 for lvl 6+
  gameplaySpeed: number;
  crowdIntensity: number; // 0.3..1.0
  diveFrequency: number;
  tightOffsideChance: number;
  hostileCrowd: boolean;
  surroundRefOnControversy: boolean;
  trophyId?: TrophyId;
}

export const DIVISIONS: DivisionConfig[] = [
  {
    id: 'div4',
    level: 1,
    nameKey: 'div_div4',
    varChecksAllowed: 1,
    gameplaySpeed: 0.85,
    crowdIntensity: 0.35,
    diveFrequency: 0.04,
    tightOffsideChance: 0.15,
    hostileCrowd: false,
    surroundRefOnControversy: false,
    trophyId: 'trophy_div4',
  },
  {
    id: 'div3',
    level: 2,
    nameKey: 'div_div3',
    varChecksAllowed: 1,
    gameplaySpeed: 0.92,
    crowdIntensity: 0.45,
    diveFrequency: 0.08,
    tightOffsideChance: 0.25,
    hostileCrowd: false,
    surroundRefOnControversy: false,
    trophyId: 'trophy_div3',
  },
  {
    id: 'div2',
    level: 3,
    nameKey: 'div_div2',
    varChecksAllowed: 1,
    gameplaySpeed: 1.05,
    crowdIntensity: 0.58,
    diveFrequency: 0.18,
    tightOffsideChance: 0.45,
    hostileCrowd: false,
    surroundRefOnControversy: false,
    trophyId: 'trophy_div2',
  },
  {
    id: 'div1',
    level: 4,
    nameKey: 'div_div1',
    varChecksAllowed: 1,
    gameplaySpeed: 1.12,
    crowdIntensity: 0.68,
    diveFrequency: 0.22,
    tightOffsideChance: 0.55,
    hostileCrowd: false,
    surroundRefOnControversy: false,
    trophyId: 'trophy_div1',
  },
  {
    id: 'premier',
    level: 5,
    nameKey: 'div_premier',
    varChecksAllowed: 1,
    gameplaySpeed: 1.2,
    crowdIntensity: 0.78,
    diveFrequency: 0.25,
    tightOffsideChance: 0.65,
    hostileCrowd: false,
    surroundRefOnControversy: false,
    trophyId: 'trophy_premier',
  },
  {
    id: 'international',
    level: 6,
    nameKey: 'div_international',
    varChecksAllowed: 0,
    gameplaySpeed: 1.26,
    crowdIntensity: 0.85,
    diveFrequency: 0.28,
    tightOffsideChance: 0.72,
    hostileCrowd: true,
    surroundRefOnControversy: true,
  },
  {
    id: 'champions',
    level: 7,
    nameKey: 'div_champions',
    varChecksAllowed: 0,
    gameplaySpeed: 1.32,
    crowdIntensity: 0.92,
    diveFrequency: 0.3,
    tightOffsideChance: 0.78,
    hostileCrowd: true,
    surroundRefOnControversy: true,
    trophyId: 'trophy_champions',
  },
  {
    id: 'worldcup',
    level: 8,
    nameKey: 'div_worldcup',
    varChecksAllowed: 0,
    gameplaySpeed: 1.38,
    crowdIntensity: 0.97,
    diveFrequency: 0.32,
    tightOffsideChance: 0.84,
    hostileCrowd: true,
    surroundRefOnControversy: true,
    trophyId: 'trophy_worldcup',
  },
  {
    id: 'worldcup_final',
    level: 9,
    nameKey: 'div_worldcup_final',
    varChecksAllowed: 0,
    gameplaySpeed: 1.45,
    crowdIntensity: 1.0,
    diveFrequency: 0.35,
    tightOffsideChance: 0.9,
    hostileCrowd: true,
    surroundRefOnControversy: true,
    trophyId: 'trophy_worldcup_final',
  },
];

export type ReputationRankId =
  | 'beginner'
  | 'amateur'
  | 'professional'
  | 'elite'
  | 'international'
  | 'champions'
  | 'worldcup'
  | 'worldcup_final';

export interface ReputationRank {
  id: ReputationRankId;
  minRep: number;
  nameKey: string;
}

export const REPUTATION_LADDER: ReputationRank[] = [
  { id: 'beginner', minRep: 0, nameKey: 'rep_beginner' },
  { id: 'amateur', minRep: 20, nameKey: 'rep_amateur' },
  { id: 'professional', minRep: 35, nameKey: 'rep_professional' },
  { id: 'elite', minRep: 50, nameKey: 'rep_elite' },
  { id: 'international', minRep: 65, nameKey: 'rep_international' },
  { id: 'champions', minRep: 78, nameKey: 'rep_champions' },
  { id: 'worldcup', minRep: 88, nameKey: 'rep_worldcup' },
  { id: 'worldcup_final', minRep: 95, nameKey: 'rep_worldcup_final' },
];

export type TrophyId =
  | 'trophy_div4'
  | 'trophy_div3'
  | 'trophy_div2'
  | 'trophy_div1'
  | 'trophy_premier'
  | 'trophy_champions'
  | 'trophy_worldcup'
  | 'trophy_worldcup_final';

export interface TrophyDef {
  id: TrophyId;
  nameKey: string;
  descKey: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export const TROPHIES: TrophyDef[] = [
  { id: 'trophy_div4', nameKey: 'trophy_div4_name', descKey: 'trophy_div4_desc', tier: 'bronze' },
  { id: 'trophy_div3', nameKey: 'trophy_div3_name', descKey: 'trophy_div3_desc', tier: 'bronze' },
  { id: 'trophy_div2', nameKey: 'trophy_div2_name', descKey: 'trophy_div2_desc', tier: 'silver' },
  { id: 'trophy_div1', nameKey: 'trophy_div1_name', descKey: 'trophy_div1_desc', tier: 'silver' },
  { id: 'trophy_premier', nameKey: 'trophy_premier_name', descKey: 'trophy_premier_desc', tier: 'gold' },
  { id: 'trophy_champions', nameKey: 'trophy_champions_name', descKey: 'trophy_champions_desc', tier: 'gold' },
  { id: 'trophy_worldcup', nameKey: 'trophy_worldcup_name', descKey: 'trophy_worldcup_desc', tier: 'platinum' },
  { id: 'trophy_worldcup_final', nameKey: 'trophy_worldcup_final_name', descKey: 'trophy_worldcup_final_desc', tier: 'platinum' },
];

export type RegionId = 'africa' | 'asia' | 'arab' | 'europe' | 'americas' | 'australia';

export interface RegionLeague {
  id: string;
  region: RegionId;
  countryKey: string;
  leagueName: string;
}

export type IncidentType =
  | 'normal_foul'
  | 'dangerous_tackle'
  | 'handball'
  | 'penalty_incident'
  | 'diving'
  | 'offside'
  | 'violent_conduct'
  | 'incorrect_throw_in'
  | 'clean_tackle';

export type DecisionAction =
  | 'foul'
  | 'yellow_card'
  | 'red_card'
  | 'penalty'
  | 'offside'
  | 'throw_in'
  | 'handball'
  | 'no_foul'
  | 'advantage';

export interface ActiveIncident {
  id: string;
  type: IncidentType;
  minute: number;
  position: { x: number; z: number };
  offendingTeam: 'home' | 'away';
  offenderPlayerId?: string;
  offendingPlayerName: string;
  offendingPlayerNumber: number;
  victimPlayerId?: string;
  victimPlayerName: string;
  victimPlayerNumber: number;
  inPenaltyBox: boolean;
  /** Expected primary correct decision(s) */
  correctDecisions: DecisionAction[];
  /** Whether ignoring / No Foul is valid (e.g. diving or clean tackle) */
  allowNoFoul: boolean;
  /** Whether advantage play is valid */
  allowAdvantage: boolean;
  /** Severity for major-error tracking */
  isMajorIncident: boolean;
  /** Tightness (0..1) for offsides/penalties */
  difficulty: number;
  /** Resolved state */
  resolved: boolean;
  varReviewed: boolean;
  createdAt: number;
  expiresAt: number;
  /** Snapshot for 3D slow-motion replay */
  replayFrames: Array<{
    ball: { x: number; y: number; z: number };
    offender: { x: number; z: number; rot: number };
    victim: { x: number; z: number; rot: number };
    defenderLineZ: number;
  }>;
}

export interface DecisionRecord {
  id: string;
  minute: number;
  incidentType: IncidentType;
  playerCalled: DecisionAction | 'ignored_dive' | 'var_overturn';
  expected: string;
  correct: boolean;
  pointsDelta: number;
  isMajorError: boolean;
  usedVar: boolean;
  playerName: string;
}

export interface MatchSummary {
  matchId: string;
  divisionId: DivisionId;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  leagueName: string;
  decisions: DecisionRecord[];
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  decisionPoints: number;
  performanceBonus: number;
  zeroMajorErrorBonus: number;
  totalPoints: number;
  rating: number;
  ratingLabelKey: string;
  reputationDelta: number;
  newReputation: number;
  bribeOffered: boolean;
  bribeAccepted: boolean;
  bribeFavoredTeam?: 'home' | 'away';
  investigationTriggered: boolean;
  varChecksUsed: number;
  yellowCards: number;
  redCards: number;
  penaltiesAwarded: number;
  offsidesCalled: number;
  timestamp: number;
}

export interface DivisionResult {
  divisionId: DivisionId;
  matchesPlayed: number;
  totalPoints: number;
  averageRating: number;
  verdict: 'promoted' | 'stayed' | 'relegated' | 'world_champion' | 'game_over';
  nextDivisionId: DivisionId | null;
  unlockedTrophyId?: TrophyId;
}

export interface CareerStats {
  totalMatches: number;
  correctDecisions: number;
  incorrectDecisions: number;
  yellowCards: number;
  redCards: number;
  penaltiesAwarded: number;
  offsideDecisions: number;
  varChecks: number;
  bribesAccepted: number;
  careerEarnings: number;
  highestRating: number;
}

export interface PromotionHistoryEntry {
  fromDivision: DivisionId;
  toDivision: DivisionId | 'game_over' | 'champion';
  verdict: 'promoted' | 'stayed' | 'relegated' | 'investigated';
  points: number;
  avgRating: number;
  timestamp: number;
}

export interface CareerState {
  active: boolean;
  gameOver: boolean;
  gameOverReasonKey?: string;
  worldChampion: boolean;
  currentDivisionIndex: number; // 0..8
  divisionMatchesPlayed: number; // 0..10
  divisionPoints: number;
  divisionRatings: number[];
  reputation: number; // 0..100, starts at 50
  balance: number; // $
  unlockedTrophies: TrophyId[];
  stats: CareerStats;
  matchHistory: MatchSummary[];
  promotionHistory: PromotionHistoryEntry[];
  investigationsFreeStreak: number;
}

export type LanguageCode =
  | 'en'
  | 'ar'
  | 'fr'
  | 'es'
  | 'de'
  | 'pt'
  | 'it'
  | 'ja'
  | 'ko'
  | 'tr'
  | 'nl'
  | 'zh';

export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';
export type DifficultyOption = 'easy' | 'normal' | 'hard' | 'realistic';

export interface GameSettings {
  language: LanguageCode;
  graphics: {
    resolutionScale: number; // 0.5..1.0
    fullscreen: boolean;
    quality: GraphicsQuality;
    shadowQuality: 'off' | 'low' | 'high';
    textureQuality: 'low' | 'high';
    antiAliasing: boolean;
    vsync: boolean;
    fpsLimit: 30 | 60 | 90 | 120 | 0; // 0 = unlimited
    crowdDetail: 'low' | 'medium' | 'high';
    motionBlur: boolean;
  };
  audio: {
    master: number;
    crowd: number;
    whistle: number;
    music: number;
    commentary: number;
    sfx: number;
    muteAll: boolean;
    musicEnabled: boolean;
    crowdEnabled: boolean;
  };
  gameplay: {
    difficulty: DifficultyOption;
    matchLengthSeconds: 90 | 150 | 240; // quick 1.5m, standard 2.5m, extended 4m
    cameraDistance: number; // 6..16
    cameraSensitivity: number; // 0.3..2.5
    autoReplay: boolean;
    varAssistance: boolean;
    tutorial: boolean;
    showDecisionHints: boolean;
    subtitles: boolean;
  };
  controls: {
    activeProfile: 'keyboard' | 'playstation' | 'mobile';
    controllerVibration: boolean;
    joystickSensitivity: number;
    deadzone: number;
    mobileButtonScale: number; // 0.8..1.4
    keybindings: {
      foul: string;
      yellowCard: string;
      redCard: string;
      penalty: string;
      offside: string;
      noFoul: string;
      varCheck: string;
      replay: string;
      bribe: string;
    };
  };
  accessibility: {
    subtitleSize: 'small' | 'medium' | 'large';
    uiScale: number; // 0.85..1.2
    colorblindMode: boolean;
    highContrast: boolean;
    reducedCameraShake: boolean;
    reducedMotion: boolean;
  };
  playerName: string;
}

export type InputPromptDevice = 'keyboard' | 'playstation' | 'mobile';

export type FriendModeVariant = '2_refs' | '3_refs' | '4_refs';

export type MultiplayerRole =
  | 'main_referee'
  | 'assistant_referee_1'
  | 'assistant_referee_2'
  | 'var_referee';

export interface RoomParticipant {
  id: string;
  name: string;
  role: MultiplayerRole;
  connected: boolean;
  micMuted: boolean;
}

export interface MultiplayerRoomState {
  roomCode: string;
  mode: FriendModeVariant;
  maxParticipants: number;
  status: 'waiting' | 'playing' | 'finished';
  participants: RoomParticipant[];
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
}

export const RATING_BANDS = [
  { min: 90, key: 'rating_outstanding' },
  { min: 80, key: 'rating_excellent' },
  { min: 70, key: 'rating_good' },
  { min: 60, key: 'rating_average' },
  { min: 40, key: 'rating_poor' },
  { min: 0, key: 'rating_terrible' },
];

export function getRatingBandKey(rating: number): string {
  for (const band of RATING_BANDS) {
    if (rating >= band.min) return band.key;
  }
  return 'rating_terrible';
}

export function getReputationRank(rep: number): ReputationRank {
  let rank = REPUTATION_LADDER[0];
  for (const r of REPUTATION_LADDER) {
    if (rep >= r.minRep) rank = r;
  }
  return rank;
}
