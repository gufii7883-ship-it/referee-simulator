import {
  ActiveIncident,
  CareerState,
  DIVISIONS,
  DecisionAction,
  DecisionRecord,
  DivisionResult,
  GameSettings,
  MatchSummary,
  getRatingBandKey,
} from '../types/game';

const CAREER_STORAGE_KEY = 'refsim_career_v1';
const SETTINGS_STORAGE_KEY = 'refsim_settings_v1';

export function createDefaultSettings(): GameSettings {
  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 768;

  return {
    language: 'en',
    graphics: {
      resolutionScale: isMobileScreen ? 0.8 : 1.0,
      fullscreen: false,
      quality: isMobileScreen ? 'medium' : 'high',
      shadowQuality: isMobileScreen ? 'low' : 'high',
      textureQuality: 'high',
      antiAliasing: !isMobileScreen,
      vsync: true,
      fpsLimit: 60,
      crowdDetail: isMobileScreen ? 'medium' : 'high',
      motionBlur: false,
    },
    audio: {
      master: 0.85,
      crowd: 0.75,
      whistle: 0.9,
      music: 0.4,
      commentary: 0.8,
      sfx: 0.85,
      muteAll: false,
      musicEnabled: true,
      crowdEnabled: true,
    },
    gameplay: {
      difficulty: 'normal',
      matchLengthSeconds: 150,
      cameraDistance: 10,
      cameraSensitivity: 1.0,
      autoReplay: false,
      varAssistance: true,
      tutorial: true,
      showDecisionHints: true,
      subtitles: true,
    },
    controls: {
      activeProfile: isTouch && isMobileScreen ? 'mobile' : 'keyboard',
      controllerVibration: true,
      joystickSensitivity: 1.0,
      deadzone: 0.16,
      mobileButtonScale: 1.0,
      keybindings: {
        foul: 'KeyF',
        yellowCard: 'KeyY',
        redCard: 'KeyR',
        penalty: 'KeyP',
        offside: 'KeyO',
        noFoul: 'KeyN',
        varCheck: 'KeyV',
        replay: 'KeyT',
        bribe: 'KeyB',
      },
    },
    accessibility: {
      subtitleSize: 'medium',
      uiScale: 1.0,
      colorblindMode: false,
      highContrast: false,
      reducedCameraShake: false,
      reducedMotion: false,
    },
    playerName: 'Alex Mercer',
  };
}

export function loadSettings(): GameSettings {
  const defaults = createDefaultSettings();
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      ...defaults,
      ...parsed,
      graphics: { ...defaults.graphics, ...parsed.graphics },
      audio: { ...defaults.audio, ...parsed.audio },
      gameplay: { ...defaults.gameplay, ...parsed.gameplay },
      controls: {
        ...defaults.controls,
        ...parsed.controls,
        keybindings: { ...defaults.controls.keybindings, ...(parsed.controls?.keybindings || {}) },
      },
      accessibility: { ...defaults.accessibility, ...parsed.accessibility },
    };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: GameSettings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore quota errors
  }
}

export function createInitialCareer(): CareerState {
  return {
    active: true,
    gameOver: false,
    worldChampion: false,
    currentDivisionIndex: 0, // Division 4
    divisionMatchesPlayed: 0,
    divisionPoints: 0,
    divisionRatings: [],
    reputation: 50,
    balance: 1500,
    unlockedTrophies: [],
    stats: {
      totalMatches: 0,
      correctDecisions: 0,
      incorrectDecisions: 0,
      yellowCards: 0,
      redCards: 0,
      penaltiesAwarded: 0,
      offsideDecisions: 0,
      varChecks: 0,
      bribesAccepted: 0,
      careerEarnings: 1500,
      highestRating: 0,
    },
    matchHistory: [],
    promotionHistory: [],
    investigationsFreeStreak: 0,
  };
}

export function loadCareer(): CareerState {
  try {
    const raw = localStorage.getItem(CAREER_STORAGE_KEY);
    if (!raw) return createInitialCareer();
    return { ...createInitialCareer(), ...JSON.parse(raw) };
  } catch {
    return createInitialCareer();
  }
}

export function saveCareer(career: CareerState) {
  try {
    localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(career));
  } catch {
    // Ignore quota errors
  }
}

