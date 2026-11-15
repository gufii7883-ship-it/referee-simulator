import React, { useRef, useState } from 'react';
import {
  ActiveIncident,
  DecisionAction,
  DecisionRecord,
  DivisionConfig,
  GameSettings,
  InputPromptDevice,
  MultiplayerRole,
} from '../types/game';
import { GeneratedMatchFixture } from '../data/leagues';
import { translate } from '../i18n/translations';
import { inputManager } from '../input/InputManager';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Flag,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Tv,
  Users,
} from 'lucide-react';

interface MatchHUDProps {
  lang: GameSettings['language'];
  settings: GameSettings;
  fixture: GeneratedMatchFixture;
  division: DivisionConfig;
  minute: number;
  homeScore: number;
  awayScore: number;
  stamina: number;
  reputation: number;
  matchPoints: number;
  correctCount: number;
  incorrectCount: number;
  liveRating: number;
  matchesRemainingInDiv: number;
  varChecksLeft: number;
  bribeAccepted: boolean;
  suspicionPercent: number;
  activeIncident: ActiveIncident | null;
  hasReviewableIncident: boolean;
  replayIncident: ActiveIncident | null;
  replayPurpose: 'var' | 'replay';
  lastDecision: DecisionRecord | null;
  selectedPlayer: { team: 'home' | 'away'; number: number; name: string; cardState: string } | null;
  lastFeedback: { text: string; positive: boolean } | null;
  commentaryText: string;
  isReplayMode: boolean;
  replayPaused: boolean;
  replaySpeed: number;
  replayAngle: 'side' | 'closeup' | 'offside';
  replayProgress: number;
  replayTimeSec: number;
  replayDurationSec: number;
  isPaused: boolean;
  surroundAlert: boolean;
  setPieceBanner: string | null;
  inputDevice: InputPromptDevice;
  isMultiplayer: boolean;
  mpRole: MultiplayerRole | null;
  mpRoomCode: string | null;
  voiceEnabled: boolean;
  micMuted: boolean;
  onDecision: (action: DecisionAction) => void;
  onVarCheck: () => void;
  onReplayToggle: () => void;
  onReplayPlayPause: () => void;
  onReplaySpeedChange: (speed: number) => void;
  onReplayAngleChange: (angle: 'side' | 'closeup' | 'offside') => void;
  onReplaySeek: (norm: number) => void;
  onFocusIncident: () => void;
  onPauseToggle: () => void;
  onAbandonMatch: () => void;
  onToggleVoice: () => void;
  onToggleStats: () => void;
  showLiveStats: boolean;
}

