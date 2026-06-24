/**
 * Game Handler - Server-side game event management
 * Handles:
 * - Player actions (attack, move, jump, etc.)
 * - Damage synchronization
 * - Game-over detection
 * - Real-time multiplayer action broadcasting
 */

// Simple in-memory authoritative game state per room
const roomGameStates = global.__ROOM_GAME_STATES__ || new Map();
global.__ROOM_GAME_STATES__ = roomGameStates;

module.exports = function gameHandler(io, socket, roomId) {
  // Ensure an initial state exists for the room
  if (!roomGameStates.has(roomId)) {
    roomGameStates.set(roomId, {
      player1: {
        x: 250,
        y: 0,
        health: 100,
        animation: "idle",
        direction: "right",
      },
      player2: {
        x: 650,
        y: 0,
        health: 100,
        animation: "idle",
        direction: "left",
      },
      gameOver: false,
      winner: null,
    });
  }
  // Track which player is which
  const room = io.sockets.adapter.rooms.get(roomId);
  const playerSockets = Array.from(room || []);
  const playerIndex = playerSockets.indexOf(socket.id);

  /**
   * Handle player action (attack, move, jump, block, etc.)
   * Broadcasts the action to the opponent
   *
   * Expected payload:
   * {
   *   roomId: string,
   *   playerKey: "player1" | "player2",
   *   action: string (attack1, attack2, move-left, move-right, jump),
   *   timestamp: number
   * }
   */
  socket.on("game-action", (payload) => {
    const { roomId: emitRoomId, playerKey, action, timestamp } = payload;

    if (emitRoomId !== roomId) {
      console.warn(`[gameHandler] Room mismatch: ${emitRoomId} vs ${roomId}`);
      return;
    }

    // Broadcast action to opponent (all other sockets in room except sender)
    socket.to(roomId).emit("game-action-opponent", {
      playerKey,
      action,
      timestamp,
      sentBy: socket.id,
    });

    console.log(
      `[gameHandler] Action "${action}" from ${playerKey} in room ${roomId}`,
    );
  });

  // Receive periodic player state updates (position, animation, etc.)
  socket.on("player-state", (payload) => {
    const { roomId: emitRoomId, playerKey, state } = payload || {};
    if (emitRoomId !== roomId) return;

    const roomState = roomGameStates.get(roomId) || {};
    roomState[playerKey] = {
      ...(roomState[playerKey] || {}),
      ...state,
    };
    roomGameStates.set(roomId, roomState);

    // Broadcast authoritative full state to all in room (including sender)
    io.to(roomId).emit("game-state-update", {
      roomId,
      state: roomState,
      timestamp: Date.now(),
    });
  });

  // Handle actions that should be relayed immediately (for animation)
  socket.on("player-action", (payload) => {
    const { roomId: emitRoomId, playerKey, action, meta } = payload || {};
    if (emitRoomId !== roomId) return;

    // Broadcast the action so both clients can animate instantly
    io.to(roomId).emit("player-action-broadcast", {
      playerKey,
      action,
      meta,
      timestamp: Date.now(),
    });
  });

  // Handle hit events (authoritative health mutation)
  socket.on("player-hit", (payload) => {
    const { roomId: emitRoomId, defender, damage } = payload || {};
    if (emitRoomId !== roomId) return;

    const roomState = roomGameStates.get(roomId) || {};
    if (!roomState[defender]) roomState[defender] = { health: 100 };
    const newHealth = Math.max(
      0,
      (roomState[defender].health || 100) - (damage || 0),
    );
    roomState[defender].health = newHealth;

    // If dead, set winner
    if (newHealth <= 0 && !roomState.gameOver) {
      roomState.gameOver = true;
      roomState.winner = defender === "player1" ? "player2" : "player1";
    }

    roomGameStates.set(roomId, roomState);

    // Broadcast immediate damage notification to opponent for animation/sync
    socket.to(roomId).emit("game-damage-from-opponent", {
      defender,
      damage,
      newHealth,
      timestamp: Date.now(),
    });

    // Broadcast updated authoritative state
    io.to(roomId).emit("game-state-update", {
      roomId,
      state: roomState,
      timestamp: Date.now(),
    });
  });

  /**
   * Handle damage taken by a player
   * Synchronizes health state across both clients
   *
   * Expected payload:
   * {
   *   roomId: string,
   *   defender: "player1" | "player2",
   *   damage: number,
   *   newHealth: number
   * }
   */
  socket.on("game-damage", (payload) => {
    const { roomId: emitRoomId, defender, damage, newHealth } = payload;

    if (emitRoomId !== roomId) {
      console.warn(`[gameHandler] Room mismatch: ${emitRoomId} vs ${roomId}`);
      return;
    }

    // Broadcast damage to opponent
    socket.to(roomId).emit("game-damage-from-opponent", {
      defender,
      damage,
      newHealth,
      timestamp: Date.now(),
    });

    console.log(
      `[gameHandler] Damage dealt to ${defender} (${damage} HP) in room ${roomId}`,
    );
  });

  /**
   * Handle game-over event
   * Confirms winner and ends the match for both players
   *
   * Expected payload:
   * {
   *   roomId: string,
   *   winner: "player1" | "player2" | null (tie),
   *   player1Health: number,
   *   player2Health: number
   * }
   */
  socket.on("game-over", (payload) => {
    const {
      roomId: emitRoomId,
      winner,
      player1Health,
      player2Health,
    } = payload;

    if (emitRoomId !== roomId) {
      console.warn(`[gameHandler] Room mismatch: ${emitRoomId} vs ${roomId}`);
      return;
    }

    // Broadcast game-over to opponent
    socket.to(roomId).emit("game-over-opponent", {
      winner,
      player1Health,
      player2Health,
      timestamp: Date.now(),
    });

    console.log(
      `[gameHandler] Game Over in room ${roomId}: Winner = ${winner}`,
    );
  });

  /**
   * Handle player disconnect during game
   * Notifies opponent that the game is no longer playable
   */
  socket.on("leave-game", (payload = {}) => {
    const { roomId: emitRoomId } = payload;

    if (emitRoomId !== roomId) {
      console.warn(`[gameHandler] Room mismatch: ${emitRoomId} vs ${roomId}`);
      return;
    }

    // Notify opponent that player left
    socket.to(roomId).emit("opponent-left-game", {
      playerIndex,
      timestamp: Date.now(),
    });

    console.log(
      `[gameHandler] Player ${playerIndex} left game in room ${roomId}`,
    );
  });

  /**
   * Handle round end
   * Resets game state for next round
   *
   * Expected payload:
   * {
   *   roomId: string,
   *   round: number,
   *   winner: "player1" | "player2" | null
   * }
   */
  socket.on("round-end", (payload) => {
    const { roomId: emitRoomId, round, winner } = payload;

    if (emitRoomId !== roomId) {
      console.warn(`[gameHandler] Room mismatch: ${emitRoomId} vs ${roomId}`);
      return;
    }

    // Broadcast round end to opponent
    socket.to(roomId).emit("round-end-opponent", {
      round,
      winner,
      timestamp: Date.now(),
    });

    console.log(
      `[gameHandler] Round ${round} ended in room ${roomId}: Winner = ${winner}`,
    );
  });

  /**
   * Handle sync request
   * Sends current game state to requesting player (for reconnection)
   *
   * Expected payload:
   * {
   *   roomId: string
   * }
   */
  socket.on("sync-game-state", (payload) => {
    const { roomId: emitRoomId } = payload;

    if (emitRoomId !== roomId) {
      console.warn(`[gameHandler] Room mismatch: ${emitRoomId} vs ${roomId}`);
      return;
    }

    // Send sync acknowledgment back to requester
    socket.emit("sync-game-state-ack", {
      roomId,
      timestamp: Date.now(),
    });

    console.log(`[gameHandler] Game state sync requested in room ${roomId}`);
  });

  console.log(
    `[gameHandler] Game handlers registered for socket ${socket.id} in room ${roomId}`,
  );
};