export function evaluateIncidentDecision(
  incident: ActiveIncident,
  action: DecisionAction,
  usedVar: boolean
): DecisionRecord {
  const expected = incident.correctDecisions[0];
  let correct = incident.correctDecisions.includes(action);
  let pointsDelta = 0;
  let playerCalled: DecisionRecord['playerCalled'] = action;

  // Special Dive rules
  if (incident.type === 'diving') {
    if (action === 'no_foul') {
      correct = true;
      pointsDelta = 15;
      playerCalled = 'ignored_dive';
    } else if (action === 'yellow_card') {
      // Booking a diver for simulation is also great!
      correct = true;
      pointsDelta = 15;
    } else {
      correct = false;
      pointsDelta = -20;
    }
  } else if (action === 'advantage') {
    if (incident.allowAdvantage) {
      correct = true;
      pointsDelta = 10;
    } else {
      correct = false;
      pointsDelta = -10;
    }
  } else if (usedVar && correct) {
    pointsDelta = 20;
    playerCalled = 'var_overturn';
  } else if (usedVar && !correct) {
    pointsDelta = -25;
  } else {
    // Standard decision matrix
    switch (action) {
      case 'foul':
        pointsDelta = correct ? 10 : -10;
        break;
      case 'yellow_card':
        pointsDelta = correct ? 15 : -15;
        break;
      case 'red_card':
        pointsDelta = correct ? 20 : -25;
        break;
      case 'penalty':
        pointsDelta = correct ? 25 : -30;
        break;
      case 'offside':
        pointsDelta = correct ? 15 : -20;
        break;
      case 'throw_in':
        pointsDelta = correct ? 5 : -5;
        break;
      case 'handball':
        pointsDelta = correct ? 15 : -20;
        break;
      case 'no_foul':
        pointsDelta = correct ? 10 : -10;
        break;
    }
  }

  const isMajorError = !correct && (incident.isMajorIncident || action === 'red_card' || action === 'penalty');

  return {
    id: incident.id,
    minute: incident.minute,
    incidentType: incident.type,
    playerCalled,
    expected,
    correct,
    pointsDelta,
    isMajorError,
    usedVar,
    playerName: incident.offendingPlayerName,
  };
}

