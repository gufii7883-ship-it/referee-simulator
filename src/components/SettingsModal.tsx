import React, { useState } from 'react';
import {
  DifficultyOption,
  GameSettings,
  GraphicsQuality,
  LanguageCode,
} from '../types/game';
import { LANGUAGES, translate } from '../i18n/translations';
import { createDefaultSettings } from '../game/CareerEngine';
import { inputManager } from '../input/InputManager';
import {
  Accessibility,
  Check,
  Gamepad2,
  Globe,
  Monitor,
  RotateCcw,
  Sliders,
  User,
  Volume2,
  X,
} from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdate: (next: GameSettings) => void;
  onClose: () => void;
}

type CategoryId =
  | 'general'
  | 'language'
  | 'graphics'
  | 'audio'
  | 'gameplay'
  | 'controls'
  | 'accessibility'
  | 'account';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdate,
  onClose,
}) => {
  const [draft, setDraft] = useState<GameSettings>(() => structuredClone(settings));
  const [cat, setCat] = useState<CategoryId>('language');
  const [remappingKey, setRemappingKey] = useState<keyof GameSettings['controls']['keybindings'] | null>(null);
  const [confirmApply, setConfirmApply] = useState(false);

  const lang = draft.language;
  const t = (k: string) => translate(lang, k);

  const applyInstant = (updated: GameSettings) => {
    setDraft(updated);
    onUpdate(updated);
  };

  const handleLanguageSelect = (code: LanguageCode) => {
    const next = { ...draft, language: code };
    applyInstant(next);
  };

  const handleRestoreDefaults = () => {
    const def = createDefaultSettings();
    def.language = draft.language;
    applyInstant(def);
  };

  const handleApplyChanges = () => {
    if (draft.graphics.fullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else if (!draft.graphics.fullscreen && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    onUpdate(draft);
    setConfirmApply(false);
    onClose();
  };

  const startKeyCapture = (keyName: keyof GameSettings['controls']['keybindings']) => {
    setRemappingKey(keyName);
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const next = {
        ...draft,
        controls: {
          ...draft.controls,
          keybindings: {
            ...draft.controls.keybindings,
            [keyName]: e.code,
          },
        },
      };
      applyInstant(next);
      setRemappingKey(null);
      window.removeEventListener('keydown', handler, true);
    };
    window.addEventListener('keydown', handler, true);
  };

  const categories: Array<{ id: CategoryId; label: string; icon: React.ReactNode }> = [
    { id: 'general', label: t('set_cat_general'), icon: <Sliders className="w-4 h-4" /> },
    { id: 'language', label: t('set_cat_language'), icon: <Globe className="w-4 h-4" /> },
    { id: 'graphics', label: t('set_cat_graphics'), icon: <Monitor className="w-4 h-4" /> },
    { id: 'audio', label: t('set_cat_audio'), icon: <Volume2 className="w-4 h-4" /> },
    { id: 'gameplay', label: t('set_cat_gameplay'), icon: <Sliders className="w-4 h-4" /> },
    { id: 'controls', label: t('set_cat_controls'), icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'accessibility', label: t('set_cat_accessibility'), icon: <Accessibility className="w-4 h-4" /> },
    { id: 'account', label: t('set_cat_account'), icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div data-gamepad-scope="settings" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-5xl h-[88vh] bg-[#0b1322] border border-slate-700 rounded-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="font-display text-2xl font-bold text-white tracking-wide">{t('set_title')}</h2>
            <p className="text-xs text-slate-400">{t('set_saved')}</p>
          </div>
          <button
            data-gamepad-back
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two-Pane Layout */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Left Category Sidebar */}
          <aside className="w-full md:w-60 border-b md:border-b-0 md:border-e border-slate-800 p-3 flex md:flex-col gap-1 overflow-x-auto">
            {categories.map((c) => (
              <button
                key={c.id}
                data-gamepad-tab
                data-gamepad-tab-active={cat === c.id ? 'true' : 'false'}
                data-gamepad-default={cat === c.id ? 'true' : undefined}
                onClick={() => setCat(c.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  cat === c.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                {c.icon}
                <span>{c.label}</span>
              </button>
            ))}
          </aside>

          {/* Right Settings Panel */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5">
            {cat === 'general' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{t('set_cat_general')}</h3>
                <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{t('mp_your_name')}</span>
                    <input
                      type="text"
                      value={draft.playerName}
                      onChange={(e) => applyInstant({ ...draft, playerName: e.target.value })}
                      className="px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-sm text-white w-52"
                    />
                  </div>
                  <ToggleRow
                    label={t('set_tutorial')}
                    checked={draft.gameplay.tutorial}
                    onChange={(v) =>
                      applyInstant({ ...draft, gameplay: { ...draft.gameplay, tutorial: v } })
                    }
                  />
                </div>
              </div>
            )}

            {cat === 'language' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{t('set_cat_language')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {LANGUAGES.map((l) => {
                    const active = draft.language === l.code;
                    return (
                      <button
                        key={l.code}
                        onClick={() => handleLanguageSelect(l.code)}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border text-start cursor-pointer transition-colors ${
                          active
                            ? 'bg-emerald-600/20 border-emerald-500 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{l.flag}</span>
                          <div>
                            <div className="text-sm font-semibold">{l.nativeName}</div>
                            <div className="text-xs text-slate-400">{l.englishName}</div>
                          </div>
                        </div>
                        {active && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {cat === 'graphics' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{t('set_cat_graphics')}</h3>
                <div className="space-y-3 p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                  <SelectRow
                    label={t('set_quality')}
                    value={draft.graphics.quality}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                      { value: 'ultra', label: 'Ultra' },
                    ]}
                    onChange={(v) => {
                      const q = v as GraphicsQuality;
                      applyInstant({
                        ...draft,
                        graphics: {
                          ...draft.graphics,
                          quality: q,
                          shadowQuality: q === 'low' ? 'off' : q === 'medium' ? 'low' : 'high',
                          crowdDetail: q === 'low' ? 'low' : q === 'medium' ? 'medium' : 'high',
                          resolutionScale: q === 'low' ? 0.65 : q === 'medium' ? 0.85 : 1.0,
                        },
                      });
                    }}
                  />
                  <SelectRow
                    label={t('set_shadows')}
                    value={draft.graphics.shadowQuality}
                    options={[
                      { value: 'off', label: 'Off' },
                      { value: 'low', label: 'Low' },
                      { value: 'high', label: 'High' },
                    ]}
                    onChange={(v) =>
                      applyInstant({
                        ...draft,
                        graphics: { ...draft.graphics, shadowQuality: v as 'off' | 'low' | 'high' },
                      })
                    }
                  />
                  <SelectRow
                    label={t('set_textures')}
                    value={draft.graphics.textureQuality}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'high', label: 'High' },
                    ]}
                    onChange={(v) =>
                      applyInstant({
                        ...draft,
                        graphics: { ...draft.graphics, textureQuality: v as 'low' | 'high' },
                      })
                    }
                  />
                  <SelectRow
                    label={t('set_crowd_detail')}
                    value={draft.graphics.crowdDetail}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                    ]}
                    onChange={(v) =>
                      applyInstant({
                        ...draft,
                        graphics: { ...draft.graphics, crowdDetail: v as 'low' | 'medium' | 'high' },
                      })
                    }
                  />
                  <SelectRow
                    label={t('set_fps')}
                    value={String(draft.graphics.fpsLimit)}
                    options={[
                      { value: '30', label: '30 FPS' },
                      { value: '60', label: '60 FPS' },
                      { value: '90', label: '90 FPS' },
                      { value: '120', label: '120 FPS' },
                      { value: '0', label: 'Unlimited' },
                    ]}
                    onChange={(v) =>
                      applyInstant({
                        ...draft,
                        graphics: { ...draft.graphics, fpsLimit: Number(v) as 30 | 60 | 90 | 120 | 0 },
                      })
                    }
                  />
                  <SliderRow
                    label={t('set_res_scale')}
                    value={draft.graphics.resolutionScale}
                    min={0.5}
                    max={1.0}
                    step={0.05}
                    display={`${Math.round(draft.graphics.resolutionScale * 100)}%`}
                    onChange={(v) =>
                      applyInstant({ ...draft, graphics: { ...draft.graphics, resolutionScale: v } })
                    }
                  />
                  <ToggleRow
                    label={t('set_aa')}
                    checked={draft.graphics.antiAliasing}
                    onChange={(v) =>
                      applyInstant({ ...draft, graphics: { ...draft.graphics, antiAliasing: v } })
                    }
                  />
                  <ToggleRow
                    label={t('set_vsync')}
                    checked={draft.graphics.vsync}
                    onChange={(v) =>
                      applyInstant({ ...draft, graphics: { ...draft.graphics, vsync: v } })
                    }
                  />
                  <ToggleRow
                    label={t('set_motion_blur')}
                    checked={draft.graphics.motionBlur}
                    onChange={(v) =>
                      applyInstant({ ...draft, graphics: { ...draft.graphics, motionBlur: v } })
                    }
                  />
                  <ToggleRow
                    label={t('set_fullscreen')}
                    checked={draft.graphics.fullscreen}
                    onChange={(v) =>
                      setDraft({ ...draft, graphics: { ...draft.graphics, fullscreen: v } })
                    }
                  />
                </div>
              </div>
            )}

            {cat === 'audio' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{t('set_cat_audio')}</h3>
                <div className="space-y-3 p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                  <ToggleRow
                    label={t('set_mute_all')}
                    checked={draft.audio.muteAll}
                    onChange={(v) => applyInstant({ ...draft, audio: { ...draft.audio, muteAll: v } })}
                  />
                  <ToggleRow
                    label={t('set_bg_music')}
                    checked={draft.audio.musicEnabled}
                    onChange={(v) =>
                      applyInstant({ ...draft, audio: { ...draft.audio, musicEnabled: v } })
                    }
                  />
                  <ToggleRow
                    label={t('set_crowd_sounds')}
                    checked={draft.audio.crowdEnabled}
                    onChange={(v) =>
                      applyInstant({ ...draft, audio: { ...draft.audio, crowdEnabled: v } })
                    }
                  />
                  <SliderRow
                    label={t('set_master_vol')}
                    value={draft.audio.master}
                    min={0}
                    max={1}
                    step={0.05}
                    display={`${Math.round(draft.audio.master * 100)}%`}
                    onChange={(v) => applyInstant({ ...draft, audio: { ...draft.audio, master: v } })}
                  />
                  <SliderRow
                    label={t('set_crowd_vol')}
                    value={draft.audio.crowd}
                    min={0}
                    max={1}
                    step={0.05}
                    display={`${Math.round(draft.audio.crowd * 100)}%`}
                    onChange={(v) => applyInstant({ ...draft, audio: { ...draft.audio, crowd: v } })}
                  />
                  <SliderRow
                    label={t('set_whistle_vol')}
                    value={draft.audio.whistle}
                    min={0}
                    max={1}
                    step={0.05}
                    display={`${Math.round(draft.audio.whistle * 100)}%`}
                    onChange={(v) => applyInstant({ ...draft, audio: { ...draft.audio, whistle: v } })}
                  />
                  <SliderRow
                    label={t('set_music_vol')}
                    value={draft.audio.music}
                    min={0}
                    max={1}
                    step={0.05}
                    display={`${Math.round(draft.audio.music * 100)}%`}
                    onChange={(v) => applyInstant({ ...draft, audio: { ...draft.audio, music: v } })}
                  />
                  <SliderRow
                    label={t('set_comm_vol')}
                    value={draft.audio.commentary}
                    min={0}
                    max={1}
                    step={0.05}
                    display={`${Math.round(draft.audio.commentary * 100)}%`}
                    onChange={(v) =>
                      applyInstant({ ...draft, audio: { ...draft.audio, commentary: v } })
                    }
                  />
                  <SliderRow
                    label={t('set_sfx_vol')}
                    value={draft.audio.sfx}
                    min={0}
                    max={1}
                    step={0.05}
                    display={`${Math.round(draft.audio.sfx * 100)}%`}
                    onChange={(v) => applyInstant({ ...draft, audio: { ...draft.audio, sfx: v } })}
                  />
                </div>
              </div>
            )}

            {cat === 'gameplay' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{t('set_cat_gameplay')}</h3>
                <div className="space-y-3 p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                  <SelectRow
                    label={t('set_difficulty')}
                    value={draft.gameplay.difficulty}
                    options={[
                      { value: 'easy', label: 'Easy' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'hard', label: 'Hard' },
                      { value: 'realistic', label: 'Realistic' },
                    ]}
                    onChange={(v) =>
                      applyInstant({
                        ...draft,
                        gameplay: { ...draft.gameplay, difficulty: v as DifficultyOption },
                      })
                    }
                  />
                  <SelectRow
                    label={t('set_match_len')}
                    value={String(draft.gameplay.matchLengthSeconds)}
                    options={[
                      { value: '90', label: 'Fast (90s)' },
                      { value: '150', label: 'Standard (2m 30s)' },
                      { value: '240', label: 'Extended (4m)' },
                    ]}
                    onChange={(v) =>
                      applyInstant({
                        ...draft,
                        gameplay: {
                          ...draft.gameplay,
                          matchLengthSeconds: Number(v) as 90 | 150 | 240,
                        },
                      })
                    }
                  />
                  <SliderRow
                    label={t('set_cam_dist')}
                    value={draft.gameplay.cameraDistance}
                    min={6}
                    max={16}
                    step={0.5}
                    display={`${draft.gameplay.cameraDistance}m`}
                    onChange={(v) =>
                      applyInstant({ ...draft, gameplay: { ...draft.gameplay, cameraDistance: v } })
                    }
                  />
                  <SliderRow
                    label={t('set_cam_sens')}
                    value={draft.gameplay.cameraSensitivity}
                    min={0.3}
                    max={2.5}
                    step={0.1}
                    display={`${draft.gameplay.cameraSensitivity.toFixed(1)}x`}
                    onChange={(v) =>
                      applyInstant({ ...draft, gameplay: { ...draft.gameplay, cameraSensitivity: v } })
                    }
                  />
                  <ToggleRow
                    label={t('set_auto_replay')}
                    checked={draft.gameplay.autoReplay}
                    onChange={(v) =>
                      applyInstant({ ...draft, gameplay: { ...draft.gameplay, autoReplay: v } })
                    }
                  />
                  <ToggleRow
                    label={t('set_var_assist')}
                    checked={draft.gameplay.varAssistance}
                    onChange={(v) =>
                      applyInstant({ ...draft, gameplay: { ...draft.gameplay, varAssistance: v } })
                    }
                  />
                  <ToggleRow
                    label={t('set_hints')}
                    checked={draft.gameplay.showDecisionHints}
                    onChange={(v) =>
                      applyInstant({
                        ...draft,
                        gameplay: { ...draft.gameplay, showDecisionHints: v },
                      })
                    }
                  />
                  <ToggleRow
                    label={t('set_subtitles')}
                    checked={draft.gameplay.subtitles}
                    onChange={(v) =>
                      applyInstant({ ...draft, gameplay: { ...draft.gameplay, subtitles: v } })
                    }
                  />
                </div>
              </div>
            )}

            {cat === 'controls' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{t('set_cat_controls')}</h3>
                <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                    <span>PlayStation / Gamepad Status:</span>
                    <span className={inputManager.playstationConnected ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                      {inputManager.playstationConnected
                        ? inputManager.connectedGamepadName
                        : 'No controller detected (Plug USB or pair Bluetooth DualSense / DS4)'}
                    </span>
                  </div>

                  <SelectRow
                    label={t('set_input_profile')}
                    value={draft.controls.activeProfile}
                    options={[
                      { value: 'keyboard', label: 'Keyboard & Mouse' },
                      { value: 'playstation', label: 'PlayStation Controller (DS4 / DualSense)' },
                      { value: 'mobile', label: 'Mobile Touch Controls' },
                    ]}
                    onChange={(v) =>
                      applyInstant({
                        ...draft,
                        controls: {
                          ...draft.controls,
                          activeProfile: v as 'keyboard' | 'playstation' | 'mobile',
                        },
                      })
                    }
                  />

                  <ToggleRow
                    label={t('set_vibration')}
                    checked={draft.controls.controllerVibration}
                    onChange={(v) =>
                      applyInstant({
                        ...draft,
                        controls: { ...draft.controls, controllerVibration: v },
                      })
                    }
                  />

                  <SliderRow
                    label={t('set_joy_sens')}
                    value={draft.controls.joystickSensitivity}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    display={`${draft.controls.joystickSensitivity.toFixed(1)}x`}
                    onChange={(v) =>
                      applyInstant({
                        ...draft,
                        controls: { ...draft.controls, joystickSensitivity: v },
                      })
                    }
                  />

                  <SliderRow
                    label={t('set_deadzone')}
                    value={draft.controls.deadzone}
                    min={0.05}
                    max={0.4}
                    step={0.02}
                    display={`${Math.round(draft.controls.deadzone * 100)}%`}
                    onChange={(v) =>
                      applyInstant({ ...draft, controls: { ...draft.controls, deadzone: v } })
                    }
                  />

                  <SliderRow
                    label={t('set_mobile_scale')}
                    value={draft.controls.mobileButtonScale}
                    min={0.8}
                    max={1.35}
                    step={0.05}
                    display={`${Math.round(draft.controls.mobileButtonScale * 100)}%`}
                    onChange={(v) =>
                      applyInstant({
                        ...draft,
                        controls: { ...draft.controls, mobileButtonScale: v },
                      })
                    }
                  />

                  {/* Key Remapping Table */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-xs font-semibold text-slate-300">Keyboard Button Remapping</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(
                        [
                          ['foul', t('dec_foul'), '□ Square'],
                          ['yellowCard', t('dec_yellow'), '△ Triangle'],
                          ['redCard', t('dec_red'), 'L1'],
                          ['penalty', t('dec_penalty'), 'R1'],
                          ['offside', t('dec_offside'), 'D-Pad ↑'],
                          ['noFoul', t('dec_no_foul'), 'D-Pad ↓'],
                          ['varCheck', t('dec_var'), 'D-Pad ←'],
                          ['replay', t('dec_replay'), 'D-Pad →'],
                          ['bribe', t('bribe_accept'), '✕ Cross'],
                        ] as const
                      ).map(([k, label, psLabel]) => (
                        <div
                          key={k}
                          className="flex items-center justify-between px-3 py-2 rounded bg-slate-950 border border-slate-800 text-xs"
                        >
                          <div>
                            <div className="text-slate-200 font-medium">{label}</div>
                            <div className="text-[11px] text-slate-500">PS: {psLabel}</div>
                          </div>
                          <button
                            onClick={() => startKeyCapture(k)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 font-mono-tabular text-amber-300 cursor-pointer"
                          >
                            {remappingKey === k ? 'Press key...' : draft.controls.keybindings[k]}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {cat === 'accessibility' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{t('set_cat_accessibility')}</h3>
                <div className="space-y-3 p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                  <SelectRow
                    label={t('set_sub_size')}
                    value={draft.accessibility.subtitleSize}
                    options={[
                      { value: 'small', label: 'Small' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'large', label: 'Large' },
                    ]}
                    onChange={(v) =>
                      applyInstant({
                        ...draft,
                        accessibility: {
                          ...draft.accessibility,
                          subtitleSize: v as 'small' | 'medium' | 'large',
                        },
                      })
                    }
                  />
                  <SliderRow
                    label={t('set_ui_scale')}
                    value={draft.accessibility.uiScale}
                    min={0.85}
                    max={1.2}
                    step={0.05}
                    display={`${Math.round(draft.accessibility.uiScale * 100)}%`}
                    onChange={(v) =>
                      applyInstant({ ...draft, accessibility: { ...draft.accessibility, uiScale: v } })
                    }
                  />
                  <ToggleRow
                    label={t('set_colorblind')}
                    checked={draft.accessibility.colorblindMode}
                    onChange={(v) =>
                      applyInstant({
                        ...draft,
                        accessibility: { ...draft.accessibility, colorblindMode: v },
                      })
                    }
                  />
                  <ToggleRow
                    label={t('set_high_contrast')}
                    checked={draft.accessibility.highContrast}
                    onChange={(v) =>
                      applyInstant({
                        ...draft,
                        accessibility: { ...draft.accessibility, highContrast: v },
                      })
                    }
                  />
                  <ToggleRow
                    label={t('set_reduced_shake')}
                    checked={draft.accessibility.reducedCameraShake}
                    onChange={(v) =>
                      applyInstant({
                        ...draft,
                        accessibility: { ...draft.accessibility, reducedCameraShake: v },
                      })
                    }
                  />
                  <ToggleRow
                    label={t('set_reduced_motion')}
                    checked={draft.accessibility.reducedMotion}
                    onChange={(v) =>
                      applyInstant({
                        ...draft,
                        accessibility: { ...draft.accessibility, reducedMotion: v },
                      })
                    }
                  />
                </div>
              </div>
            )}

            {cat === 'account' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{t('set_cat_account')}</h3>
                <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>{t('mp_your_name')}</span>
                    <input
                      type="text"
                      value={draft.playerName}
                      onChange={(e) => applyInstant({ ...draft, playerName: e.target.value })}
                      className="px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-sm text-white w-52"
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    Your interface language stays independent from your partner&apos;s language during Friend Referee Mode sessions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#080e1a] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleRestoreDefaults}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('set_defaults')}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              {t('set_back')}
            </button>
            <button
              onClick={() => setConfirmApply(true)}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
            >
              {t('set_apply')}
            </button>
          </div>
        </div>

        {confirmApply && (
          <div data-gamepad-scope="settings-confirm" className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="max-w-sm w-full rounded-xl bg-[#0d1626] border border-slate-700 p-5 space-y-4">
              <p className="text-sm text-slate-200">{t('set_confirm_important')}</p>
              <div className="flex justify-end gap-2">
                <button
                  data-gamepad-back
                  onClick={() => setConfirmApply(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-xs text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  data-gamepad-default
                  onClick={handleApplyChanges}
                  className="px-4 py-1.5 rounded bg-emerald-600 text-xs font-semibold text-white cursor-pointer"
                >
                  {t('set_apply')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ToggleRow: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({
  label,
  checked,
  onChange,
}) => (
  <label className="flex items-center justify-between gap-4 py-1 cursor-pointer">
    <span className="text-sm text-slate-200">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
        checked ? 'bg-emerald-600' : 'bg-slate-700'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </label>
);

const SliderRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step, display, onChange }) => (
  <div className="flex items-center justify-between gap-4 py-1">
    <span className="text-sm text-slate-200">{label}</span>
    <div className="flex items-center gap-3 w-52">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-emerald-500 cursor-pointer"
      />
      <span className="w-12 text-end font-mono-tabular text-xs text-slate-300">{display}</span>
    </div>
  </div>
);

const SelectRow: React.FC<{
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div className="flex items-center justify-between gap-4 py-1">
    <span className="text-sm text-slate-200">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100 w-52"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);
