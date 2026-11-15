import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Role = 'main_referee' | 'assistant_referee_1' | 'assistant_referee_2' | 'var_referee';
type FriendMode = '2_refs' | '3_refs' | '4_refs';

const MODE_SLOTS: Record<FriendMode, Role[]> = {
  '2_refs': ['main_referee', 'var_referee'],
  '3_refs': ['main_referee', 'assistant_referee_1', 'assistant_referee_2'],
  '4_refs': ['main_referee', 'assistant_referee_1', 'assistant_referee_2', 'var_referee'],
};

interface ClientMeta {
  ws: WebSocket;
  id: string;
  name: string;
  role: Role;
  roomCode: string | null;
  micMuted: boolean;
}

interface Room {
  code: string;
  mode: FriendMode;
  status: 'waiting' | 'playing' | 'finished';
  clients: Map<string, ClientMeta>;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  fixturePayload?: unknown;
}

const rooms = new Map<string, Room>();
const clients = new Map<WebSocket, ClientMeta>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function getNextAvailableRole(room: Room): Role | null {
  const slots = MODE_SLOTS[room.mode] || MODE_SLOTS['2_refs'];
  const taken = new Set(Array.from(room.clients.values()).map((c) => c.role));
  for (const r of slots) {
    if (!taken.has(r)) return r;
  }
  return null;
}

function broadcastRoomState(room: Room) {
  const slots = MODE_SLOTS[room.mode] || MODE_SLOTS['2_refs'];
  const participants = Array.from(room.clients.values()).map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
    connected: c.ws.readyState === WebSocket.OPEN,
    micMuted: c.micMuted,
  }));

  const payload = JSON.stringify({
    type: 'room_update',
    room: {
      roomCode: room.code,
      mode: room.mode,
      maxParticipants: slots.length,
      status: room.status,
      participants,
      homeTeam: room.homeTeam,
      awayTeam: room.awayTeam,
      homeScore: room.homeScore,
      awayScore: room.awayScore,
      minute: room.minute,
    },
  });

  room.clients.forEach((c) => {
    if (c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(payload);
    }
  });
}

function relayToPartner(room: Room, senderId: string, msgObj: Record<string, unknown>) {
  const raw = JSON.stringify(msgObj);
  room.clients.forEach((c) => {
    if (c.id !== senderId && c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(raw);
    }
  });
}