export const MatchHUD: React.FC<MatchHUDProps> = ({
  lang,
  settings,
  fixture,
  division,
  minute,
  homeScore,
  awayScore,
  stamina,
  reputation,
  matchPoints,
  correctCount,
  incorrectCount,
  liveRating,
  matchesRemainingInDiv,
  varChecksLeft,
  bribeAccepted,
  suspicionPercent,
  activeIncident,
  hasReviewableIncident,
  replayIncident,
  replayPurpose,
  lastDecision,
  selectedPlayer,
  lastFeedback,
  commentaryText,
  isReplayMode,
  replayPaused,
  replaySpeed,
  replayAngle,
  replayProgress,
  replayTimeSec,
  replayDurationSec,
  isPaused,
  surroundAlert,
  setPieceBanner,
  inputDevice,
  isMultiplayer,
  mpRole,
  mpRoomCode,
  voiceEnabled,
  micMuted,
  onDecision,
  onVarCheck,
  onReplayToggle,
  onReplayPlayPause,
  onReplaySpeedChange,
  onReplayAngleChange,
  onReplaySeek,
  onFocusIncident,
  onPauseToggle,
  onAbandonMatch,
  onToggleVoice,
  onToggleStats,
  showLiveStats,
}) => {
  const t = (k: string, vars?: Record<string, string | number>) => translate(lang, k, vars);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  // Mobile Virtual Joystick tracking
  const joyRef = useRef<HTMLDivElement | null>(null);
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });
  const lookTouchRef = useRef<{ id: number; x: number; y: number } | null>(null);

  const totalCalls = correctCount + incorrectCount;
  const accuracy = totalCalls === 0 ? 100 : Math.round((correctCount / totalCalls) * 100);

  const isMobileUI =
    settings.controls.activeProfile === 'mobile' || inputDevice === 'mobile';
  const isPS = inputDevice === 'playstation' || settings.controls.activeProfile === 'playstation';
  const showAllMainActions = !isMultiplayer || mpRole === 'main_referee';
  const showLinesmanActions =
    !isMultiplayer || mpRole === 'assistant_referee_1' || mpRole === 'assistant_referee_2';
  const isVarReviewer = isMultiplayer && mpRole === 'var_referee';

  const mpRoleLabel =
    mpRole === 'var_referee'
      ? t('mp_role_var')
      : mpRole === 'assistant_referee_1'
      ? t('mp_role_linesman_1')
      : mpRole === 'assistant_referee_2'
      ? t('mp_role_linesman_2')
      : t('mp_role_main');

  const keyHint = (kb: string, ps: string) => (isPS ? ps : kb);

  // Mobile Joystick handlers
  const handleJoyMove = (clientX: number, clientY: number) => {
    const el = joyRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width / 2 - 12;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setJoyKnob({ x: dx, y: dy });
    inputManager.virtualMove = { x: dx / maxR, y: -dy / maxR };
  };

  const resetJoy = () => {
    setJoyKnob({ x: 0, y: 0 });
    inputManager.virtualMove = { x: 0, y: 0 };
  };

  const subSizeClass =
    settings.accessibility.subtitleSize === 'large'
      ? 'text-base'
      : settings.accessibility.subtitleSize === 'small'
      ? 'text-xs'
      : 'text-sm';

  const btnScale = settings.controls.mobileButtonScale || 1;

  return (
    <div
      className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 sm:p-4"
      style={{ fontSize: `${settings.accessibility.uiScale * 100}%` }}
    >
      {/* TOP BAR: Broadcast Scoreboard & Live Referee Telemetry */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Left: Broadcast Scorebug */}
        <div
          className={`pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-lg border ${
            settings.accessibility.highContrast
              ? 'bg-black border-white text-white'
              : 'bg-[#09111e]/90 border-slate-700/70 text-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-5 rounded-sm shrink-0"
              style={{ backgroundColor: fixture.home.primaryColor }}
            />
            <span className="font-display font-bold text-lg tracking-wide">{fixture.home.shortName}</span>
          </div>

          <div className="px-2.5 py-0.5 rounded bg-slate-950 font-mono-tabular font-bold text-lg text-white">
            {homeScore} - {awayScore}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg tracking-wide">{fixture.away.shortName}</span>
            <span
              className="w-2.5 h-5 rounded-sm shrink-0"
              style={{ backgroundColor: fixture.away.primaryColor }}
            />
          </div>

          <span className="text-slate-600">|</span>

          <div className="font-mono-tabular text-emerald-400 font-bold text-base">
            {minute}&apos;
          </div>

          <span className="hidden md:inline text-xs text-slate-400">
            {t(division.nameKey)} · {fixture.league.name}
          </span>
        </div>

        {/* Center: Live Scoring & Promotion Metrics */}
        <div className="pointer-events-auto hidden lg:flex items-center gap-4 px-4 py-2 rounded-lg bg-[#09111e]/90 border border-slate-700/70 text-xs">
          <div>
            <span className="text-slate-400">{t('hud_points')}: </span>
            <span className="font-mono-tabular font-bold text-amber-400">{matchPoints}</span>
          </div>
          <span className="text-slate-700">·</span>
          <div>
            <span className="text-slate-400">{t('hud_correct')}/{t('hud_incorrect')}: </span>
            <span className="font-mono-tabular font-bold text-emerald-400">{correctCount}</span>
            <span className="text-slate-500">/</span>
            <span className="font-mono-tabular font-bold text-rose-400">{incorrectCount}</span>
          </div>
          <span className="text-slate-700">·</span>
          <div>
            <span className="text-slate-400">{t('hud_accuracy')}: </span>
            <span className="font-mono-tabular font-bold text-slate-100">{accuracy}%</span>
          </div>
          <span className="text-slate-700">·</span>
          <div>
            <span className="text-slate-400">{t('hud_rating')}: </span>
            <span className="font-mono-tabular font-bold text-sky-400">{liveRating}</span>
          </div>
          {!isMultiplayer && (
            <>
              <span className="text-slate-700">·</span>
              <div>
                <span className="text-slate-400">{t('hud_remaining')}: </span>
                <span className="font-mono-tabular font-bold text-slate-100">{matchesRemainingInDiv}</span>
              </div>
            </>
          )}
        </div>

        {/* Right: Role, VAR, Multiplayer Voice & Pause */}
        <div className="pointer-events-auto flex items-center gap-2">
          {isMultiplayer && (
            <div className="px-2.5 py-2 rounded-lg bg-sky-950/90 border border-sky-500/60 text-xs font-bold text-sky-200">
              {mpRoleLabel}
            </div>
          )}

          <div className="px-3 py-2 rounded-lg bg-[#09111e]/90 border border-slate-700/70 text-xs font-medium">
            {isVarReviewer ? (
              <span className="text-sky-300 font-mono-tabular">VAR ∞</span>
            ) : division.varChecksAllowed > 0 || isMultiplayer ? (
              <span className="text-sky-300 font-mono-tabular">
                {t('hud_var_left')}: {varChecksLeft}
              </span>
            ) : (
              <span className="text-slate-500">{t('hud_var_none')}</span>
            )}
          </div>

          {isMultiplayer && (
            <button
              onClick={onToggleVoice}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                voiceEnabled && !micMuted
                  ? 'bg-emerald-600/90 border-emerald-400 text-white'
                  : 'bg-[#09111e]/90 border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              {voiceEnabled && !micMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              <span className="hidden sm:inline font-mono-tabular">{mpRoomCode}</span>
            </button>
          )}

          <button
            onClick={onToggleStats}
            title="Match Stats (Tab / Touchpad)"
            className="p-2 rounded-lg bg-[#09111e]/90 border border-slate-700/70 text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={onPauseToggle}
            title={t('hud_pause')}
            className="p-2 rounded-lg bg-[#09111e]/90 border border-slate-700/70 text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TOP-EDGE ALERTS & VAR MONITOR HEADER (Never covers center 3D pitch!) */}
      <div className="flex flex-col items-center gap-1.5 mt-1 mb-auto pointer-events-none">
        {surroundAlert && (
          <div className="px-4 py-1.5 rounded-lg bg-rose-950/95 border border-rose-500 text-rose-200 text-xs font-bold flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{t('hud_surround_alert')}</span>
          </div>
        )}

        {setPieceBanner && (
          <div className="px-5 py-1.5 rounded-lg bg-emerald-950/95 border border-emerald-400 text-emerald-200 text-xs font-extrabold tracking-wide">
            {setPieceBanner}
          </div>
        )}

        {activeIncident && !isReplayMode && (
          <div className="pointer-events-auto px-4 py-2 rounded-lg bg-[#09111e]/92 border border-amber-400/80 text-center max-w-xl space-y-1">
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold tracking-wider">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/60 text-amber-300">
                {t('hud_play_stopped')}
              </span>
              <span className="text-amber-400 font-mono-tabular">{activeIncident.minute}&apos;</span>
              <span className="text-white text-xs">{t(`inc_${activeIncident.type}`)}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
              <span>
                #{activeIncident.offendingPlayerNumber} {activeIncident.offendingPlayerName} vs #
                {activeIncident.victimPlayerNumber} {activeIncident.victimPlayerName}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                  activeIncident.inPenaltyBox
                    ? 'bg-amber-950/90 border-amber-400/80 text-amber-300'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
              >
                {activeIncident.inPenaltyBox ? t('hud_inside_box') : t('hud_outside_box')}
              </span>
              <button
                onClick={onFocusIncident}
                className="px-2 py-0.5 rounded bg-sky-700 hover:bg-sky-600 text-white text-[11px] font-semibold cursor-pointer"
              >
                {t('hud_focus_incident')} (Space)
              </button>
            </div>
          </div>
        )}

        {isReplayMode && replayIncident && (
          <>
            {/* Top VAR Broadcast Video Header Strip */}
            <div className="pointer-events-auto w-full max-w-3xl rounded-lg bg-[#09111e]/92 border border-sky-400/80 px-3.5 py-2 text-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-600/90 text-white font-bold text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  REC
                </span>
                <Tv className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="font-bold text-sky-300">
                  {replayPurpose === 'var' ? t('var_video_live') : t('replay_panel_title')}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-amber-400 font-mono-tabular font-bold">{replayIncident.minute}&apos;</span>
                <span className="font-semibold text-white">{t(`inc_${replayIncident.type}`)}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                    replayIncident.inPenaltyBox
                      ? 'bg-amber-950/90 border-amber-400/70 text-amber-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                >
                  {replayIncident.inPenaltyBox ? t('hud_inside_box') : t('hud_outside_box')}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(['side', 'closeup', 'offside'] as const).map((ang) => (
                  <button
                    key={ang}
                    onClick={() => onReplayAngleChange(ang)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold border cursor-pointer ${
                      replayAngle === ang
                        ? 'bg-sky-600 border-sky-300 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {ang === 'side'
                      ? t('var_angle_side')
                      : ang === 'closeup'
                      ? t('var_angle_close')
                      : t('var_angle_line')}
                  </button>
                ))}
                <button
                  onClick={onReplayToggle}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-[11px] font-bold cursor-pointer"
                >
                  {t('dec_close_replay')}
                </button>
              </div>
            </div>

            {/* Subtle Corner Viewfinder Frame leaving center 100% transparent */}
            <div className="pointer-events-none fixed inset-x-8 top-32 bottom-44 z-10">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-sky-400/75" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-sky-400/75" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-sky-400/75" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-sky-400/75" />
            </div>
          </>
        )}

        {lastFeedback && (
          <div
            className={`px-4 py-1.5 rounded-lg border text-xs font-bold ${
              lastFeedback.positive
                ? 'bg-emerald-950/95 border-emerald-500 text-emerald-300'
                : 'bg-rose-950/95 border-rose-500 text-rose-300'
            }`}
          >
            {lastFeedback.text}
          </div>
        )}

        {selectedPlayer && (
          <div className="px-3 py-1 rounded bg-[#09111e]/90 border border-slate-700 text-xs text-slate-200">
            {t('hud_selected_player', { num: selectedPlayer.number, name: selectedPlayer.name })}
          </div>
        )}
      </div>

      {/* Live Match Stats Popover (Tab / Touchpad) */}
      {showLiveStats && (
        <div className="pointer-events-auto self-center mb-2 px-5 py-3 rounded-lg bg-[#09111e]/95 border border-slate-700 text-xs grid grid-cols-3 gap-x-6 gap-y-1.5">
          <div>
            <span className="text-slate-400">{t('hud_points')}: </span>
            <span className="font-mono-tabular font-bold text-amber-400">{matchPoints}</span>
          </div>
          <div>
            <span className="text-slate-400">{t('hud_accuracy')}: </span>
            <span className="font-mono-tabular font-bold text-emerald-400">{accuracy}%</span>
          </div>
          <div>
            <span className="text-slate-400">{t('hud_rating')}: </span>
            <span className="font-mono-tabular font-bold text-sky-400">{liveRating}/100</span>
          </div>
        </div>
      )}

      {/* SUBTITLES BAR */}
      {settings.gameplay.subtitles && commentaryText && (
        <div className={`self-center mb-2 px-4 py-1.5 rounded bg-black/80 text-slate-100 text-center max-w-xl ${subSizeClass}`}>
          {commentaryText}
        </div>
      )}

      {/* MOBILE RIGHT-SIDE TOUCH LOOK AREA */}
      {isMobileUI && !isPaused && (
        <div
          className="pointer-events-auto fixed right-0 top-20 bottom-44 w-1/2 z-10"
          onTouchStart={(e) => {
            const touch = e.changedTouches[0];
            lookTouchRef.current = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
          }}
          onTouchMove={(e) => {
            if (!lookTouchRef.current) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
              const tItem = e.changedTouches[i];
              if (tItem.identifier === lookTouchRef.current.id) {
                const dx = tItem.clientX - lookTouchRef.current.x;
                const dy = tItem.clientY - lookTouchRef.current.y;
                lookTouchRef.current.x = tItem.clientX;
                lookTouchRef.current.y = tItem.clientY;
                inputManager.virtualLookDelta.x += dx * 0.35;
                inputManager.virtualLookDelta.y += dy * 0.25;
              }
            }
          }}
          onTouchEnd={() => {
            lookTouchRef.current = null;
          }}
        />
      )}

      {/* BOTTOM SECTION: Either VAR Video Player Console OR Stamina + Decision Dock */}
      {isReplayMode && replayIncident ? (
        <div className="pointer-events-auto self-center w-full max-w-4xl rounded-xl bg-[#09111e]/95 border border-sky-400/75 p-3 space-y-2.5 z-20">
          {/* Video Transport Controls: Play/Pause, Scrubber Timeline, Timecode, Speed */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onReplayPlayPause}
              title={replayPaused ? t('var_play') : t('var_pause')}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {replayPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{replayPaused ? t('var_play') : t('var_pause')}</span>
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={replayProgress}
              onChange={(e) => onReplaySeek(parseFloat(e.target.value))}
              aria-label="VAR Video Timeline"
              className="flex-1 min-w-[140px] accent-sky-400 cursor-pointer"
            />

            <span className="font-mono-tabular text-xs text-sky-300 shrink-0">
              {replayTimeSec.toFixed(1)}s / {replayDurationSec.toFixed(1)}s
            </span>

            <div className="flex items-center gap-1 shrink-0">
              {[0.25, 0.5, 1].map((spd) => (
                <button
                  key={spd}
                  onClick={() => onReplaySpeedChange(spd)}
                  className={`px-2 py-1 rounded text-[11px] font-mono-tabular font-bold border cursor-pointer ${
                    Math.abs(replaySpeed - spd) < 0.05
                      ? 'bg-amber-500 border-amber-300 text-slate-950'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* VAR Recommendation + Direct Final Decision Buttons */}
          {(showAllMainActions || isVarReviewer) && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {isVarReviewer ? (
                  <span className="px-2.5 py-1 rounded bg-sky-950/90 border border-sky-400/70 text-sky-200 font-bold">
                    {t('mp_var_send_rec')}
                  </span>
                ) : replayPurpose === 'var' && settings.gameplay.varAssistance ? (
                  <span className="px-2.5 py-1 rounded bg-emerald-950/90 border border-emerald-500/70 text-emerald-300 font-bold">
                    {t('var_rec_prefix')}:{' '}
                    {t(
                      `dec_${
                        replayIncident.correctDecisions[0] === 'yellow_card'
                          ? 'yellow'
                          : replayIncident.correctDecisions[0] === 'red_card'
                          ? 'red'
                          : replayIncident.correctDecisions[0]
                      }`
                    )}
                  </span>
                ) : (
                  <span className="text-slate-300">{t('var_confirm_hint')}</span>
                )}
                {lastDecision && (
                  <span className="text-[11px] text-slate-400">
                    {t('var_your_call')}:{' '}
                    <strong className="text-amber-300">
                      {t(
                        `dec_${
                          lastDecision.playerCalled === 'yellow_card'
                            ? 'yellow'
                            : lastDecision.playerCalled === 'red_card'
                            ? 'red'
                            : lastDecision.playerCalled === 'ignored_dive'
                            ? 'no_foul'
                            : lastDecision.playerCalled === 'var_overturn'
                            ? 'var'
                            : lastDecision.playerCalled
                        }`
                      )}
                    </strong>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onDecision('foul')}
                  className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-white cursor-pointer"
                >
                  {t('dec_foul')}
                </button>
                <button
                  onClick={() => onDecision('yellow_card')}
                  className="px-2.5 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-xs font-bold text-slate-950 cursor-pointer"
                >
                  {t('dec_yellow')}
                </button>
                <button
                  onClick={() => onDecision('red_card')}
                  className="px-2.5 py-1.5 rounded bg-rose-700 hover:bg-rose-600 text-xs font-bold text-white cursor-pointer"
                >
                  {t('dec_red')}
                </button>
                <button
                  onClick={() => onDecision('penalty')}
                  className="px-2.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-xs font-bold text-white cursor-pointer"
                >
                  {t('dec_penalty')}
                </button>
                <button
                  onClick={() => onDecision('offside')}
                  className="px-2.5 py-1.5 rounded bg-orange-700 hover:bg-orange-600 text-xs font-bold text-white cursor-pointer"
                >
                  {t('dec_offside')}
                </button>
                <button
                  onClick={() => onDecision('handball')}
                  className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-white cursor-pointer"
                >
                  {t('dec_handball')}
                </button>
                <button
                  onClick={() => onDecision('no_foul')}
                  className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  {t('dec_no_foul')}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-end justify-between gap-3 z-20">
          {/* Bottom-Left: Stamina, Reputation, Suspicion Meter OR Mobile Virtual Joystick */}
          <div className="pointer-events-auto flex flex-col gap-2">
            {isMobileUI && !isPaused && (
              <div className="flex items-center gap-3 mb-1">
                <div
                  ref={joyRef}
                  onTouchStart={(e) => handleJoyMove(e.touches[0].clientX, e.touches[0].clientY)}
                  onTouchMove={(e) => handleJoyMove(e.touches[0].clientX, e.touches[0].clientY)}
                  onTouchEnd={resetJoy}
                  className="relative w-28 h-28 rounded-full bg-slate-900/75 border-2 border-slate-500/70 flex items-center justify-center touch-none"
                >
                  <div
                    className="w-11 h-11 rounded-full bg-emerald-500/90 border border-white/60"
                    style={{ transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)` }}
                  />
                </div>
                <button
                  onTouchStart={() => (inputManager.virtualSprint = true)}
                  onTouchEnd={() => (inputManager.virtualSprint = false)}
                  onMouseDown={() => (inputManager.virtualSprint = true)}
                  onMouseUp={() => (inputManager.virtualSprint = false)}
                  className="px-3 py-3 rounded-full bg-amber-600/90 text-white text-xs font-bold border border-amber-300/60"
                >
                  SPRINT
                </button>
              </div>
            )}

            <div className="w-48 sm:w-56 p-2.5 rounded-lg bg-[#09111e]/90 border border-slate-700/70 space-y-1.5 text-[11px]">
              <div>
                <div className="flex justify-between text-slate-300">
                  <span>{t('hud_stamina')}</span>
                  <span className="font-mono-tabular">{stamina}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-100"
                    style={{ width: `${stamina}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300">
                  <span>{t('hud_reputation')}</span>
                  <span className="font-mono-tabular">{reputation}/100</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-sky-500 transition-all duration-150"
                    style={{ width: `${reputation}%` }}
                  />
                </div>
              </div>

              {/* Green Suspicion Meter when Bribe Accepted */}
              {bribeAccepted && (
                <div>
                  <div className="flex justify-between items-center text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      {t('bribe_suspicion')}
                    </span>
                    <span className="font-mono-tabular">{suspicionPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded overflow-hidden mt-0.5">
                    <div
                      className={`h-full transition-all duration-150 ${
                        suspicionPercent > 30 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, suspicionPercent)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom-Center / Right: Collapsible Unified Decision Dock */}
          <div className="pointer-events-auto flex flex-col items-end max-w-3xl">
            <button
              onClick={() => setDockCollapsed((v) => !v)}
              className="mb-1 px-3 py-1 rounded-t-lg bg-[#09111e]/95 border border-b-0 border-slate-700 text-[11px] text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{dockCollapsed ? t('hud_show_hud') : t('hud_hide_hud')}</span>
            </button>

            {!dockCollapsed && (
              <div
                className="p-2 rounded-lg bg-[#09111e]/92 border border-slate-700/80 flex flex-wrap justify-end gap-1.5"
                style={{ transform: isMobileUI ? `scale(${btnScale})` : undefined, transformOrigin: 'bottom right' }}
              >
                {showAllMainActions && (
                  <>
                    <DecisionButton
                      label={t('dec_foul')}
                      shortcut={keyHint('F', '□')}
                      color="bg-slate-800 hover:bg-slate-700 border-slate-600 text-white"
                      onClick={() => onDecision('foul')}
                    />
                    <DecisionButton
                      label={t('dec_yellow')}
                      shortcut={keyHint('Y', '△')}
                      color="bg-amber-600 hover:bg-amber-500 border-amber-400 text-slate-950 font-bold"
                      onClick={() => onDecision('yellow_card')}
                    />
                    <DecisionButton
                      label={t('dec_red')}
                      shortcut={keyHint('R', 'L1')}
                      color="bg-rose-700 hover:bg-rose-600 border-rose-500 text-white font-bold"
                      onClick={() => onDecision('red_card')}
                    />
                    <DecisionButton
                      label={t('dec_penalty')}
                      shortcut={keyHint('P', 'R1')}
                      color="bg-emerald-700 hover:bg-emerald-600 border-emerald-500 text-white font-bold"
                      onClick={() => onDecision('penalty')}
                    />
                    <DecisionButton
                      label={t('dec_handball')}
                      shortcut=""
                      color="bg-slate-800 hover:bg-slate-700 border-slate-600 text-white"
                      onClick={() => onDecision('handball')}
                    />
                    <DecisionButton
                      label={t('dec_no_foul')}
                      shortcut={keyHint('N', '↓')}
                      color="bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200"
                      onClick={() => onDecision('no_foul')}
                    />
                    <DecisionButton
                      label={t('dec_advantage')}
                      shortcut=""
                      color="bg-teal-800 hover:bg-teal-700 border-teal-500 text-white"
                      onClick={() => onDecision('advantage')}
                    />
                  </>
                )}

                {showLinesmanActions && (
                  <>
                    <DecisionButton
                      label={t('dec_offside')}
                      shortcut={keyHint('O', '↑')}
                      color="bg-orange-700 hover:bg-orange-600 border-orange-400 text-white font-bold"
                      icon={<Flag className="w-3.5 h-3.5" />}
                      onClick={() => onDecision('offside')}
                    />
                    <DecisionButton
                      label={t('dec_throw_in')}
                      shortcut=""
                      color="bg-slate-800 hover:bg-slate-700 border-slate-600 text-white"
                      onClick={() => onDecision('throw_in')}
                    />
                  </>
                )}

                {(showAllMainActions || isVarReviewer) && (
                  <>
                    <DecisionButton
                      label={
                        isVarReviewer
                          ? t('mp_var_open_monitor')
                          : `${t('dec_var')} (${division.varChecksAllowed > 0 || isMultiplayer ? varChecksLeft : 0})`
                      }
                      shortcut={keyHint('V', '←')}
                      disabled={(!isVarReviewer && division.varChecksAllowed === 0 && !isMultiplayer) || !hasReviewableIncident}
                      color="bg-sky-700 hover:bg-sky-600 border-sky-400 text-white disabled:opacity-40"
                      icon={<Tv className="w-3.5 h-3.5" />}
                      onClick={onVarCheck}
                    />
                    <DecisionButton
                      label={t('dec_replay')}
                      shortcut={keyHint('T', '→')}
                      disabled={!hasReviewableIncident}
                      color="bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100 disabled:opacity-40"
                      icon={<RotateCcw className="w-3.5 h-3.5" />}
                      onClick={onReplayToggle}
                    />
                  </>
                )}

                {isVarReviewer && (
                  <>
                    <DecisionButton
                      label={t('dec_penalty')}
                      shortcut={keyHint('P', 'R1')}
                      disabled={!hasReviewableIncident}
                      color="bg-emerald-700 hover:bg-emerald-600 border-emerald-500 text-white font-bold disabled:opacity-40"
                      onClick={() => onDecision('penalty')}
                    />
                    <DecisionButton
                      label={t('dec_red')}
                      shortcut={keyHint('R', 'L1')}
                      disabled={!hasReviewableIncident}
                      color="bg-rose-700 hover:bg-rose-600 border-rose-500 text-white font-bold disabled:opacity-40"
                      onClick={() => onDecision('red_card')}
                    />
                    <DecisionButton
                      label={t('dec_no_foul')}
                      shortcut={keyHint('N', '↓')}
                      disabled={!hasReviewableIncident}
                      color="bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200 disabled:opacity-40"
                      onClick={() => onDecision('no_foul')}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAUSE MODAL */}
      {isPaused && (
        <div data-gamepad-scope="pause-modal" className="pointer-events-auto fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl bg-[#0d1626] border border-slate-700 p-6 space-y-4 text-center">
            <h2 className="font-display text-3xl font-bold text-white">{t('hud_pause')}</h2>
            <p className="text-xs text-slate-400">
              {fixture.home.name} vs {fixture.away.name} · {minute}&apos;
            </p>
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                data-gamepad-default
                data-gamepad-back
                onClick={onPauseToggle}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm cursor-pointer flex items-center justify-between"
              >
                <span>{t('hud_resume')}</span>
                <span className="px-2 py-0.5 rounded bg-black/25 font-mono-tabular text-[11px]">
                  {isPS ? '✕ / ○' : 'Esc'}
                </span>
              </button>
              <button
                onClick={onAbandonMatch}
                className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-rose-700 text-slate-200 hover:text-white font-semibold text-sm cursor-pointer flex items-center justify-between"
              >
                <span>{t('hud_forfeit')}</span>
                {isPS && (
                  <span className="px-2 py-0.5 rounded bg-black/25 font-mono-tabular text-[11px]">
                    ↓ + ✕
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface DecisionButtonProps {
  label: string;
  shortcut: string;
  color: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  onClick: () => void;
}

const DecisionButton: React.FC<DecisionButtonProps> = ({
  label,
  shortcut,
  color,
  disabled,
  icon,
  onClick,
}) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`px-3 py-2 min-h-[40px] rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-transform active:scale-95 whitespace-nowrap cursor-pointer disabled:cursor-not-allowed ${color}`}
  >
    {icon}
    <span>{label}</span>
    {shortcut && (
      <span className="px-1.5 py-0.5 rounded bg-black/30 font-mono-tabular text-[10px]">
        {shortcut}
      </span>
    )}
  </button>
);
