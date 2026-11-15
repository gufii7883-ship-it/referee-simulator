import { FriendModeVariant, MultiplayerRole, MultiplayerRoomState } from '../types/game';
import { GeneratedMatchFixture } from '../data/leagues';

export type ServerMessageHandler = (msg: Record<string, any>) => void;

class MultiplayerClient {
  private ws: WebSocket | null = null;
  private listeners = new Set<ServerMessageHandler>();
  public clientId: string | null = null;
  public role: MultiplayerRole | null = null;
  public mode: FriendModeVariant = '2_refs';
  public roomCode: string | null = null;
  public roomState: MultiplayerRoomState | null = null;

  // Multi-peer WebRTC Mesh Voice Chat (supports 2, 3, or 4 friends)
  private peers = new Map<string, RTCPeerConnection>();
  private remoteAudios = new Map<string, HTMLAudioElement>();
  private localStream: MediaStream | null = null;
  public voiceEnabled = false;
  public micMuted = true;

  public connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${proto}//${window.location.host}/ws`;
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error('WebSocket connection failed'));
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.type === 'welcome') {
            this.clientId = data.clientId;
          } else if (data.type === 'joined') {
            this.clientId = data.clientId;
            this.role = data.role;
            if (data.mode) this.mode = data.mode;
            this.roomCode = data.roomCode;
          } else if (data.type === 'room_update') {
            this.roomState = data.room;
            if (data.room?.mode) this.mode = data.room.mode;
            this.syncVoiceMeshIfActive();
          } else if (data.type === 'webrtc_signal' && data.senderId) {
            this.handleWebRtcSignal(data.senderId, data.signal);
          }
          this.listeners.forEach((fn) => fn(data));
        } catch {
          // ignore malformed messages
        }
      };
      ws.onclose = () => {
        this.ws = null;
        this.listeners.forEach((fn) => fn({ type: 'disconnected' }));
      };
    });
  }

  public onMessage(fn: ServerMessageHandler): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public send(obj: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  public async createRoom(
    name: string,
    fixture: GeneratedMatchFixture,
    mode: FriendModeVariant = '2_refs'
  ) {
    await this.connect();
    this.mode = mode;
    this.send({
      type: 'create_room',
      name,
      mode,
      homeTeam: fixture.home.name,
      awayTeam: fixture.away.name,
      fixture,
    });
  }

  public async joinRoom(name: string, code: string) {
    await this.connect();
    this.send({
      type: 'join_room',
      name,
      roomCode: code.trim().toUpperCase(),
    });
  }

  public startMatch(fixture: GeneratedMatchFixture) {
    this.send({ type: 'start_match', fixture });
  }

  public sendDecision(action: string, incidentId?: string) {
    this.send({ type: 'decision', action, incidentId });
  }

  public sendIncidentSync(kind: 'spawn' | 'resolved', incident: unknown) {
    this.send({ type: 'incident_sync', kind, incident });
  }

  public leaveRoom() {
    this.send({ type: 'leave_room' });
    this.roomCode = null;
    this.role = null;
    this.roomState = null;
    this.stopVoice();
  }

  public async enableVoiceChat(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.voiceEnabled = true;
      this.micMuted = false;
      this.send({ type: 'mic_state', muted: false });
      await this.syncVoiceMeshIfActive();
      return true;
    } catch {
      return false;
    }
  }

  private async syncVoiceMeshIfActive() {
    if (!this.voiceEnabled || !this.roomState || !this.clientId) return;
    const activeIds = new Set(
      this.roomState.participants.filter((p) => p.id !== this.clientId).map((p) => p.id)
    );

    // Cleanup disconnected peers
    for (const [peerId, pc] of this.peers.entries()) {
      if (!activeIds.has(peerId)) {
        pc.close();
        this.peers.delete(peerId);
        const audio = this.remoteAudios.get(peerId);
        if (audio) {
          audio.srcObject = null;
          this.remoteAudios.delete(peerId);
        }
      }
    }

    // Deterministic initiator: lower clientId initiates WebRTC offer
    for (const peerId of activeIds) {
      if (!this.peers.has(peerId) && this.clientId < peerId) {
        await this.setupPeerConnection(peerId, true);
      }
    }
  }

  public toggleMute(): boolean {
    this.micMuted = !this.micMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => {
        t.enabled = !this.micMuted;
      });
    }
    this.send({ type: 'mic_state', muted: this.micMuted });
    return this.micMuted;
  }

  public stopVoice() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    for (const pc of this.peers.values()) {
      pc.close();
    }
    this.peers.clear();
    for (const audio of this.remoteAudios.values()) {
      audio.srcObject = null;
    }
    this.remoteAudios.clear();
    this.voiceEnabled = false;
    this.micMuted = true;
  }

  private async setupPeerConnection(peerId: string, isInitiator: boolean) {
    const existing = this.peers.get(peerId);
    if (existing) existing.close();

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    this.peers.set(peerId, pc);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.send({ type: 'webrtc_signal', to: peerId, signal: { candidate: e.candidate } });
      }
    };

    pc.ontrack = (e) => {
      let audio = this.remoteAudios.get(peerId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        this.remoteAudios.set(peerId, audio);
      }
      audio.srcObject = e.streams[0];
    };

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.send({ type: 'webrtc_signal', to: peerId, signal: { sdp: pc.localDescription } });
    }
  }

  private async handleWebRtcSignal(peerId: string, signal: Record<string, any>) {
    try {
      if (!this.peers.has(peerId)) {
        await this.setupPeerConnection(peerId, false);
      }
      const pc = this.peers.get(peerId);
      if (!pc) return;

      if (signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        if (signal.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          this.send({ type: 'webrtc_signal', to: peerId, signal: { sdp: pc.localDescription } });
        }
      } else if (signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch {
      // Ignore transient WebRTC negotiation timing errors
    }
  }
}

export const mpClient = new MultiplayerClient();
