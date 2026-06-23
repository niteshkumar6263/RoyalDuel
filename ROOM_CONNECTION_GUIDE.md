# Royal Duel - Room Connection System

## Overview

The room connection system enables two players to connect and play together using Socket.IO for real-time communication.

## How It Works

### Creating a Room (Host Player)

1. **User enters username** in the Lobby
2. **Click "Create Room"** button
3. Client emits `create-room` event to server with username
4. Server:
   - Generates unique Room ID
   - Creates room object with host and player list
   - Stores room in memory
   - Emits `room-created` response with Room ID
5. Client:
   - Displays Room ID in WaitingRoom component
   - Shows "Waiting for opponent..." message
   - Room ID can be copied and shared

### Joining a Room (Guest Player)

1. **User enters username** in the Lobby
2. **Click "Join Room"** button
3. **Enter Room ID** that host provided
4. Client emits `join-room` event to server with Room ID and username
5. Server checks:
   - Room exists (if not, sends `error-message`)
   - Room has space (max 2 players, if full sends `error-message`)
6. If valid:
   - Adds player to room
   - Broadcasts `player-joined` event to all players in room
   - Broadcasts `game-start` event to start the game

### Game Start Flow

Once both players are connected:

1. Server emits `game-start` to both players
2. Both clients navigate to `/game` page
3. Players can now interact in the game arena

## Socket Events

### Client → Server

| Event         | Data                   | Purpose                |
| ------------- | ---------------------- | ---------------------- |
| `create-room` | `{ username }`         | Create a new game room |
| `join-room`   | `{ roomId, username }` | Join existing room     |

### Server → Client

| Event           | Data                  | Purpose                                          |
| --------------- | --------------------- | ------------------------------------------------ |
| `room-created`  | `{ roomId }`          | Room successfully created                        |
| `player-joined` | `{ roomId, players }` | New player joined (all players receive this)     |
| `game-start`    | None                  | Both players ready, game starts                  |
| `error-message` | `String`              | Error occurred (room not found, room full, etc.) |

## File Structure

```
client/
├── src/
│   ├── pages/
│   │   └── HomePage.jsx (Socket event handling)
│   ├── components/
│   │   ├── Lobby.jsx (Room creation UI)
│   │   ├── JoinRoomModal.jsx (Room joining UI)
│   │   └── WaitingRoom.jsx (Host waiting for player)
│   └── services/
│       └── socket.js (Socket.IO client connection)

server/
├── socket/
│   └── roomHandler.js (Room logic)
└── server.js (Main server setup)
```

## Testing the Connection

### Local Testing with Two Browsers

1. Start server: `npm run start` (from `/server`)
2. Start client: `npm run dev` (from `/client`)
3. Open two browser windows/tabs at `http://localhost:5173`
4. **Window 1 (Host):**
   - Enter username: "Player1"
   - Click "Create Room"
   - Copy the Room ID
5. **Window 2 (Guest):**
   - Enter username: "Player2"
   - Click "Join Room"
   - Paste Room ID and click "Join"
6. Both should navigate to game page when second player joins

### Network Testing

For testing across different machines:

- Update `VITE_SERVER_URL` in `.env.local` to point to server's public IP
- Ensure firewall allows connection to server port

## Error Handling

- **Room not found**: Guest entered invalid Room ID
- **Room full**: Another player already joined (max 2 players)
- **Connection lost**: Players automatically removed from room

## Features Implemented

✅ Room creation with unique ID generation  
✅ Room joining validation  
✅ Max 2 players per room  
✅ Automatic cleanup on disconnect  
✅ Error messages for user feedback  
✅ Loading states during connection  
✅ Socket event listeners for game flow

## Next Steps

- Implement real-time game synchronization
- Add player state management (position, health, actions)
- Handle reconnection logic
- Add chat/voice communication
- Implement spectator mode