export function buildMatchSummary(params: {
  divisionIndex: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  leagueName: string;
  decisions: DecisionRecord[];
  positioningScore: number; // 0..100
  matchControlScore: number; // 0..100
  crowdPressureScore: number; // 0..100
  currentReputation: number;
  bribeOffered: boolean;
  bribeAccepted: boolean;
  bribeFavoredTeam?: 'home' | 'away';
  varChecksUsed: number;
}): MatchSummary {
  const { decisions } = params;
  const total = decisions.length;
  const correctCount = decisions.filter((d) => d.correct).length;
  const incorrectCount = total - correctCount;
  const accuracy = total === 0 ? 100 : Math.round((correctCount / total) * 100);

  const decisionPoints = decisions.reduce((acc, d) => acc + d.pointsDelta, 0);

  let performanceBonus = 0;
  if (accuracy >= 95) performanceBonus = 50;
  else if (accuracy >= 85) performanceBonus = 35;
  else if (accuracy >= 75) performanceBonus = 20;
  else if (accuracy >= 60) performanceBonus = 5;
  else performanceBonus = -30;

  const majorErrors = decisions.filter((d) => d.isMajorError).length;
  const zeroMajorErrorBonus = total > 0 && majorErrors === 0 ? 20 : 0;

  const totalPoints = decisionPoints + performanceBonus + zeroMajorErrorBonus;

  // Disciplinary component
  const discDecisions = decisions.filter(
    (d) =>
      d.incidentType === 'dangerous_tackle' ||
      d.incidentType === 'violent_conduct' ||
      d.playerCalled === 'yellow_card' ||
      d.playerCalled === 'red_card'
  );
  const discAcc =
    discDecisions.length === 0
      ? accuracy
      : (discDecisions.filter((d) => d.correct).length / discDecisions.length) * 100;

  const rawRating =
    accuracy * 0.5 +
    discAcc * 0.2 +
    params.positioningScore * 0.1 +
    params.matchControlScore * 0.1 +
    params.crowdPressureScore * 0.1;

  const rating = Math.max(0, Math.min(100, Math.round(rawRating)));
  const ratingLabelKey = getRatingBandKey(rating);

  const errorRate = total === 0 ? 0 : (incorrectCount / total) * 100;
  const investigationTriggered = params.bribeAccepted && errorRate > 30;

  let reputationDelta = 0;
  if (rating >= 80) reputationDelta = 5;
  else if (rating >= 70) reputationDelta = 3;
  else if (rating >= 60) reputationDelta = 1;
  else if (rating >= 40) reputationDelta = -5;
  else reputationDelta = -10;

  let newReputation = Math.max(0, Math.min(100, params.currentReputation + reputationDelta));
  if (investigationTriggered) {
    newReputation = Math.max(0, Math.round(newReputation * 0.5));
    reputationDelta = newReputation - params.currentReputation;
  }

  return {
    matchId: `m_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    divisionId: DIVISIONS[params.divisionIndex].id,
    homeTeam: params.homeTeam,
    awayTeam: params.awayTeam,
    homeScore: params.homeScore,
    awayScore: params.awayScore,
    leagueName: params.leagueName,
    decisions,
    correctCount,
    incorrectCount,
    accuracy,
    decisionPoints,
    performanceBonus,
    zeroMajorErrorBonus,
    totalPoints,
    rating,
    ratingLabelKey,
    reputationDelta,
    newReputation,
    bribeOffered: params.bribeOffered,
    bribeAccepted: params.bribeAccepted,
    bribeFavoredTeam: params.bribeFavoredTeam,
    investigationTriggered,
    varChecksUsed: params.varChecksUsed,
    yellowCards: decisions.filter((d) => d.playerCalled === 'yellow_card').length,
    redCards: decisions.filter((d) => d.playerCalled === 'red_card').length,
    penaltiesAwarded: decisions.filter((d) => d.playerCalled === 'penalty').length,
    offsidesCalled: decisions.filter((d) => d.playerCalled === 'offside').length,
    timestamp: Date.now(),
  };
}

export function applyMatchToCareer(
  career: CareerState,
  summary: MatchSummary
): { updatedCareer: CareerState; divisionResult: DivisionResult | null } {
  const next = structuredClone(career) as CareerState;
  const currentDiv = DIVISIONS[next.currentDivisionIndex];

  // Update career cumulative stats
  next.stats.totalMatches += 1;
  next.stats.correctDecisions += summary.correctCount;
  next.stats.incorrectDecisions += summary.incorrectCount;
  next.stats.yellowCards += summary.yellowCards;
  next.stats.redCards += summary.redCards;
  next.stats.penaltiesAwarded += summary.penaltiesAwarded;
  next.stats.offsideDecisions += summary.offsidesCalled;
  next.stats.varChecks += summary.varChecksUsed;
  if (summary.bribeAccepted) next.stats.bribesAccepted += 1;
  if (summary.rating > next.stats.highestRating) next.stats.highestRating = summary.rating;

  // Match fee earned per division level
  const matchFee = 400 + currentDiv.level * 350;
  next.balance += matchFee;
  next.stats.careerEarnings += matchFee;

  next.reputation = summary.newReputation;
  next.matchHistory = [summary, ...next.matchHistory].slice(0, 50);

  // If investigation triggered -> immediate relegation & -50% reputation already applied
  if (summary.investigationTriggered) {
    next.investigationsFreeStreak = 0;
    const prevIdx = next.currentDivisionIndex;
    if (prevIdx <= 0) {
      // Relegated below Division 4 -> Game Over
      next.gameOver = true;
      next.active = false;
      next.gameOverReasonKey = 'go_reason_bribe';
      next.promotionHistory.unshift({
        fromDivision: currentDiv.id,
        toDivision: 'game_over',
        verdict: 'investigated',
        points: next.divisionPoints + summary.totalPoints,
        avgRating: summary.rating,
        timestamp: Date.now(),
      });
      return {
        updatedCareer: next,
        divisionResult: {
          divisionId: currentDiv.id,
          matchesPlayed: next.divisionMatchesPlayed + 1,
          totalPoints: next.divisionPoints + summary.totalPoints,
          averageRating: summary.rating,
          verdict: 'game_over',
          nextDivisionId: null,
        },
      };
    } else {
      next.currentDivisionIndex = prevIdx - 1;
      next.divisionMatchesPlayed = 0;
      next.divisionPoints = 0;
      next.divisionRatings = [];
      const nextDiv = DIVISIONS[next.currentDivisionIndex];
      next.promotionHistory.unshift({
        fromDivision: currentDiv.id,
        toDivision: nextDiv.id,
        verdict: 'investigated',
        points: summary.totalPoints,
        avgRating: summary.rating,
        timestamp: Date.now(),
      });
      return {
        updatedCareer: next,
        divisionResult: {
          divisionId: currentDiv.id,
          matchesPlayed: 1,
          totalPoints: summary.totalPoints,
          averageRating: summary.rating,
          verdict: 'relegated',
          nextDivisionId: nextDiv.id,
        },
      };
    }
  }

  next.investigationsFreeStreak += 1;
  if (next.investigationsFreeStreak > 0 && next.investigationsFreeStreak % 10 === 0) {
    next.reputation = Math.min(100, next.reputation + 5);
  }

  next.divisionMatchesPlayed += 1;
  next.divisionPoints += summary.totalPoints;
  next.divisionRatings.push(summary.rating);

  // Check if 10 matches completed in current division
  if (next.divisionMatchesPlayed < 10) {
    return { updatedCareer: next, divisionResult: null };
  }

  // Evaluate 10-match division performance
  const totalPts = next.divisionPoints;
  const avgRating = Math.round(
    next.divisionRatings.reduce((a, b) => a + b, 0) / Math.max(1, next.divisionRatings.length)
  );

  // Promotion rules:
  // 800+ points & 85+ avg rating -> Promotion
  // 650-799 points & 75+ avg rating -> Promotion
  // 500-649 points (or points >= 650 without meeting rating) -> Stay
  // < 500 points -> Relegation
  let verdict: DivisionResult['verdict'] = 'stayed';
  if ((totalPts >= 800 && avgRating >= 85) || (totalPts >= 650 && avgRating >= 75)) {
    verdict = 'promoted';
  } else if (totalPts < 500) {
    verdict = 'relegated';
  } else {
    verdict = 'stayed';
  }

  let unlockedTrophyId = undefined;
  let nextDivisionId: DivisionResult['nextDivisionId'] = currentDiv.id;

  if (verdict === 'promoted') {
    if (currentDiv.trophyId && !next.unlockedTrophies.includes(currentDiv.trophyId)) {
      next.unlockedTrophies.push(currentDiv.trophyId);
      unlockedTrophyId = currentDiv.trophyId;
    }

    if (next.currentDivisionIndex >= DIVISIONS.length - 1) {
      // Completed World Cup Final!
      verdict = 'world_champion';
      next.worldChampion = true;
      nextDivisionId = null;
      next.promotionHistory.unshift({
        fromDivision: currentDiv.id,
        toDivision: 'champion',
        verdict: 'promoted',
        points: totalPts,
        avgRating,
        timestamp: Date.now(),
      });
    } else {
      next.currentDivisionIndex += 1;
      nextDivisionId = DIVISIONS[next.currentDivisionIndex].id;
      next.promotionHistory.unshift({
        fromDivision: currentDiv.id,
        toDivision: nextDivisionId,
        verdict: 'promoted',
        points: totalPts,
        avgRating,
        timestamp: Date.now(),
      });
    }
  } else if (verdict === 'relegated') {
    if (next.currentDivisionIndex <= 0) {
      verdict = 'game_over';
      next.gameOver = true;
      next.active = false;
      next.gameOverReasonKey = 'go_reason_div4';
      nextDivisionId = null;
      next.promotionHistory.unshift({
        fromDivision: currentDiv.id,
        toDivision: 'game_over',
        verdict: 'relegated',
        points: totalPts,
        avgRating,
        timestamp: Date.now(),
      });
    } else {
      next.currentDivisionIndex -= 1;
      nextDivisionId = DIVISIONS[next.currentDivisionIndex].id;
      next.promotionHistory.unshift({
        fromDivision: currentDiv.id,
        toDivision: nextDivisionId,
        verdict: 'relegated',
        points: totalPts,
        avgRating,
        timestamp: Date.now(),
      });
    }
  } else {
    next.promotionHistory.unshift({
      fromDivision: currentDiv.id,
      toDivision: currentDiv.id,
      verdict: 'stayed',
      points: totalPts,
      avgRating,
      timestamp: Date.now(),
    });
  }

  // Reset 10-match division counter
  next.divisionMatchesPlayed = 0;
  next.divisionPoints = 0;
  next.divisionRatings = [];

  return {
    updatedCareer: next,
    divisionResult: {
      divisionId: currentDiv.id,
      matchesPlayed: 10,
      totalPoints: totalPts,
      averageRating: avgRating,
      verdict,
      nextDivisionId,
      unlockedTrophyId,
    },
  };
}