function broadcastToRoom(room: Room, msgObj: Record<string, unknown>) {
  const raw = JSON.stringify(msgObj);
  room.clients.forEach((c) => {
    if (c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(raw);
    }
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', rooms: rooms.size });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    const clientId = `ref_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const meta: ClientMeta = {
      ws,
      id: clientId,
      name: 'Referee',
      role: 'main_referee',
      roomCode: null,
      micMuted: true,
    };
    clients.set(ws, meta);

    ws.send(JSON.stringify({ type: 'welcome', clientId }));

    ws.on('message', (raw) => {
      let msg: Record<string, any>;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === 'create_room') {
        if (meta.roomCode && rooms.has(meta.roomCode)) {
          const old = rooms.get(meta.roomCode)!;
          old.clients.delete(meta.id);
          if (old.clients.size === 0) rooms.delete(old.code);
          else broadcastRoomState(old);
        }

        const rawMode = String(msg.mode || '2_refs');
        const mode: FriendMode =
          rawMode === '3_refs' || rawMode === '4_refs' ? rawMode : '2_refs';
        const code = generateRoomCode();
        meta.name = String(msg.name || 'Main Referee').slice(0, 24);
        meta.role = 'main_referee';
        meta.roomCode = code;

        const room: Room = {
          code,
          mode,
          status: 'waiting',
          clients: new Map([[meta.id, meta]]),
          homeTeam: String(msg.homeTeam || 'Madrid Crown'),
          awayTeam: String(msg.awayTeam || 'London Gunners'),
          homeScore: 0,
          awayScore: 0,
          minute: 0,
          fixturePayload: msg.fixture,
        };
        rooms.set(code, room);
        ws.send(
          JSON.stringify({
            type: 'joined',
            clientId: meta.id,
            role: meta.role,
            mode: room.mode,
            roomCode: code,
          })
        );
        broadcastRoomState(room);
        return;
      }

      if (msg.type === 'join_room') {
        const code = String(msg.roomCode || '').trim().toUpperCase();
        const room = rooms.get(code);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room code not found.' }));
          return;
        }
        const nextRole = getNextAvailableRole(room);
        if (!nextRole) {
          const maxCount = MODE_SLOTS[room.mode].length;
          ws.send(
            JSON.stringify({
              type: 'error',
              message: `Room is full (${maxCount}/${maxCount} referees connected).`,
            })
          );
          return;
        }

        meta.name = String(msg.name || 'Referee').slice(0, 24);
        meta.role = nextRole;
        meta.roomCode = code;
        room.clients.set(meta.id, meta);

        ws.send(
          JSON.stringify({
            type: 'joined',
            clientId: meta.id,
            role: meta.role,
            mode: room.mode,
            roomCode: code,
            fixture: room.fixturePayload,
          })
        );
        broadcastRoomState(room);
        return;
      }

      if (!meta.roomCode || !rooms.has(meta.roomCode)) return;
      const room = rooms.get(meta.roomCode)!;

      if (msg.type === 'leave_room') {
        room.clients.delete(meta.id);
        meta.roomCode = null;
        if (room.clients.size === 0) {
          rooms.delete(room.code);
        } else {
          room.status = 'waiting';
          broadcastRoomState(room);
        }
        return;
      }

      if (msg.type === 'start_match') {
        if (meta.role !== 'main_referee') return;
        room.status = 'playing';
        room.homeScore = 0;
        room.awayScore = 0;
        room.minute = 0;
        if (msg.fixture) room.fixturePayload = msg.fixture;
        broadcastRoomState(room);
        broadcastToRoom(room, {
          type: 'match_started',
          mode: room.mode,
          fixture: room.fixturePayload,
        });
        return;
      }

      if (msg.type === 'state_sync') {
        // Authoritative simulation runs on Main Referee client and syncs to all other referees via server
        if (meta.role !== 'main_referee') return;
        if (typeof msg.homeScore === 'number') room.homeScore = msg.homeScore;
        if (typeof msg.awayScore === 'number') room.awayScore = msg.awayScore;
        if (typeof msg.minute === 'number') room.minute = msg.minute;
        relayToPartner(room, meta.id, msg);
        return;
      }

      if (msg.type === 'incident_sync') {
        if (meta.role !== 'main_referee') return;
        relayToPartner(room, meta.id, msg);
        return;
      }

      if (msg.type === 'ref_pos') {
        relayToPartner(room, meta.id, { ...msg, senderId: meta.id, role: meta.role });
        return;
      }

      if (msg.type === 'decision') {
        const action = String(msg.action || '');
        const mainAllowed = [
          'foul',
          'yellow_card',
          'red_card',
          'penalty',
          'no_foul',
          'handball',
          'advantage',
          'offside',
          'throw_in',
          'var_check',
        ];
        const assistantAllowed = ['offside', 'throw_in', 'flag_signal'];
        const varAllowed = [
          'foul',
          'yellow_card',
          'red_card',
          'penalty',
          'no_foul',
          'handball',
          'offside',
          'var_check',
        ];

        if (meta.role === 'main_referee' && !mainAllowed.includes(action)) return;
        if (
          (meta.role === 'assistant_referee_1' || meta.role === 'assistant_referee_2') &&
          !assistantAllowed.includes(action)
        ) {
          return;
        }
        if (meta.role === 'var_referee' && !varAllowed.includes(action)) return;

        broadcastToRoom(room, {
          type: 'decision_event',
          senderId: meta.id,
          senderName: meta.name,
          role: meta.role,
          action,
          incidentId: msg.incidentId,
          isVarRecommendation: meta.role === 'var_referee',
          timestamp: Date.now(),
        });
        return;
      }

      if (msg.type === 'mic_state') {
        meta.micMuted = Boolean(msg.muted);
        broadcastRoomState(room);
        return;
      }

      if (msg.type === 'webrtc_signal') {
        const targetId = typeof msg.to === 'string' ? msg.to : null;
        if (targetId) {
          const target = room.clients.get(targetId);
          if (target && target.ws.readyState === WebSocket.OPEN) {
            target.ws.send(
              JSON.stringify({
                type: 'webrtc_signal',
                senderId: meta.id,
                signal: msg.signal,
              })
            );
          }
        } else {
          relayToPartner(room, meta.id, {
            type: 'webrtc_signal',
            senderId: meta.id,
            signal: msg.signal,
          });
        }
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      if (meta.roomCode && rooms.has(meta.roomCode)) {
        const room = rooms.get(meta.roomCode)!;
        room.clients.delete(meta.id);
        if (room.clients.size === 0) {
          rooms.delete(room.code);
        } else {
          broadcastRoomState(room);
        }
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Referee Simulator server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
