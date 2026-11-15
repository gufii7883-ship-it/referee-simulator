import { GameSettings, InputPromptDevice } from '../types/game';

export type UnifiedAction =
  | 'foul'
  | 'yellow_card'
  | 'red_card'
  | 'penalty'
  | 'offside'
  | 'no_foul'
  | 'var_check'
  | 'replay'
  | 'bribe_accept'
  | 'bribe_reject'
  | 'confirm'
  | 'cancel'
  | 'pause'
  | 'stats_toggle'
  | 'focus_incident'
  | 'nav_up'
  | 'nav_down'
  | 'nav_left'
  | 'nav_right'
  | 'tab_prev'
  | 'tab_next';

export interface MovementVector {
  moveX: number; // -1..1
  moveY: number; // -1..1 (forward = +1)
  lookX: number; // delta yaw
  lookY: number; // delta pitch
  sprint: boolean;
  precision: boolean;
}

class UnifiedInputManager {
  private keysDown = new Set<string>();
  private prevGamepadButtons = new Map<number, boolean>();
  private actionListeners = new Set<(action: UnifiedAction) => void>();
  private deviceListeners = new Set<(device: InputPromptDevice) => void>();

  public activeDevice: InputPromptDevice = 'keyboard';
  public playstationConnected = false;
  public connectedGamepadName = '';

  // Mobile virtual joystick state
  public virtualMove = { x: 0, y: 0 };
  public virtualSprint = false;
  public virtualLookDelta = { x: 0, y: 0 };

  private menuMode = true;
  private menuRafId = 0;
  private navHeld = new Map<string, boolean>();
  private navNextRepeatAt = new Map<string, number>();

  private settings: GameSettings['controls'] = {
    activeProfile: 'keyboard',
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
  };

  private initialized = false;

