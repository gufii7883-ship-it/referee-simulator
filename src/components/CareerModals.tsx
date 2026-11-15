import React, { useEffect, useRef, useState } from 'react';
import {
  CareerState,
  DIVISIONS,
  DivisionResult,
  LanguageCode,
  MatchSummary,
  RegionId,
  TROPHIES,
  TrophyId,
  getReputationRank,
} from '../types/game';
import { translate } from '../i18n/translations';
import { TrophyRoomScene } from '../three/TrophyRoomScene';
import { Award, CheckCircle2, RotateCcw, ShieldAlert, Trophy, X, XCircle } from 'lucide-react';

export const CareerHubModal: React.FC<{
  lang: LanguageCode;
  career: CareerState;
  selectedRegion: RegionId | 'all';
  onSelectRegion: (r: RegionId | 'all') => void;
  onStartMatch: () => void;
  onResetCareer: () => void;
  onClose: () => void;
}> = ({ lang, career, selectedRegion, onSelectRegion, onStartMatch, onResetCareer, onClose }) => {
  const t = (k: string) => translate(lang, k);
  const currentDiv = DIVISIONS[career.currentDivisionIndex];
  const repRank = getReputationRank(career.reputation);
  const avgRating =
    career.divisionRatings.length === 0
      ? 0
      : Math.round(career.divisionRatings.reduce((a, b) => a + b, 0) / career.divisionRatings.length);

  return (
    <div data-gamepad-scope="career-hub" className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#0b1322] border border-slate-700 rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">{t('career_hub')}</h2>
            <p className="text-xs text-slate-400">
              {t(currentDiv.nameKey)} · {t(repRank.nameKey)}
            </p>
          </div>
          <button data-gamepad-back onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Career Progression Bar (9 Stages) */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-300 font-semibold">
              <span>{t('career_progress')}</span>
              <span className="font-mono-tabular">
                {career.currentDivisionIndex + 1} / {DIVISIONS.length}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
              {DIVISIONS.map((d, i) => {
                const done = i < career.currentDivisionIndex || career.worldChampion;
                const active = i === career.currentDivisionIndex && !career.worldChampion;
                return (
                  <div
                    key={d.id}
                    className={`px-2 py-2 rounded border text-center text-[11px] font-medium ${
                      active
                        ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300 font-bold'
                        : done
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="font-mono-tabular text-[10px]">L{d.level}</div>
                    <div className="truncate">{t(d.nameKey)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4-Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricBox label={t('career_reputation')} value={`${career.reputation}/100`} sub={t(repRank.nameKey)} />
            <MetricBox label={t('career_balance')} value={`$${career.balance.toLocaleString()}`} />
            <MetricBox label={t('career_div_points')} value={`${career.divisionPoints}`} sub={`${career.divisionMatchesPlayed}/10`} />
            <MetricBox label={t('career_avg_rating')} value={avgRating > 0 ? `${avgRating}/100` : '—'} sub={`${career.unlockedTrophies.length}/8 ${t('career_trophies_count')}`} />
          </div>

          {/* Division Rules Notice */}
          <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <div className="font-semibold text-white">
              {t(currentDiv.nameKey)} — {t('career_matches_remaining')}:{' '}
              <span className="font-mono-tabular text-emerald-400">{10 - career.divisionMatchesPlayed}</span>
            </div>
            <div className="text-slate-400">
              {currentDiv.level <= 2 && 'Levels 1–2: Calm pace, 1 VAR check per match, clear foul calls.'}
              {currentDiv.level >= 3 && currentDiv.level <= 5 && 'Levels 3–5: Faster gameplay, player dives, tight offsides, 1 VAR check.'}
              {currentDiv.level >= 6 && 'Level 6+: No VAR, hostile crowds, players surround referee on controversial decisions.'}
            </div>
            <div className="text-slate-400">
              Promotion target after 10 matches: 650+ pts (75+ avg rating) or 800+ pts (85+ avg rating). Below 500 pts causes relegation.
            </div>
          </div>

          {/* Region Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-sm font-medium text-slate-200">{t('career_select_region')}</span>
            <select
              value={selectedRegion}
              onChange={(e) => onSelectRegion(e.target.value as RegionId | 'all')}
              className="px-3 py-2 rounded bg-slate-950 border border-slate-700 text-sm text-white"
            >
              <option value="all">{t('reg_all')}</option>
              <option value="africa">{t('reg_africa')}</option>
              <option value="asia">{t('reg_asia')}</option>
              <option value="arab">{t('reg_arab')}</option>
              <option value="europe">{t('reg_europe')}</option>
              <option value="americas">{t('reg_americas')}</option>
              <option value="australia">{t('reg_australia')}</option>
            </select>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 bg-[#080e1a] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onResetCareer}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-rose-800 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('career_reset')}</span>
          </button>

          <button
            data-gamepad-default
            onClick={onStartMatch}
            className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm cursor-pointer"
          >
            {t('career_next_match')} ({career.divisionMatchesPlayed + 1}/10)
          </button>
        </div>
      </div>
    </div>
  );
};

export const CareerStatsModal: React.FC<{
  lang: LanguageCode;
  career: CareerState;
  onClose: () => void;
}> = ({ lang, career, onClose }) => {
  const t = (k: string) => translate(lang, k);
  const s = career.stats;
  const totalCalls = s.correctDecisions + s.incorrectDecisions;
  const acc = totalCalls === 0 ? 100 : Math.round((s.correctDecisions / totalCalls) * 100);
  const currentDiv = DIVISIONS[career.currentDivisionIndex];
  const repRank = getReputationRank(career.reputation);

  return (
    <div data-gamepad-scope="career-stats" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#0b1322] border border-slate-700 rounded-xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-white">{t('stats_title')}</h2>
          <button data-gamepad-back data-gamepad-default onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricBox label={t('stats_total_matches')} value={String(s.totalMatches)} />
            <MetricBox label={t('stats_correct')} value={String(s.correctDecisions)} sub={`${acc}%`} />
            <MetricBox label={t('stats_incorrect')} value={String(s.incorrectDecisions)} />
            <MetricBox label={t('stats_yellow')} value={String(s.yellowCards)} />
            <MetricBox label={t('stats_red')} value={String(s.redCards)} />
            <MetricBox label={t('stats_penalties')} value={String(s.penaltiesAwarded)} />
            <MetricBox label={t('stats_offsides')} value={String(s.offsideDecisions)} />
            <MetricBox label={t('stats_var')} value={String(s.varChecks)} />
            <MetricBox label={t('stats_bribes')} value={String(s.bribesAccepted)} />
            <MetricBox label={t('stats_earnings')} value={`$${s.careerEarnings.toLocaleString()}`} />
            <MetricBox label={t('stats_reputation')} value={`${career.reputation}/100`} sub={t(repRank.nameKey)} />
            <MetricBox label={t('stats_division')} value={t(currentDiv.nameKey)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="text-sm font-semibold text-white">{t('stats_promotions')}</h3>
              {career.promotionHistory.length === 0 ? (
                <p className="text-xs text-slate-500">{t('stats_none')}</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {career.promotionHistory.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-800/80">
                      <span className="text-slate-300">
                        {p.fromDivision.toUpperCase()} → {p.toDivision.toUpperCase()} ({p.verdict})
                      </span>
                      <span className="font-mono-tabular text-amber-400">
                        {p.points} pts · {p.avgRating} avg
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="text-sm font-semibold text-white">{t('stats_history')}</h3>
              {career.matchHistory.length === 0 ? (
                <p className="text-xs text-slate-500">{t('stats_none')}</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {career.matchHistory.map((m) => (
                    <div key={m.matchId} className="flex justify-between text-xs py-1 border-b border-slate-800/80">
                      <span className="text-slate-200 truncate pe-2">
                        {m.homeTeam} {m.homeScore}-{m.awayScore} {m.awayTeam}
                      </span>
                      <span className="font-mono-tabular text-emerald-400 shrink-0">
                        {m.rating}/100 ({m.accuracy}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TrophyCabinetModal: React.FC<{
  lang: LanguageCode;
  unlocked: TrophyId[];
  onClose: () => void;
}> = ({ lang, unlocked, onClose }) => {
  const t = (k: string) => translate(lang, k);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = useState<TrophyId>(TROPHIES[0].id);

  useEffect(() => {
    if (!mountRef.current) return;
    const room = new TrophyRoomScene(mountRef.current, unlocked, (id) => setSelectedId(id));
    return () => room.dispose();
  }, [unlocked]);

  const selected = TROPHIES.find((x) => x.id === selectedId) || TROPHIES[0];
  const isUnlocked = unlocked.includes(selected.id);

  return (
    <div data-gamepad-scope="trophy-cabinet" className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-[#0b1322] border border-slate-700 rounded-xl overflow-hidden flex flex-col h-[86vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">{t('trophy_title')}</h2>
            <p className="text-xs text-slate-400">
              {t('trophy_subtitle')} · {unlocked.length}/8
            </p>
          </div>
          <button data-gamepad-back onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={mountRef} className="flex-1 relative min-h-[300px]" />

        <div className="px-6 py-4 border-t border-slate-800 bg-[#080e1a] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Trophy className={`w-7 h-7 ${isUnlocked ? 'text-amber-400' : 'text-slate-600'}`} />
            <div>
              <div className="text-sm font-bold text-white">
                {t(selected.nameKey)} ·{' '}
                <span className={isUnlocked ? 'text-emerald-400' : 'text-slate-500'}>
                  {isUnlocked ? t('trophy_unlocked') : t('trophy_locked')}
                </span>
              </div>
              <div className="text-xs text-slate-400">{t(selected.descKey)}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TROPHIES.map((tr, i) => {
              const u = unlocked.includes(tr.id);
              return (
                <button
                  key={tr.id}
                  onClick={() => setSelectedId(tr.id)}
                  className={`px-2.5 py-1 rounded text-xs font-mono-tabular border cursor-pointer ${
                    selectedId === tr.id
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                      : u
                      ? 'border-emerald-600/50 bg-emerald-950/50 text-emerald-300'
                      : 'border-slate-800 bg-slate-900 text-slate-500'
                  }`}
                >
                  #{i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MatchResultsModal: React.FC<{
  lang: LanguageCode;
  summary: MatchSummary;
  onContinue: () => void;
}> = ({ lang, summary, onContinue }) => {
  const t = (k: string) => translate(lang, k);
  return (
    <div data-gamepad-scope="match-results" className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#0b1322] border border-slate-700 rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">{t('res_match_title')}</h2>
            <p className="text-xs text-slate-400">
              {summary.homeTeam} {summary.homeScore} - {summary.awayScore} {summary.awayTeam} · {summary.leagueName}
            </p>
          </div>
          <div className="text-end">
            <div className="font-display text-3xl font-bold text-amber-400 tabular-nums">{summary.rating}/100</div>
            <div className="text-xs font-semibold text-emerald-400">{t(summary.ratingLabelKey)}</div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricBox label={t('hud_accuracy')} value={`${summary.accuracy}%`} sub={`${summary.correctCount}/${summary.decisions.length}`} />
            <MetricBox label={t('res_decision_pts')} value={`${summary.decisionPoints >= 0 ? '+' : ''}${summary.decisionPoints}`} />
            <MetricBox
              label={t('res_perf_bonus')}
              value={`${summary.performanceBonus >= 0 ? '+' : ''}${summary.performanceBonus}`}
              sub={`${t('res_zero_major_bonus')}: +${summary.zeroMajorErrorBonus}`}
            />
            <MetricBox
              label={t('res_total_pts')}
              value={`${summary.totalPoints >= 0 ? '+' : ''}${summary.totalPoints}`}
              sub={`${t('res_rep_change')}: ${summary.reputationDelta >= 0 ? '+' : ''}${summary.reputationDelta}`}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">{t('res_decisions_log')}</h3>
            {summary.decisions.length === 0 ? (
              <p className="text-xs text-slate-500">No major incidents recorded.</p>
            ) : (
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg bg-slate-900/50">
                {summary.decisions.map((d, idx) => (
                  <div key={idx} className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {d.correct ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span className="font-mono-tabular text-slate-400">{d.minute}&apos;</span>
                      <span className="text-slate-200 truncate">
                        {t(`inc_${d.incidentType}`)} ({d.playerName})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-400">{d.playerCalled.replace('_', ' ')}</span>
                      <span className={`font-mono-tabular font-bold ${d.pointsDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {d.pointsDelta >= 0 ? '+' : ''}
                        {d.pointsDelta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 bg-[#080e1a] flex justify-end">
          <button
            data-gamepad-default
            data-gamepad-back
            onClick={onContinue}
            className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm cursor-pointer"
          >
            {t('res_continue')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const DivisionResultsModal: React.FC<{
  lang: LanguageCode;
  result: DivisionResult;
  onContinue: () => void;
}> = ({ lang, result, onContinue }) => {
  const t = (k: string) => translate(lang, k);
  const verdictKey =
    result.verdict === 'promoted'
      ? 'div_verdict_promoted'
      : result.verdict === 'relegated'
      ? 'div_verdict_relegated'
      : result.verdict === 'world_champion'
      ? 'div_verdict_champion'
      : result.verdict === 'game_over'
      ? 'div_verdict_gameover'
      : 'div_verdict_stayed';

  return (
    <div data-gamepad-scope="division-results" className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0b1322] border border-slate-700 rounded-xl p-6 text-center space-y-5">
        <Award
          className={`w-14 h-14 mx-auto ${
            result.verdict === 'promoted' || result.verdict === 'world_champion'
              ? 'text-amber-400'
              : result.verdict === 'relegated' || result.verdict === 'game_over'
              ? 'text-rose-500'
              : 'text-sky-400'
          }`}
        />
        <div>
          <div className="text-xs text-slate-400">{t('div_res_title')}</div>
          <h2 className="font-display text-3xl font-bold text-white mt-1">{t(verdictKey)}</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 text-start">
          <MetricBox label={t('div_res_total_pts')} value={String(result.totalPoints)} />
          <MetricBox label={t('div_res_avg_rating')} value={`${result.averageRating}/100`} />
        </div>

        {result.unlockedTrophyId && (
          <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold">
            {t('div_trophy_unlocked')}: {t(`${result.unlockedTrophyId.replace('trophy_', 'trophy_')}_name`)}
          </div>
        )}

        <button
          data-gamepad-default
          data-gamepad-back
          onClick={onContinue}
          className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm cursor-pointer"
        >
          {t('res_continue')}
        </button>
      </div>
    </div>
  );
};

export const InvestigationModal: React.FC<{
  lang: LanguageCode;
  onAccept: () => void;
}> = ({ lang, onAccept }) => {
  const t = (k: string) => translate(lang, k);
  return (
    <div data-gamepad-scope="investigation" className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#140a0e] border-2 border-rose-600 rounded-xl p-6 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 mx-auto text-rose-500" />
        <div className="text-xs font-bold tracking-widest text-rose-400">{t('inv_subtitle')}</div>
        <h2 className="font-display text-3xl font-bold text-white">{t('inv_title')}</h2>
        <p className="text-sm text-slate-300 leading-relaxed">{t('inv_body')}</p>
        <button
          data-gamepad-default
          data-gamepad-back
          onClick={onAccept}
          className="w-full py-3 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold text-sm cursor-pointer"
        >
          {t('inv_continue')}
        </button>
      </div>
    </div>
  );
};

export const GameOverModal: React.FC<{
  lang: LanguageCode;
  career: CareerState;
  onRestart: () => void;
  onMainMenu: () => void;
}> = ({ lang, career, onRestart, onMainMenu }) => {
  const t = (k: string) => translate(lang, k);
  return (
    <div data-gamepad-scope="game-over" className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0b1322] border border-rose-700/70 rounded-xl p-6 text-center space-y-5">
        <h2 className="font-display text-5xl font-extrabold text-rose-500">{t('go_title')}</h2>
        <p className="text-sm text-slate-300">{t(career.gameOverReasonKey || 'go_reason_div4')}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-start">
          <MetricBox label={t('stats_total_matches')} value={String(career.stats.totalMatches)} />
          <MetricBox label={t('stats_correct')} value={String(career.stats.correctDecisions)} />
          <MetricBox label={t('stats_incorrect')} value={String(career.stats.incorrectDecisions)} />
          <MetricBox label={t('stats_yellow')} value={String(career.stats.yellowCards)} />
          <MetricBox label={t('stats_red')} value={String(career.stats.redCards)} />
          <MetricBox label={t('stats_earnings')} value={`$${career.stats.careerEarnings.toLocaleString()}`} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            data-gamepad-default
            onClick={onRestart}
            className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm cursor-pointer"
          >
            {t('go_restart')}
          </button>
          <button
            data-gamepad-back
            onClick={onMainMenu}
            className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm cursor-pointer"
          >
            {t('go_main_menu')}
          </button>
        </div>
      </div>
    </div>
  );
};

const MetricBox: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className="p-3 rounded-lg bg-slate-900/75 border border-slate-800">
    <div className="text-[11px] text-slate-400 truncate">{label}</div>
    <div className="font-display text-2xl font-bold text-white tabular-nums mt-0.5">{value}</div>
    {sub && <div className="text-[11px] text-emerald-400 truncate mt-0.5">{sub}</div>}
  </div>
);
