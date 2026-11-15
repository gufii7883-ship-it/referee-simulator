import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActiveIncident,
  CareerState,
  DIVISIONS,
  DecisionAction,
  DecisionRecord,
  DivisionResult,
  GameSettings,
  InputPromptDevice,
  MatchSummary,
  MultiplayerRole,
  RegionId,
  getReputationRank,
} from './types/game';
import {
  applyMatchToCareer,
  buildMatchSummary,
  createInitialCareer,
  evaluateIncidentDecision,
  loadCareer,
  loadSettings,
  saveCareer,
  saveSettings,
} from './game/CareerEngine';
import { GeneratedMatchFixture, generateFixtureForDivision } from './data/leagues';
import { isRtlLanguage, translate } from './i18n/translations';
import { soundEngine } from './audio/SoundEngine';
import { UnifiedAction, inputManager } from './input/InputManager';
import { useControllerMenuNav } from './input/useControllerMenuNav';
import { StadiumScene } from './three/StadiumScene';
import { MatchHUD } from './components/MatchHUD';
import { SettingsModal } from './components/SettingsModal';
import {
  CareerHubModal,
  CareerStatsModal,
  DivisionResultsModal,
  GameOverModal,
  InvestigationModal,
  MatchResultsModal,
  TrophyCabinetModal,
} from './components/CareerModals';
import { FriendModeModal } from './components/FriendModeModal';
import {
  BarChart3,
  Globe,
  LogOut,
  Play,
  Settings,
  ShieldAlert,
  Trophy,
  Users,
} from 'lucide-react';

type ScreenOverlay =
  | 'menu'
  | 'career_hub'
  | 'stats'
  | 'trophies'
  | 'settings'
  | 'friend_lobby'
  | 'bribe_offer'
  | 'playing'
  | 'match_results'
  | 'investigation'
  | 'division_results'
  | 'game_over';

