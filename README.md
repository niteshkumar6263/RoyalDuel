# Royal Duel

A real-time, 2-player browser fighting game with a custom canvas-based physics/animation engine, live game-state sync over Socket.IO, and peer-to-peer WebRTC video/audio calling between opponents.

**Live demo:** https://royalduel-1.onrender.com/

---

## Overview

Royal Duel lets two players fight head-to-head directly in the browser — no downloads, no plugins. One player creates a room and shares the room code; the other joins with it. Once both players are connected, the match starts, movement and attacks are synced in real time, and both players can see and talk to each other over a live video/audio call while they fight.

## Features

- **Room-based matchmaking** — create a room and get a shareable 6-character code, or join an existing room by code.
- **Custom 2D fighting engine** — built from scratch on HTML5 Canvas: sprite-sheet frame animation, gravity, jumping, ground collision, and hitbox-based attack detection (no game engine/library used).
- **Real-time multiplayer sync** — player movement, attacks, and health are synced between both clients over Socket.IO.
- **Server-authoritative game state** — the server is the source of truth for health and match outcome, so both players always see a consistent result even if there's a timing conflict on hits.
- **Smooth remote-player movement** — the opponent's position is interpolated toward the latest server update instead of jumping between packets, with an automatic snap-correction if the position ever drifts too far out of sync (e.g., after a dropped connection).
- **Peer-to-peer video/audio calling** — WebRTC connects both players' camera/mic directly to each other once matched, with the server only used to relay the initial connection setup (signaling).
- **Match UI** — health bars, player cards, match stats, a control panel, and a "waiting for opponent" / "opponent left" flow for handling disconnects gracefully.

## Tech Stack

**Client**
- React 18, React Router
- Vite (build tool/dev server)
- HTML5 Canvas (2D rendering)
- Socket.IO Client
- WebRTC (native browser API)
- lucide-react (icons)

**Server**
- Node.js, Express 5
- Socket.IO (WebSocket server)
- CORS, dotenv

**Deployment**
- Render (client and server deployed as two separate services)

## How It Works

### Matchmaking & Rooms
A player creates a room from the lobby; the server generates a short room code and stores room state (host, connected players, ready status) in memory. A second player joins using that code. Once two players are present, the server broadcasts `game-start` to both clients.

### Real-Time Gameplay
Each client runs its own instance of the game engine (`client/src/game/engine.js`), rendering both fighters on a shared canvas. The **local player's** movement is applied instantly from keyboard input for a responsive feel. The **opponent's** fighter is not driven by local physics — instead, it's smoothly interpolated toward the last position broadcast by the server, so gameplay stays fluid even with normal network jitter. Attacks are detected locally via hitbox collision, but **health changes are always confirmed by the server**, which keeps score and decides when the match ends — preventing the two clients from ever disagreeing about who won.

### Video/Audio Calling
Once both players are in a room, their browsers negotiate a direct WebRTC connection (SDP offer/answer + ICE candidates), using the Socket.IO server purely as a relay for that initial handshake. After the connection is established, video and audio flow directly between the two players' browsers — the server is not involved in the actual call.

## Project Structure

```
RoyalDuel/
├── client/                       # React + Vite frontend
│   ├── public/img/               # Fighter sprite sheets & backgrounds
│   └── src/
│       ├── components/           # UI: Arena, Lobby, MatchInfo, MatchStats,
│       │                         #     PlayerCard, StatsBar, Navbar, modals
│       ├── game/
│       │   ├── engine.js         # Core networked game engine (current version)
│       │   ├── classes.js        # Sprite / Fighter classes
│       │   ├── gameLoop.js       # Earlier local (single-keyboard) prototype
│       │   └── utils.js          # Helpers for the local prototype
│       ├── hooks/useGameState.js # React hook wrapping game/socket state
│       ├── services/
│       │   ├── socket.js         # Socket.IO client setup
│       │   └── webrtc.js         # WebRTC peer connection + signaling helper
│       └── pages/                # HomePage, GamePage
│
└── server/                       # Node.js + Express backend
    ├── server.js                 # Express + Socket.IO server entry point
    ├── socket/
    │   ├── roomHandler.js        # Room creation/joining, WebRTC signaling relay
    │   ├── gameHandler.js        # Authoritative game state, hit/health sync
    │   └── webrtcHandler.js      # WebRTC-specific socket events
    └── utils/generateRoomId.js   # Room code generation
```

## Running Locally

**Prerequisites:** Node.js installed.

```bash
# 1. Clone the repository
git clone https://github.com/niteshkumar6263/RoyalDuel.git
cd RoyalDuel

# 2. Start the server
cd server
npm install
npm run dev        # starts on nodemon, default Socket.IO/Express server

# 3. In a separate terminal, start the client
cd client
npm install
npm run dev         # starts the Vite dev server
```

Open two browser tabs/windows to the client's dev URL to simulate two players — create a room in one tab and join with the code in the other.