  public init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch && window.innerWidth < 960) {
      this.setDevice('mobile');
    }

    const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    if (pads.length > 0 && pads[0]) {
      this.connectedGamepadName = pads[0].id;
      this.playstationConnected = true;
      this.setDevice('playstation');
    }

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);

    if (this.menuMode) {
      this.startMenuLoop();
    }
  }

  public dispose() {
    if (!this.initialized || typeof window === 'undefined') return;
    this.initialized = false;
    this.stopMenuLoop();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('gamepadconnected', this.onGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.onGamepadDisconnected);
  }

  public setMenuMode(enabled: boolean) {
    if (this.menuMode === enabled) {
      if (enabled && this.initialized && this.menuRafId === 0) {
        this.startMenuLoop();
      }
      return;
    }
    this.menuMode = enabled;
    this.snapshotGamepadButtons();
    this.navHeld.clear();
    this.navNextRepeatAt.clear();

    if (enabled && this.initialized) {
      this.startMenuLoop();
    } else {
      this.stopMenuLoop();
    }
  }

  private snapshotGamepadButtons() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    const pad = pads[0] || pads[1] || pads[2] || pads[3];
    this.prevGamepadButtons.clear();
    if (!pad) return;
    for (let i = 0; i < pad.buttons.length; i++) {
      this.prevGamepadButtons.set(i, Boolean(pad.buttons[i]?.pressed));
    }
  }

  private startMenuLoop() {
    if (this.menuRafId !== 0 || typeof window === 'undefined') return;
    const tick = () => {
      if (!this.initialized || !this.menuMode) {
        this.menuRafId = 0;
        return;
      }
      this.pollMenuGamepad();
      this.menuRafId = window.requestAnimationFrame(tick);
    };
    this.menuRafId = window.requestAnimationFrame(tick);
  }

  private stopMenuLoop() {
    if (this.menuRafId !== 0 && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.menuRafId);
      this.menuRafId = 0;
    }
  }

  private pollMenuGamepad() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    const pad = pads[0] || pads[1] || pads[2] || pads[3];
    if (!pad) return;

    if (!this.playstationConnected) {
      this.playstationConnected = true;
      this.connectedGamepadName = pad.id;
    }

    const now = performance.now();
    const stickDeadzone = Math.max(0.45, this.settings.deadzone + 0.15);
    const ax = pad.axes[0] || 0;
    const ay = pad.axes[1] || 0;

    const dirs: Array<[string, boolean, UnifiedAction]> = [
      ['up', Boolean(pad.buttons[12]?.pressed) || ay < -stickDeadzone, 'nav_up'],
      ['down', Boolean(pad.buttons[13]?.pressed) || ay > stickDeadzone, 'nav_down'],
      ['left', Boolean(pad.buttons[14]?.pressed) || ax < -stickDeadzone, 'nav_left'],
      ['right', Boolean(pad.buttons[15]?.pressed) || ax > stickDeadzone, 'nav_right'],
    ];

    for (const [key, active, action] of dirs) {
      if (!active) {
        this.navHeld.set(key, false);
        this.navNextRepeatAt.delete(key);
        continue;
      }

      const wasHeld = this.navHeld.get(key) || false;
      if (!wasHeld) {
        this.navHeld.set(key, true);
        this.navNextRepeatAt.set(key, now + 330);
        this.setDevice('playstation');
        this.emitAction(action);
      } else {
        const nextAt = this.navNextRepeatAt.get(key) || 0;
        if (now >= nextAt) {
          this.navNextRepeatAt.set(key, now + 135);
          this.setDevice('playstation');
          this.emitAction(action);
        }
      }
    }

    const buttonMap: Array<[number, UnifiedAction]> = [
      [0, 'confirm'], // Cross (✕)
      [1, 'cancel'], // Circle (○)
      [4, 'tab_prev'], // L1
      [5, 'tab_next'], // R1
      [8, 'pause'], // Share / Select
      [9, 'pause'], // Options / Start
    ];

    for (const [idx, action] of buttonMap) {
      const isPressed = Boolean(pad.buttons[idx]?.pressed);
      const wasPressed = this.prevGamepadButtons.get(idx) || false;
      if (isPressed && !wasPressed) {
        this.setDevice('playstation');
        this.emitAction(action);
      }
      this.prevGamepadButtons.set(idx, isPressed);
    }
  }

  public updateSettings(controls: GameSettings['controls']) {
    this.settings = { ...controls };
  }

  public onAction(cb: (action: UnifiedAction) => void): () => void {
    this.actionListeners.add(cb);
    return () => this.actionListeners.delete(cb);
  }

  public onDeviceChange(cb: (device: InputPromptDevice) => void): () => void {
    this.deviceListeners.add(cb);
    return () => this.deviceListeners.delete(cb);
  }

  public emitAction(action: UnifiedAction) {
    this.actionListeners.forEach((cb) => cb(action));
  }

  private setDevice(dev: InputPromptDevice) {
    if (this.activeDevice !== dev) {
      this.activeDevice = dev;
      this.deviceListeners.forEach((cb) => cb(dev));
    }
  }

  private onGamepadConnected = (e: GamepadEvent) => {
    this.connectedGamepadName = e.gamepad.id;
    this.playstationConnected = true;
    this.setDevice('playstation');
  };

  private onGamepadDisconnected = () => {
    const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    if (pads.length === 0) {
      this.playstationConnected = false;
      this.connectedGamepadName = '';
      this.setDevice('keyboard');
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const targetEl = e.target as HTMLElement | null;
    const tag = targetEl?.tagName;
    if (tag === 'TEXTAREA') return;
    if (tag === 'INPUT') {
      const inputType = (targetEl as HTMLInputElement).type;
      if (inputType !== 'range' && inputType !== 'checkbox' && inputType !== 'button') {
        if (e.code === 'Escape') {
          targetEl?.blur();
          this.emitAction('pause');
        }
        return;
      }
    }

    this.keysDown.add(e.code);
    this.setDevice('keyboard');

    if (this.menuMode) {
      if (e.code === 'Escape') {
        if (!e.repeat) this.emitAction('cancel');
        return;
      }
      if (tag !== 'SELECT' && !(tag === 'INPUT' && (targetEl as HTMLInputElement).type === 'range')) {
        if (e.code === 'ArrowUp') {
          e.preventDefault();
          this.emitAction('nav_up');
          return;
        }
        if (e.code === 'ArrowDown') {
          e.preventDefault();
          this.emitAction('nav_down');
          return;
        }
        if (e.code === 'ArrowLeft') {
          e.preventDefault();
          this.emitAction('nav_left');
          return;
        }
        if (e.code === 'ArrowRight') {
          e.preventDefault();
          this.emitAction('nav_right');
          return;
        }
      }
    }

    if (e.repeat) return;

    const kb = this.settings.keybindings;
    if (e.code === kb.foul) this.emitAction('foul');
    else if (e.code === kb.yellowCard) this.emitAction('yellow_card');
    else if (e.code === kb.redCard) this.emitAction('red_card');
    else if (e.code === kb.penalty) this.emitAction('penalty');
    else if (e.code === kb.offside) this.emitAction('offside');
    else if (e.code === kb.noFoul) this.emitAction('no_foul');
    else if (e.code === kb.varCheck) this.emitAction('var_check');
    else if (e.code === kb.replay) this.emitAction('replay');
    else if (e.code === kb.bribe) this.emitAction('bribe_accept');
    else if (e.code === 'Escape') this.emitAction('pause');
    else if (e.code === 'Space' && !this.menuMode) {
      e.preventDefault();
      this.emitAction('focus_incident');
    } else if (e.code === 'Tab' && !this.menuMode) {
      e.preventDefault();
      this.emitAction('stats_toggle');
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysDown.delete(e.code);
  };

  public vibrate(durationMs = 140, strong = 0.6, weak = 0.4) {
    if (!this.settings.controllerVibration || typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    for (const pad of pads) {
      if (pad && pad.vibrationActuator) {
        try {
          pad.vibrationActuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration: durationMs,
            weakMagnitude: weak,
            strongMagnitude: strong,
          });
        } catch {
          // Ignore unsupported browser rumble errors
        }
      }
    }
  }

  public pollFrame(cameraSensitivity: number): MovementVector {
    let moveX = 0;
    let moveY = 0;
    let lookX = this.virtualLookDelta.x;
    let lookY = this.virtualLookDelta.y;
    this.virtualLookDelta.x = 0;
    this.virtualLookDelta.y = 0;

    let sprint = this.virtualSprint || this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight');
    let precision = this.keysDown.has('KeyC') || this.keysDown.has('AltLeft');

    // Keyboard WASD + Arrow keys
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) moveY += 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) moveY -= 1;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) moveX -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) moveX += 1;

    // Virtual Mobile Joystick
    if (Math.abs(this.virtualMove.x) > 0.05 || Math.abs(this.virtualMove.y) > 0.05) {
      moveX += this.virtualMove.x * this.settings.joystickSensitivity;
      moveY += this.virtualMove.y * this.settings.joystickSensitivity;
      this.setDevice('mobile');
    }

    // PlayStation / Gamepad Polling
    if (typeof navigator !== 'undefined' && navigator.getGamepads) {
      const pads = navigator.getGamepads();
      const pad = pads[0] || pads[1] || pads[2] || pads[3];
      if (pad) {
        const dz = this.settings.deadzone;
        const applyDz = (v: number) => (Math.abs(v) < dz ? 0 : (v - Math.sign(v) * dz) / (1 - dz));

        const lx = applyDz(pad.axes[0] || 0);
        const ly = applyDz(-(pad.axes[1] || 0));
        const rx = applyDz(pad.axes[2] || 0);
        const ry = applyDz(pad.axes[3] || 0);

        if (Math.abs(lx) > 0.02 || Math.abs(ly) > 0.02) {
          moveX += lx * this.settings.joystickSensitivity;
          moveY += ly * this.settings.joystickSensitivity;
          this.setDevice('playstation');
        }
        if (Math.abs(rx) > 0.02 || Math.abs(ry) > 0.02) {
          lookX += rx * 2.8 * cameraSensitivity;
          lookY += ry * 1.8 * cameraSensitivity;
          this.setDevice('playstation');
        }

        // L2 (6) precision, R2 (7) sprint
        if (pad.buttons[6]?.pressed) precision = true;
        if (pad.buttons[7]?.pressed) sprint = true;

        // Edge-triggered button actions
        const buttonMap: Array<[number, UnifiedAction]> = [
          [0, 'confirm'], // Cross
          [1, 'cancel'], // Circle
          [2, 'foul'], // Square
          [3, 'yellow_card'], // Triangle
          [4, 'red_card'], // L1
          [5, 'penalty'], // R1
          [8, 'pause'], // Share / Select
          [9, 'pause'], // Options / Start
          [12, 'offside'], // D-Pad Up
          [13, 'no_foul'], // D-Pad Down
          [14, 'var_check'], // D-Pad Left
          [15, 'replay'], // D-Pad Right
          [17, 'stats_toggle'], // Touchpad
        ];

        for (const [idx, action] of buttonMap) {
          const isPressed = Boolean(pad.buttons[idx]?.pressed);
          const wasPressed = this.prevGamepadButtons.get(idx) || false;
          if (isPressed && !wasPressed) {
            this.setDevice('playstation');
            this.emitAction(action);
          }
          this.prevGamepadButtons.set(idx, isPressed);
        }
      }
    }

    // Clamp movement vector
    const mag = Math.hypot(moveX, moveY);
    if (mag > 1) {
      moveX /= mag;
      moveY /= mag;
    }

    return { moveX, moveY, lookX, lookY, sprint, precision };
  }
}

export const inputManager = new UnifiedInputManager();