export default function App() {
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [career, setCareer] = useState<CareerState>(() => loadCareer());
  const [screen, setScreen] = useState<ScreenOverlay>('menu');
  const [selectedRegion, setSelectedRegion] = useState<RegionId | 'all'>('all');
  const [inputDevice, setInputDevice] = useState<InputPromptDevice>(inputManager.activeDevice);
  const [exitBanner, setExitBanner] = useState(false);

  // Active Match State
  const [fixture, setFixture] = useState<GeneratedMatchFixture | null>(null);
  const [minute, setMinute] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [stamina, setStamina] = useState(100);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [activeIncident, setActiveIncident] = useState<ActiveIncident | null>(null);
  const [lastIncident, setLastIncident] = useState<ActiveIncident | null>(null);
  const [replayTargetIncident, setReplayTargetIncident] = useState<ActiveIncident | null>(null);
  const [replayPurpose, setReplayPurpose] = useState<'var' | 'replay'>('replay');
  const [selectedPlayer, setSelectedPlayer] = useState<{
    team: 'home' | 'away';
    number: number;
    name: string;
    cardState: string;
  } | null>(null);
  const [varChecksLeft, setVarChecksLeft] = useState(1);
  const [bribeOffered, setBribeOffered] = useState(false);
  const [bribeAccepted, setBribeAccepted] = useState(false);
  const [bribeTeam, setBribeTeam] = useState<'home' | 'away'>('home');
  const [lastFeedback, setLastFeedback] = useState<{ text: string; positive: boolean } | null>(null);
  const [commentaryText, setCommentaryText] = useState('');
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [replayPaused, setReplayPaused] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(0.5);
  const [replayAngle, setReplayAngle] = useState<'side' | 'closeup' | 'offside'>('side');
  const [replayProgress, setReplayProgress] = useState(0);
  const [replayTimeSec, setReplayTimeSec] = useState(0);
  const [replayDurationSec, setReplayDurationSec] = useState(2.0);
  const [isPaused, setIsPaused] = useState(false);
  const [surroundAlert, setSurroundAlert] = useState(false);
  const [setPieceBanner, setSetPieceBanner] = useState<string | null>(null);
  const [showLiveStats, setShowLiveStats] = useState(false);

  // Post-match summaries
  const [lastMatchSummary, setLastMatchSummary] = useState<MatchSummary | null>(null);
  const [lastDivisionResult, setLastDivisionResult] = useState<DivisionResult | null>(null);

  // Multiplayer State
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [mpRole, setMpRole] = useState<MultiplayerRole | null>(null);
  const [mpRoomCode, setMpRoomCode] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [micMuted, setMicMuted] = useState(true);

  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const stadiumRef = useRef<StadiumScene | null>(null);

  // Mutable refs for callbacks inside Three.js loop
  const stateRef = useRef({
    screen,
    settings,
    career,
    fixture,
    decisions,
    activeIncident,
    lastIncident,
    replayTargetIncident,
    replayPurpose,
    selectedPlayer,
    homeScore,
    awayScore,
    varChecksLeft,
    bribeOffered,
    bribeAccepted,
    bribeTeam,
    isReplayMode,
    isPaused,
    isMultiplayer,
    mpRole,
    matchFinished: false,
  });
  stateRef.current = {
    screen,
    settings,
    career,
    fixture,
    decisions,
    activeIncident,
    lastIncident,
    replayTargetIncident,
    replayPurpose,
    selectedPlayer,
    homeScore,
    awayScore,
    varChecksLeft,
    bribeOffered,
    bribeAccepted,
    bribeTeam,
    isReplayMode,
    isPaused,
    isMultiplayer,
    mpRole,
    matchFinished: stateRef.current.matchFinished,
  };

  const lang = settings.language;
  const t = useCallback((k: string, vars?: Record<string, string | number>) => translate(lang, k, vars), [lang]);

  // Apply RTL/LTR & Language on <html>
  useEffect(() => {
    document.documentElement.dir = isRtlLanguage(settings.language) ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
    soundEngine.updateSettings(settings.audio);
    inputManager.updateSettings(settings.controls);
    stadiumRef.current?.updateSettings(settings);
    saveSettings(settings);
  }, [settings]);

  // Persist career
  useEffect(() => {
    saveCareer(career);
  }, [career]);

  const menuNavEnabled = screen !== 'playing' || isPaused || exitBanner;

  useEffect(() => {
    inputManager.setMenuMode(menuNavEnabled);
  }, [menuNavEnabled]);

  useControllerMenuNav({
    enabled: menuNavEnabled,
    scopeKey: `${screen}-${isPaused}-${exitBanner}`,
    onCancel: () => {
      if (exitBanner) {
        setExitBanner(false);
      } else if (screen === 'bribe_offer') {
        setBribeAccepted(false);
        if (fixture) {
          launchStadiumMatch(fixture, DIVISIONS[career.currentDivisionIndex], 'main_referee');
        }
      } else if (screen === 'playing' && isPaused) {
        setIsPaused(false);
        if (stadiumRef.current) stadiumRef.current.paused = false;
      } else if (
        screen === 'career_hub' ||
        screen === 'stats' ||
        screen === 'trophies' ||
        screen === 'settings' ||
        screen === 'friend_lobby'
      ) {
        setScreen('menu');
      }
    },
  });

  const showFeedbackToast = useCallback((text: string, positive: boolean) => {
    setLastFeedback({ text, positive });
    setTimeout(() => {
      setLastFeedback((curr) => (curr?.text === text ? null : curr));
    }, 2400);
  }, []);

  const finishMatch = useCallback(() => {
    if (stateRef.current.matchFinished) return;
    stateRef.current.matchFinished = true;

    const st = stateRef.current;
    if (!st.fixture) return;
    soundEngine.whistle('fulltime');
    inputManager.vibrate(320, 0.8, 0.5);

    const divIdx = st.isMultiplayer ? 4 : st.career.currentDivisionIndex;
    const div = DIVISIONS[divIdx];
    const usedVar = div.varChecksAllowed - st.varChecksLeft;

    const summary = buildMatchSummary({
      divisionIndex: divIdx,
      homeTeam: st.fixture.home.name,
      awayTeam: st.fixture.away.name,
      homeScore: st.homeScore,
      awayScore: st.awayScore,
      leagueName: st.fixture.league.name,
      decisions: st.decisions,
      positioningScore: 84,
      matchControlScore: 85,
      crowdPressureScore: div.hostileCrowd ? 82 : 90,
      currentReputation: st.career.reputation,
      bribeOffered: st.bribeOffered,
      bribeAccepted: st.bribeAccepted,
      bribeFavoredTeam: st.bribeTeam,
      varChecksUsed: Math.max(0, usedVar),
    });

    setLastMatchSummary(summary);
    stadiumRef.current?.setMenuMode();

    if (st.isMultiplayer) {
      setScreen('match_results');
      return;
    }

    const { updatedCareer, divisionResult } = applyMatchToCareer(st.career, summary);
    setCareer(updatedCareer);
    setLastDivisionResult(divisionResult);

    if (summary.investigationTriggered) {
      setScreen('investigation');
    } else {
      setScreen('match_results');
    }
  }, []);

  const handleDecision = useCallback(
    (action: DecisionAction, remoteSender?: string) => {
      const st = stateRef.current;
      if (st.screen !== 'playing' || st.isPaused) return;

      // Multiplayer authority routing
      if (st.isMultiplayer && !remoteSender) {
        const targetId = st.activeIncident?.id || st.replayTargetIncident?.id;
        import('./net/MultiplayerClient').then(({ mpClient }) => {
          mpClient.sendDecision(action, targetId);
        });
        if (st.mpRole === 'assistant_referee_1' || st.mpRole === 'assistant_referee_2') {
          stadiumRef.current?.triggerLinesmanFlag(st.mpRole === 'assistant_referee_1' ? 0 : 1);
          soundEngine.whistle('short');
          showFeedbackToast(
            `${translate(st.settings.language, 'mp_flag_signal')}: ${action.toUpperCase()}`,
            true
          );
          return;
        }
        if (st.mpRole === 'var_referee') {
          const decKey = `dec_${
            action === 'yellow_card' ? 'yellow' : action === 'red_card' ? 'red' : action
          }`;
          showFeedbackToast(
            `${translate(st.settings.language, 'mp_var_send_rec')}: ${translate(st.settings.language, decKey)}`,
            true
          );
          if (st.isReplayMode) {
            setIsReplayMode(false);
            setReplayPaused(false);
            setReplayTargetIncident(null);
            stadiumRef.current?.stopReplayMode();
          }
          return;
        }
      }

      if (action === 'yellow_card') {
        soundEngine.yellowCard();
        stadiumRef.current?.triggerCardVisual('yellow');
        inputManager.vibrate(140, 0.5, 0.3);
      } else if (action === 'red_card') {
        soundEngine.redCard();
        stadiumRef.current?.triggerCardVisual('red');
        inputManager.vibrate(240, 0.9, 0.6);
      } else if (action === 'offside') {
        stadiumRef.current?.triggerLinesmanFlag(1);
        soundEngine.whistle('short');
      } else if (action !== 'no_foul' && action !== 'advantage') {
        soundEngine.whistle('foul');
        inputManager.vibrate(100, 0.4, 0.2);
      }

      const activeInc = st.activeIncident;
      const isVarOverturnOfLast =
        (!activeInc || activeInc.resolved) &&
        st.isReplayMode &&
        st.replayPurpose === 'var' &&
        Boolean(st.replayTargetIncident);

      const inc = activeInc && !activeInc.resolved ? activeInc : isVarOverturnOfLast ? st.replayTargetIncident : null;

      if (!inc) {
        if (!remoteSender) {
          showFeedbackToast(translate(st.settings.language, 'fb_no_incident'), false);
        }
        return;
      }

      const usedVar = inc.varReviewed || (st.isReplayMode && st.replayPurpose === 'var');
      inc.resolved = true;
      inc.varReviewed = usedVar;

      const record = evaluateIncidentDecision(inc, action, usedVar);
      if (isVarOverturnOfLast) {
        setDecisions((prev) => {
          const idx = prev.findIndex((d) => d.id === inc.id);
          if (idx === -1) return [...prev, record];
          const copy = [...prev];
          copy[idx] = record;
          return copy;
        });
      } else {
        setDecisions((prev) => [...prev, record]);
      }

      setLastIncident({ ...inc });
      setActiveIncident(null);
      setIsReplayMode(false);
      setReplayPaused(false);
      setReplayTargetIncident(null);

      if (st.isMultiplayer && st.mpRole === 'main_referee') {
        import('./net/MultiplayerClient').then(({ mpClient }) => {
          mpClient.sendIncidentSync('resolved', inc);
        });
      }

      const controversial = !record.correct || action === 'red_card' || action === 'penalty';
      if (isVarOverturnOfLast) {
        stadiumRef.current?.stopReplayMode();
        if (controversial && DIVISIONS[st.career.currentDivisionIndex]?.surroundRefOnControversy) {
          stadiumRef.current?.triggerCrowdReaction('boo', 2.4);
        }
      } else {
        stadiumRef.current?.clearActiveIncident(controversial);
      }

      // Execute the referee decision physically on the 3D pitch!
      const pitchExec = stadiumRef.current?.executeDecisionOnPitch(action, inc, st.selectedPlayer);
      if (pitchExec) {
        const langNow = st.settings.language;
        const awardedName =
          pitchExec.awardedTeam === 'home'
            ? st.fixture?.home.name || 'HOME'
            : st.fixture?.away.name || 'AWAY';
        let bannerText: string | null = null;

        if (pitchExec.secondYellowRed && pitchExec.sentOffPlayer) {
          bannerText = translate(langNow, 'sp_second_yellow', { name: pitchExec.sentOffPlayer.name });
        } else if (pitchExec.sentOffPlayer) {
          bannerText = translate(langNow, 'sp_sent_off', {
            num: pitchExec.sentOffPlayer.number,
            name: pitchExec.sentOffPlayer.name,
          });
        } else if (pitchExec.setPieceType === 'penalty') {
          bannerText = translate(langNow, 'sp_penalty_awarded', { team: awardedName });
        } else if (action === 'offside') {
          bannerText = translate(langNow, 'sp_offside_kick');
        } else if (pitchExec.setPieceType === 'throw_in') {
          bannerText = translate(langNow, 'sp_throw_in', { team: awardedName });
        } else if (pitchExec.setPieceType === 'free_kick') {
          bannerText = translate(langNow, 'sp_free_kick', { team: awardedName });
        }

        if (bannerText) {
          setSetPieceBanner(bannerText);
          setTimeout(() => {
            setSetPieceBanner((curr) => (curr === bannerText ? null : curr));
          }, 3200);
        }
      }

      if (controversial && DIVISIONS[st.career.currentDivisionIndex]?.surroundRefOnControversy) {
        setSurroundAlert(true);
        setTimeout(() => setSurroundAlert(false), 3200);
      } else if (record.correct) {
        stadiumRef.current?.triggerCrowdReaction('cheer', 1.8);
      }

      const fbKey =
        record.playerCalled === 'ignored_dive'
          ? 'fb_dive_ignored'
          : inc.type === 'diving' && !record.correct
          ? 'fb_dive_called'
          : record.playerCalled === 'var_overturn'
          ? 'fb_var_overturn'
          : usedVar && !record.correct
          ? 'fb_var_error'
          : action === 'advantage' && record.correct
          ? 'fb_advantage_ok'
          : record.correct
          ? 'fb_correct'
          : 'fb_incorrect';

      showFeedbackToast(
        `${translate(st.settings.language, fbKey)} (${record.pointsDelta >= 0 ? '+' : ''}${record.pointsDelta})`,
        record.correct
      );
      const decKey = `dec_${
        action === 'yellow_card' ? 'yellow' : action === 'red_card' ? 'red' : action
      }`;
      setCommentaryText(
        `${inc.minute}' — ${translate(st.settings.language, decKey)}: ${inc.offendingPlayerName}`
      );
      setTimeout(() => {
        setCommentaryText((curr) =>
          curr.startsWith(`${inc.minute}' —`)
            ? translate(stateRef.current.settings.language, 'hud_live_play')
            : curr
        );
      }, 3600);
    },
    [showFeedbackToast]
  );

  const handleVarCheck = useCallback(() => {
    const st = stateRef.current;
    if (st.screen !== 'playing' || st.isPaused) return;
    const div = DIVISIONS[st.isMultiplayer ? 4 : st.career.currentDivisionIndex];
    const langNow = st.settings.language;

    const isVarRole = st.isMultiplayer && st.mpRole === 'var_referee';

    if (!isVarRole && div.varChecksAllowed <= 0) {
      showFeedbackToast(translate(langNow, 'var_unavailable_div'), false);
      return;
    }

    const target = st.activeIncident || st.lastIncident;
    if (!target) {
      showFeedbackToast(translate(langNow, 'var_no_incident'), false);
      return;
    }

    if (!isVarRole && !target.varReviewed && st.varChecksLeft <= 0) {
      showFeedbackToast(translate(langNow, 'var_no_checks'), false);
      return;
    }

    if (!target.varReviewed) {
      soundEngine.varChime();
      if (!isVarRole) {
        setVarChecksLeft((c) => Math.max(0, c - 1));
      }
      target.varReviewed = true;
      setLastIncident({ ...target });
      if (st.activeIncident && st.activeIncident.id === target.id) {
        setActiveIncident({ ...target });
      }
    }

    target.expiresAt = Math.max(target.expiresAt, Date.now() + 14000);
    const defaultAngle = target.type === 'offside' ? 'offside' : 'side';
    setReplayPurpose('var');
    setReplayTargetIncident({ ...target });
    setReplayPaused(false);
    setReplaySpeed(0.5);
    setReplayAngle(defaultAngle);
    setReplayProgress(0);
    setReplayTimeSec(0);
    setIsReplayMode(true);
    stadiumRef.current?.startReplayMode(target);
    stadiumRef.current?.setReplaySpeed(0.5);
    setCommentaryText(translate(langNow, 'var_checking'));
  }, [showFeedbackToast]);

  const handleReplayToggle = useCallback(() => {
    const st = stateRef.current;
    if (st.screen !== 'playing' || st.isPaused) return;
    if (st.isReplayMode) {
      setIsReplayMode(false);
      setReplayPaused(false);
      setReplayTargetIncident(null);
      stadiumRef.current?.stopReplayMode();
      setCommentaryText(translate(st.settings.language, 'hud_live_play'));
    } else {
      const target = st.activeIncident || st.lastIncident;
      if (!target) {
        showFeedbackToast(translate(st.settings.language, 'var_no_incident'), false);
        return;
      }
      target.expiresAt = Math.max(target.expiresAt, Date.now() + 12000);
      const defaultAngle = target.type === 'offside' ? 'offside' : 'side';
      setReplayPurpose('replay');
      setReplayTargetIncident({ ...target });
      setReplayPaused(false);
      setReplaySpeed(0.5);
      setReplayAngle(defaultAngle);
      setReplayProgress(0);
      setReplayTimeSec(0);
      setIsReplayMode(true);
      stadiumRef.current?.startReplayMode(target);
      stadiumRef.current?.setReplaySpeed(0.5);
    }
  }, [showFeedbackToast]);

  // Mount isolated 3D Stadium Canvas ONCE
  useEffect(() => {
    if (!canvasMountRef.current) return;
    inputManager.init();
    (window as any).__refInputPoll = (sens: number) => inputManager.pollFrame(sens);

    const stadium = new StadiumScene(canvasMountRef.current, stateRef.current.settings, {
      onIncidentSpawn: (inc) => {
        setActiveIncident(inc);
        setLastIncident(inc);
        setCommentaryText(
          `${inc.minute}' — ${translate(stateRef.current.settings.language, `inc_${inc.type}`)}`
        );
        if (stateRef.current.isMultiplayer && stateRef.current.mpRole === 'main_referee') {
          import('./net/MultiplayerClient').then(({ mpClient }) => {
            mpClient.sendIncidentSync('spawn', inc);
          });
        }
        if (stateRef.current.settings.gameplay.autoReplay) {
          const defaultAngle = inc.type === 'offside' ? 'offside' : 'side';
          setReplayPurpose('replay');
          setReplayTargetIncident(inc);
          setReplayPaused(false);
          setReplaySpeed(0.5);
          setReplayAngle(defaultAngle);
          setReplayProgress(0);
          setReplayTimeSec(0);
          setIsReplayMode(true);
          stadium.startReplayMode(inc);
          stadium.setReplaySpeed(0.5);
        }
      },
      onIncidentExpire: (inc) => {
        inc.resolved = true;
        if (stateRef.current.isMultiplayer && stateRef.current.mpRole === 'main_referee') {
          import('./net/MultiplayerClient').then(({ mpClient }) => {
            mpClient.sendIncidentSync('resolved', inc);
          });
        }
        const autoAction: DecisionAction = 'no_foul';
        const rec = evaluateIncidentDecision(inc, autoAction, inc.varReviewed);
        setDecisions((prev) => [...prev, rec]);
        setLastIncident({ ...inc });
        setActiveIncident(null);
        setIsReplayMode(false);
        setReplayTargetIncident(null);
        stadium.stopReplayMode();

        const langNow = stateRef.current.settings.language;
        const label = translate(langNow, rec.correct ? 'fb_play_on' : 'fb_missed_call');
        showFeedbackToast(
          `${label} (${rec.pointsDelta >= 0 ? '+' : ''}${rec.pointsDelta})`,
          rec.correct
        );
        setCommentaryText(translate(langNow, 'hud_live_play'));
      },
      onGoalScored: (team, scorer) => {
        if (team === 'home') setHomeScore((s) => s + 1);
        else setAwayScore((s) => s + 1);
        setCommentaryText(
          translate(stateRef.current.settings.language, 'hud_goal_scored', { scorer })
        );
      },
      onMatchMinute: (m) => {
        setMinute(m);
        if (m >= 90) {
          finishMatch();
        }
      },
      onPlayerSelected: (player) => {
        setSelectedPlayer(player);
      },
      onStaminaChange: (st) => {
        setStamina(st);
      },
      onReplayProgress: (norm, currentSec, totalSec) => {
        setReplayProgress(norm);
        setReplayTimeSec(currentSec);
        setReplayDurationSec(totalSec);
      },
      onSetPieceBanner: (key, team) => {
        const stNow = stateRef.current;
        const teamName =
          team === 'home'
            ? stNow.fixture?.home.name || 'HOME'
            : stNow.fixture?.away.name || 'AWAY';
        const banner = translate(stNow.settings.language, key, { team: teamName });
        setSetPieceBanner(banner);
        setTimeout(() => {
          setSetPieceBanner((curr) => (curr === banner ? null : curr));
        }, 2600);
      },
      onSyncBroadcast: (payload) => {
        if (stateRef.current.isMultiplayer && stateRef.current.mpRole === 'main_referee') {
          import('./net/MultiplayerClient').then(({ mpClient }) => {
            mpClient.send(payload);
          });
        }
      },
    });

    stadium.setMenuMode();
    stadiumRef.current = stadium;

    return () => {
      delete (window as any).__refInputPoll;
      stadium.dispose();
      inputManager.dispose();
    };
  }, [finishMatch, showFeedbackToast]);

  // Listen to Unified Input Actions (Keyboard, PlayStation Controller, Mobile)
  useEffect(() => {
    const unsubAction = inputManager.onAction((action: UnifiedAction) => {
      const st = stateRef.current;

      if (st.screen === 'bribe_offer') {
        if (action === 'bribe_accept') {
          setBribeAccepted(true);
          setCareer((c) => ({
            ...c,
            balance: c.balance + 5000,
            stats: { ...c.stats, careerEarnings: c.stats.careerEarnings + 5000 },
          }));
          launchStadiumMatch(st.fixture!, DIVISIONS[st.career.currentDivisionIndex], 'main_referee');
        } else if (action === 'bribe_reject') {
          setBribeAccepted(false);
          launchStadiumMatch(st.fixture!, DIVISIONS[st.career.currentDivisionIndex], 'main_referee');
        }
        return;
      }

      if (st.screen !== 'playing') return;

      switch (action) {
        case 'foul':
          handleDecision('foul');
          break;
        case 'yellow_card':
          handleDecision('yellow_card');
          break;
        case 'red_card':
          handleDecision('red_card');
          break;
        case 'penalty':
          handleDecision('penalty');
          break;
        case 'offside':
          handleDecision('offside');
          break;
        case 'no_foul':
          handleDecision('no_foul');
          break;
        case 'var_check':
          handleVarCheck();
          break;
        case 'replay':
          handleReplayToggle();
          break;
        case 'cancel':
          if (!st.isPaused && st.isReplayMode) {
            handleReplayToggle();
          }
          break;
        case 'pause':
          setIsPaused((p) => {
            const next = !p;
            if (stadiumRef.current) stadiumRef.current.paused = next;
            inputManager.setMenuMode(next);
            return next;
          });
          break;
        case 'focus_incident':
          stadiumRef.current?.focusOnIncident();
          break;
        case 'stats_toggle':
          setShowLiveStats((v) => !v);
          break;
      }
    });

    const unsubDevice = inputManager.onDeviceChange((dev) => setInputDevice(dev));
    return () => {
      unsubAction();
      unsubDevice();
    };
  }, [handleDecision, handleReplayToggle, handleVarCheck]);

  // Multiplayer WebSocket event bridge during active match
  useEffect(() => {
    let unsub = () => {};
    if (isMultiplayer) {
      import('./net/MultiplayerClient').then(({ mpClient }) => {
        unsub = mpClient.onMessage((msg) => {
          if (msg.type === 'state_sync') {
            stadiumRef.current?.applyNetworkStateSync(msg);
          } else if (msg.type === 'incident_sync') {
            if (stateRef.current.mpRole !== 'main_referee') {
              const inc = msg.incident as ActiveIncident | null;
              if (msg.kind === 'spawn' && inc) {
                setActiveIncident(inc);
                setLastIncident(inc);
                stadiumRef.current?.syncIncidentFromNetwork(inc, 'spawn');
                setCommentaryText(
                  `${inc.minute}' — ${translate(stateRef.current.settings.language, `inc_${inc.type}`)}`
                );
              } else {
                setActiveIncident(null);
                setIsReplayMode(false);
                setReplayTargetIncident(null);
                stadiumRef.current?.syncIncidentFromNetwork(null, 'resolved');
              }
            }
          } else if (msg.type === 'decision_event') {
            if (msg.senderId !== mpClient.clientId) {
              const rawAction = String(msg.action || '');
              const decKey = `dec_${
                rawAction === 'yellow_card' ? 'yellow' : rawAction === 'red_card' ? 'red' : rawAction
              }`;
              const actionLabel = translate(stateRef.current.settings.language, decKey);
              if (msg.isVarRecommendation) {
                soundEngine.varChime();
                const recText = translate(stateRef.current.settings.language, 'mp_var_rec_received', {
                  name: msg.senderName,
                  action: actionLabel,
                });
                showFeedbackToast(recText, true);
                setCommentaryText(recText);
              } else {
                showFeedbackToast(`${msg.senderName}: ${actionLabel}`, true);
                if (msg.senderRole === 'assistant_referee_1') {
                  stadiumRef.current?.triggerLinesmanFlag(0);
                } else if (msg.senderRole === 'assistant_referee_2' || rawAction === 'offside') {
                  stadiumRef.current?.triggerLinesmanFlag(1);
                }
              }
            }
          }
        });
      });
    }
    return () => unsub();
  }, [isMultiplayer, showFeedbackToast]);

  const launchStadiumMatch = (
    fx: GeneratedMatchFixture,
    div: (typeof DIVISIONS)[number],
    role: MultiplayerRole,
    isMp = false
  ) => {
    stateRef.current.matchFinished = false;
    setFixture(fx);
    setMinute(0);
    setHomeScore(0);
    setAwayScore(0);
    setDecisions([]);
    setActiveIncident(null);
    setLastIncident(null);
    setReplayTargetIncident(null);
    setReplayPurpose('replay');
    setSelectedPlayer(null);
    setLastFeedback(null);
    setSurroundAlert(false);
    setSetPieceBanner(null);
    setVarChecksLeft(role === 'var_referee' ? 99 : isMp ? Math.max(3, div.varChecksAllowed) : div.varChecksAllowed);
    setIsReplayMode(false);
    setReplayPaused(false);
    setReplaySpeed(0.5);
    setReplayAngle('side');
    setReplayProgress(0);
    setReplayTimeSec(0);
    setIsPaused(false);
    setCommentaryText(translate(settings.language, 'hud_kickoff'));
    setScreen('playing');
    stadiumRef.current?.startMatch(fx, div, role);
  };

  const handlePrepareCareerMatch = () => {
    const div = DIVISIONS[career.currentDivisionIndex];
    const fx = generateFixtureForDivision(
      div.id,
      selectedRegion === 'all' ? undefined : selectedRegion
    );
    setFixture(fx);
    setIsMultiplayer(false);
    setMpRole(null);
    setBribeAccepted(false);

    // 35% chance of pre-match bribery offer in Career Mode
    if (Math.random() < 0.35) {
      const team = Math.random() > 0.5 ? 'home' : 'away';
      setBribeTeam(team);
      setBribeOffered(true);
      setScreen('bribe_offer');
    } else {
      setBribeOffered(false);
      launchStadiumMatch(fx, div, 'main_referee');
    }
  };

  const handleAcceptBribe = () => {
    setBribeAccepted(true);
    setCareer((c) => ({
      ...c,
      balance: c.balance + 5000,
      stats: { ...c.stats, careerEarnings: c.stats.careerEarnings + 5000 },
    }));
    if (fixture) {
      launchStadiumMatch(fixture, DIVISIONS[career.currentDivisionIndex], 'main_referee');
    }
  };

  const handleRejectBribe = () => {
    setBribeAccepted(false);
    if (fixture) {
      launchStadiumMatch(fixture, DIVISIONS[career.currentDivisionIndex], 'main_referee');
    }
  };

  const handleStartMultiplayerMatch = (
    fx: GeneratedMatchFixture,
    role: MultiplayerRole,
    code: string
  ) => {
    setIsMultiplayer(true);
    setMpRole(role);
    setMpRoomCode(code);
    setBribeOffered(false);
    setBribeAccepted(false);
    launchStadiumMatch(fx, DIVISIONS[4], role, true);
  };

  const handleToggleVoice = async () => {
    const { mpClient } = await import('./net/MultiplayerClient');
    if (!mpClient.voiceEnabled) {
      const ok = await mpClient.enableVoiceChat();
      if (ok) {
        setVoiceEnabled(true);
        setMicMuted(false);
      }
    } else {
      const muted = mpClient.toggleMute();
      setMicMuted(muted);
    }
  };

  const currentDiv = DIVISIONS[career.currentDivisionIndex];
  const repRank = getReputationRank(career.reputation);

  // Live Match Telemetry calculations
  const liveCorrect = decisions.filter((d) => d.correct).length;
  const liveIncorrect = decisions.filter((d) => !d.correct).length;
  const liveTotal = liveCorrect + liveIncorrect;
  const liveAcc = liveTotal === 0 ? 100 : Math.round((liveCorrect / liveTotal) * 100);
  const livePoints = decisions.reduce((a, d) => a + d.pointsDelta, 0);
  const suspicionPercent = liveTotal === 0 ? 0 : Math.round((liveIncorrect / liveTotal) * 100);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080d14]">
      {/* Persistent Isolated 3D Stadium Viewport */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {/* MAIN MENU OVERLAY */}
      {screen === 'menu' && (
        <div
          data-gamepad-scope="main-menu"
          className="relative z-10 w-full h-full flex flex-col justify-between p-6 sm:p-10 bg-gradient-to-r from-[#070c14]/92 via-[#070c14]/55 to-transparent"
        >
          {/* Top Brand Strip */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs font-semibold tracking-widest text-emerald-400">
              {t('app_subtitle')}
            </div>

            <button
              onClick={() => setScreen('settings')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-medium text-slate-200 hover:text-white cursor-pointer"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>{t('set_cat_language')}</span>
            </button>
          </div>

          {/* Left Hero & Menu Navigation Stack */}
          <div className="max-w-lg space-y-6 my-auto">
            <div className="space-y-2">
              <h1
                className="font-display text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-none"
                style={{ textWrap: 'balance' }}
              >
                {t('app_title')}
              </h1>
              <div className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-2 pt-1">
                <span>{t(currentDiv.nameKey)}</span>
                <span aria-hidden="true">·</span>
                <span>{t(repRank.nameKey)}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular text-amber-400">${career.balance.toLocaleString()}</span>
              </div>
            </div>

            <nav className="flex flex-col gap-2.5 max-w-sm">
              <button
                data-gamepad-default
                onClick={() => {
                  if (career.gameOver) setScreen('game_over');
                  else setScreen('career_hub');
                }}
                className="w-full px-5 py-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xl font-bold tracking-wide flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>{career.stats.totalMatches > 0 ? t('menu_continue_career') : t('menu_career')}</span>
                <Play className="w-5 h-5" />
              </button>

              <button
                onClick={() => setScreen('friend_lobby')}
                className="w-full px-5 py-3.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-display text-xl font-bold tracking-wide flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>{t('menu_friend_mode')}</span>
                <Users className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setScreen('stats')}
                  className="px-4 py-3 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-100 text-sm font-semibold flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">{t('menu_stats')}</span>
                  <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
                </button>

                <button
                  onClick={() => setScreen('trophies')}
                  className="px-4 py-3 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-100 text-sm font-semibold flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">{t('menu_trophies')}</span>
                  <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setScreen('settings')}
                  className="px-4 py-3 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-100 text-sm font-semibold flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">{t('menu_settings')}</span>
                  <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                <button
                  onClick={() => setExitBanner(true)}
                  className="px-4 py-3 rounded-lg bg-slate-900/90 hover:bg-rose-900/80 border border-slate-700 text-slate-300 hover:text-white text-sm font-semibold flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">{t('menu_exit')}</span>
                  <LogOut className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </nav>
          </div>

          {/* Quiet Footer */}
          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
            <span>WASD + Mouse</span>
            <span>·</span>
            <span>PlayStation DualSense / DualShock</span>
            <span>·</span>
            <span>Mobile Touch Controls</span>
          </div>
        </div>
      )}

      {/* EXIT CONFIRMATION */}
      {exitBanner && (
        <div data-gamepad-scope="exit-banner" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-sm w-full rounded-xl bg-[#0b1322] border border-slate-700 p-5 space-y-4 text-center">
            <p className="text-sm text-slate-200">{t('menu_exit_confirm')}</p>
            <div className="flex gap-3">
              <button
                data-gamepad-default
                data-gamepad-back
                onClick={() => setExitBanner(false)}
                className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
              >
                {t('hud_resume')}
              </button>
              <button
                onClick={() => {
                  setExitBanner(false);
                  setScreen('menu');
                }}
                className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                {t('go_main_menu')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BRIBERY PRE-MATCH OFFER */}
      {screen === 'bribe_offer' && fixture && (
        <div data-gamepad-scope="bribe-offer" className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-xl bg-[#0d1626] border border-amber-500/70 p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <ShieldAlert className="w-8 h-8 shrink-0" />
              <h2 className="font-display text-2xl font-bold">{t('bribe_title')}</h2>
            </div>
            <p className="text-sm text-slate-200">
              {t('bribe_desc', {
                team: bribeTeam === 'home' ? fixture.home.name : fixture.away.name,
              })}
            </p>
            <p className="text-xs text-rose-300 bg-rose-950/60 border border-rose-700/60 p-3 rounded-lg">
              {t('bribe_warning')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                data-gamepad-default
                onClick={handleAcceptBribe}
                className="flex-1 py-3 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-sm cursor-pointer"
              >
                {t('bribe_accept')} ({inputDevice === 'playstation' ? '✕' : 'B'})
              </button>
              <button
                data-gamepad-back
                onClick={handleRejectBribe}
                className="flex-1 py-3 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm cursor-pointer"
              >
                {t('bribe_reject')} ({inputDevice === 'playstation' ? '○' : 'Esc'})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE MATCH HUD */}
      {screen === 'playing' && fixture && (
        <MatchHUD
          lang={settings.language}
          settings={settings}
          fixture={fixture}
          division={isMultiplayer ? DIVISIONS[4] : currentDiv}
          minute={minute}
          homeScore={homeScore}
          awayScore={awayScore}
          stamina={stamina}
          reputation={career.reputation}
          matchPoints={livePoints}
          correctCount={liveCorrect}
          incorrectCount={liveIncorrect}
          liveRating={liveAcc}
          matchesRemainingInDiv={10 - career.divisionMatchesPlayed}
          varChecksLeft={varChecksLeft}
          bribeAccepted={bribeAccepted}
          suspicionPercent={suspicionPercent}
          activeIncident={activeIncident}
          hasReviewableIncident={Boolean(activeIncident || lastIncident)}
          replayIncident={replayTargetIncident}
          replayPurpose={replayPurpose}
          lastDecision={
            replayTargetIncident
              ? decisions.find((d) => d.id === replayTargetIncident.id) ?? null
              : null
          }
          selectedPlayer={selectedPlayer}
          lastFeedback={lastFeedback}
          commentaryText={commentaryText}
          isReplayMode={isReplayMode}
          replayPaused={replayPaused}
          replaySpeed={replaySpeed}
          replayAngle={replayAngle}
          replayProgress={replayProgress}
          replayTimeSec={replayTimeSec}
          replayDurationSec={replayDurationSec}
          isPaused={isPaused}
          surroundAlert={surroundAlert}
          setPieceBanner={setPieceBanner}
          inputDevice={inputDevice}
          isMultiplayer={isMultiplayer}
          mpRole={mpRole}
          mpRoomCode={mpRoomCode}
          voiceEnabled={voiceEnabled}
          micMuted={micMuted}
          onDecision={(action) => handleDecision(action)}
          onVarCheck={handleVarCheck}
          onReplayToggle={handleReplayToggle}
          onReplayPlayPause={() => {
            setReplayPaused((prev) => {
              const next = !prev;
              stadiumRef.current?.setReplayPaused(next);
              return next;
            });
          }}
          onReplaySpeedChange={(spd) => {
            setReplaySpeed(spd);
            stadiumRef.current?.setReplaySpeed(spd);
          }}
          onReplayAngleChange={(ang) => {
            setReplayAngle(ang);
            stadiumRef.current?.setReplayAngle(ang);
          }}
          onReplaySeek={(norm) => {
            setReplayProgress(norm);
            stadiumRef.current?.seekReplay(norm);
          }}
          onFocusIncident={() => stadiumRef.current?.focusOnIncident()}
          onPauseToggle={() => {
            setIsPaused((p) => {
              const next = !p;
              if (stadiumRef.current) stadiumRef.current.paused = next;
              inputManager.setMenuMode(next);
              return next;
            });
          }}
          onAbandonMatch={() => {
            setIsPaused(false);
            setIsReplayMode(false);
            setReplayPaused(false);
            setReplayTargetIncident(null);
            setActiveIncident(null);
            setLastIncident(null);
            setSetPieceBanner(null);
            stadiumRef.current?.stopReplayMode();
            stadiumRef.current?.setMenuMode();
            if (isMultiplayer) {
              import('./net/MultiplayerClient').then(({ mpClient }) => mpClient.leaveRoom());
            }
            setScreen('menu');
          }}
          onToggleVoice={handleToggleVoice}
          onToggleStats={() => setShowLiveStats((v) => !v)}
          showLiveStats={showLiveStats}
        />
      )}

      {/* MODALS */}
      {screen === 'career_hub' && (
        <CareerHubModal
          lang={settings.language}
          career={career}
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
          onStartMatch={handlePrepareCareerMatch}
          onResetCareer={() => setCareer(createInitialCareer())}
          onClose={() => setScreen('menu')}
        />
      )}

      {screen === 'stats' && (
        <CareerStatsModal lang={settings.language} career={career} onClose={() => setScreen('menu')} />
      )}

      {screen === 'trophies' && (
        <TrophyCabinetModal
          lang={settings.language}
          unlocked={career.unlockedTrophies}
          onClose={() => setScreen('menu')}
        />
      )}

      {screen === 'settings' && (
        <SettingsModal
          settings={settings}
          onUpdate={(next) => setSettings(next)}
          onClose={() => setScreen('menu')}
        />
      )}

      {screen === 'friend_lobby' && (
        <FriendModeModal
          lang={settings.language}
          playerName={settings.playerName}
          onMatchStarted={handleStartMultiplayerMatch}
          onClose={() => setScreen('menu')}
        />
      )}

      {screen === 'investigation' && (
        <InvestigationModal
          lang={settings.language}
          onAccept={() => setScreen('match_results')}
        />
      )}

      {screen === 'match_results' && lastMatchSummary && (
        <MatchResultsModal
          lang={settings.language}
          summary={lastMatchSummary}
          onContinue={() => {
            if (isMultiplayer) {
              setScreen('menu');
            } else if (lastDivisionResult) {
              setScreen('division_results');
            } else {
              setScreen('career_hub');
            }
          }}
        />
      )}

      {screen === 'division_results' && lastDivisionResult && (
        <DivisionResultsModal
          lang={settings.language}
          result={lastDivisionResult}
          onContinue={() => {
            if (career.gameOver) {
              setScreen('game_over');
            } else {
              setLastDivisionResult(null);
              setScreen('career_hub');
            }
          }}
        />
      )}

      {screen === 'game_over' && (
        <GameOverModal
          lang={settings.language}
          career={career}
          onRestart={() => {
            setCareer(createInitialCareer());
            setScreen('career_hub');
          }}
          onMainMenu={() => setScreen('menu')}
        />
      )}

      {/* Controller Navigation Hint Strip in Menus */}
      {menuNavEnabled && (inputDevice === 'playstation' || settings.controls.activeProfile === 'playstation') && (
        <div className="pointer-events-none fixed bottom-2.5 left-1/2 -translate-x-1/2 z-[60] px-4 py-1.5 rounded-lg bg-[#070d18]/92 border border-emerald-500/45 text-[11px] font-medium text-emerald-300 whitespace-nowrap">
          {t('ctrl_menu_hint')}
        </div>
      )}
    </div>
  );
}
