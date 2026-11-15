import React, { useEffect, useState } from 'react';
import {
  FriendModeVariant,
  LanguageCode,
  MultiplayerRole,
  MultiplayerRoomState,
} from '../types/game';
import { translate } from '../i18n/translations';
import { mpClient } from '../net/MultiplayerClient';
import { generateFixtureForDivision, GeneratedMatchFixture } from '../data/leagues';
import { Copy, Mic, MicOff, Radio, Tv, Users, X } from 'lucide-react';

interface FriendModeModalProps {
  lang: LanguageCode;
  playerName: string;
  onMatchStarted: (fixture: GeneratedMatchFixture, role: MultiplayerRole, roomCode: string) => void;
  onClose: () => void;
}

const ROLE_SLOTS: Record<FriendModeVariant, MultiplayerRole[]> = {
  '2_refs': ['main_referee', 'var_referee'],
  '3_refs': ['main_referee', 'assistant_referee_1', 'assistant_referee_2'],
  '4_refs': ['main_referee', 'assistant_referee_1', 'assistant_referee_2', 'var_referee'],
};

export const FriendModeModal: React.FC<FriendModeModalProps> = ({
  lang,
  playerName,
  onMatchStarted,
  onClose,
}) => {
  const t = (k: string, vars?: Record<string, string | number>) => translate(lang, k, vars);
  const [name, setName] = useState(playerName || 'Referee');
  const [selectedMode, setSelectedMode] = useState<FriendModeVariant>('2_refs');
  const [joinCode, setJoinCode] = useState('');
  const [room, setRoom] = useState<MultiplayerRoomState | null>(mpClient.roomState);
  const [myRole, setMyRole] = useState<MultiplayerRole | null>(mpClient.role);
  const [errorMsg, setErrorMsg] = useState('');
  const [voiceActive, setVoiceActive] = useState(mpClient.voiceEnabled);
  const [micMuted, setMicMuted] = useState(mpClient.micMuted);
  const [copied, setCopied] = useState(false);

  const pendingFixtureRef = React.useRef<GeneratedMatchFixture | null>(null);

  useEffect(() => {
    const unsub = mpClient.onMessage((msg) => {
      if (msg.type === 'joined') {
        setMyRole(msg.role);
        setErrorMsg('');
        if (msg.fixture) pendingFixtureRef.current = msg.fixture;
      } else if (msg.type === 'room_update') {
        setRoom(msg.room);
      } else if (msg.type === 'error') {
        setErrorMsg(String(msg.message || 'Connection error'));
      } else if (msg.type === 'match_started') {
        const fx = msg.fixture || pendingFixtureRef.current || generateFixtureForDivision('premier');
        onMatchStarted(fx, mpClient.role || 'main_referee', mpClient.roomCode || '');
      }
    });
    return unsub;
  }, [onMatchStarted]);

  const roleLabel = (role: MultiplayerRole) => {
    if (role === 'main_referee') return t('mp_role_main');
    if (role === 'assistant_referee_1') return t('mp_role_linesman_1');
    if (role === 'assistant_referee_2') return t('mp_role_linesman_2');
    return t('mp_role_var');
  };

  const handleCreate = async () => {
    try {
      setErrorMsg('');
      const fx = generateFixtureForDivision('premier');
      pendingFixtureRef.current = fx;
      await mpClient.createRoom(name, fx, selectedMode);
    } catch {
      setErrorMsg('Unable to connect to multiplayer server.');
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    try {
      setErrorMsg('');
      await mpClient.joinRoom(name, joinCode);
    } catch {
      setErrorMsg('Unable to join room.');
    }
  };

  const handleVoice = async () => {
    if (!voiceActive) {
      const ok = await mpClient.enableVoiceChat();
      if (ok) {
        setVoiceActive(true);
        setMicMuted(false);
      } else {
        setErrorMsg('Microphone permission denied or unavailable.');
      }
    } else {
      const muted = mpClient.toggleMute();
      setMicMuted(muted);
    }
  };

  const handleStart = () => {
    const fx = pendingFixtureRef.current || generateFixtureForDivision('premier');
    mpClient.startMatch(fx);
  };

  const handleCopy = () => {
    if (!room) return;
    navigator.clipboard?.writeText(room.roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const activeSlots = room ? ROLE_SLOTS[room.mode] || ROLE_SLOTS['2_refs'] : [];

  return (
    <div data-gamepad-scope="friend-lobby" className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0b1322] border border-slate-700 rounded-xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">{t('mp_title')}</h2>
            <p className="text-xs text-slate-400">{t('mp_subtitle')}</p>
          </div>
          <button
            data-gamepad-back
            onClick={() => {
              if (room) mpClient.leaveRoom();
              onClose();
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {errorMsg && (
            <div className="px-4 py-2.5 rounded-lg bg-rose-950/80 border border-rose-600 text-xs text-rose-200">
              {errorMsg}
            </div>
          )}

          {!room ? (
            <div className="space-y-5">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">{t('mp_your_name')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
                />
              </div>

              {/* Crew Variant Selector: 2 Friends / 3 Friends / 4 Friends */}
              <div className="space-y-2">
                <label className="block text-xs text-slate-400">{t('mp_mode_label')}</label>
                <div className="grid grid-cols-1 gap-2">
                  {(['2_refs', '3_refs', '4_refs'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMode(m)}
                      className={`px-4 py-3 rounded-lg border text-start text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                        selectedMode === m
                          ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                          : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {m === '2_refs' ? (
                          <Tv className="w-4 h-4 text-sky-400 shrink-0" />
                        ) : (
                          <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <span>
                          {m === '2_refs'
                            ? t('mp_mode_2')
                            : m === '3_refs'
                            ? t('mp_mode_3')
                            : t('mp_mode_4')}
                        </span>
                      </span>
                      <span className="font-mono-tabular text-[11px] px-2 py-0.5 rounded bg-black/30 text-amber-300">
                        {m === '2_refs' ? '2P' : m === '3_refs' ? '3P' : '4P'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 flex flex-col justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white">{t('mp_create_room')}</div>
                    <div className="text-xs text-slate-400">{t('mp_role_main')}</div>
                  </div>
                  <button
                    data-gamepad-default
                    onClick={handleCreate}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm cursor-pointer"
                  >
                    {t('mp_create_room')}
                  </button>
                </div>

                <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white">{t('mp_join_room')}</div>
                    <div className="text-xs text-slate-400">{t('mp_enter_code')}</div>
                  </div>
                  <input
                    type="text"
                    value={joinCode}
                    maxLength={6}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 font-mono-tabular text-center tracking-widest text-sm text-amber-300 uppercase"
                  />
                  <button
                    onClick={handleJoin}
                    disabled={joinCode.trim().length < 4}
                    className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold text-sm cursor-pointer"
                  >
                    {t('mp_join_room')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Room Code Banner */}
              <div className="p-4 rounded-lg bg-slate-900/90 border border-emerald-500/50 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-400">
                    {t('mp_room_code')} ·{' '}
                    <span className="text-emerald-400 font-semibold">
                      {t('mp_waiting_team', {
                        count: room.participants.length,
                        max: room.maxParticipants || activeSlots.length,
                      })}
                    </span>
                  </div>
                  <div className="font-mono-tabular text-3xl font-extrabold text-amber-400 tracking-widest">
                    {room.roomCode}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleVoice}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                      voiceActive && !micMuted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {voiceActive && !micMuted ? (
                      <Mic className="w-3.5 h-3.5" />
                    ) : (
                      <MicOff className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {!voiceActive
                        ? t('mp_voice_enable')
                        : micMuted
                        ? t('mp_voice_unmute')
                        : t('mp_voice_mute')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Crew Role Slots List */}
              <div className="space-y-2">
                {activeSlots.map((slotRole) => {
                  const participant = room.participants.find((p) => p.role === slotRole);
                  return (
                    <div
                      key={slotRole}
                      className={`px-4 py-3 rounded-lg border flex items-center justify-between text-xs ${
                        participant
                          ? 'bg-slate-900/75 border-emerald-500/40'
                          : 'bg-slate-950/60 border-slate-800/80 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {slotRole === 'var_referee' ? (
                          <Tv className="w-4 h-4 text-sky-400 shrink-0" />
                        ) : (
                          <Users
                            className={`w-4 h-4 shrink-0 ${
                              participant ? 'text-emerald-400' : 'text-slate-600'
                            }`}
                          />
                        )}
                        <div>
                          <div className="text-sm font-bold text-white">
                            {participant ? participant.name : '...'}
                          </div>
                          <div className="text-slate-400">{roleLabel(slotRole)}</div>
                        </div>
                      </div>
                      {participant ? (
                        <div className="flex items-center gap-2 text-slate-300">
                          <Radio className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{participant.micMuted ? 'Muted' : t('mp_voice_active')}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-400/90 font-semibold">Waiting...</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {room.participants.length < (room.maxParticipants || activeSlots.length) ? (
                <div className="text-center text-xs text-amber-300 py-1">
                  {t('mp_waiting_partner')}
                </div>
              ) : (
                <div className="text-center text-xs text-emerald-400 font-semibold py-1">
                  {t('mp_partner_connected')}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => {
                    mpClient.leaveRoom();
                    setRoom(null);
                  }}
                  className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-rose-800 text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  {t('mp_leave_room')}
                </button>

                {myRole === 'main_referee' && (
                  <button
                    onClick={handleStart}
                    className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm cursor-pointer"
                  >
                    {t('mp_start_match')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
