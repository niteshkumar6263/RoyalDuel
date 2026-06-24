import React from "react";
import { useEffect, useRef } from "react";
import GameEngine from "./game/engine";
import socket from "./services/socket";

/**
 * GameCanvas Component - Renders the game on canvas
 * Integrates the GameEngine with React state management
 * Handles:
 * - Canvas rendering
 * - Game engine lifecycle
 * - Socket.io action broadcasting
 * - Damage synchronization
 */
export default function GameCanvas({
  gameState,
  onGameStateUpdate,
  roomId,
  isGameOver,
  isLocalHost = true,
}) {
  const canvasRef = useRef(null);
  const gameEngineRef = useRef(null);
  const isGameOverRef = useRef(isGameOver);
  const updateIntervalRef = useRef(null);

  useEffect(() => {
    isGameOverRef.current = isGameOver;
    if (isGameOver && gameEngineRef.current) {
      gameEngineRef.current.stop();
    }
  }, [isGameOver]);

  /**
   * Initialize game engine and setup socket listeners
   */
  useEffect(() => {
    if (!canvasRef.current || gameEngineRef.current) return;

    const getLocalGameStatus = (winner) => {
      if (!winner) return "tie";
      const localKey = isLocalHost ? "player1" : "player2";
      return winner === localKey ? "won" : "lost";
    };

    // Create game engine instance with callbacks
    // Pass ownership flag so engine binds input to correct fighter
    gameEngineRef.current = new GameEngine(canvasRef.current, {
      localIsPlayer1: !!isLocalHost,
      // Called when an action happens (attack, move, etc.)
      onAction: (action) => {
        if (roomId && !isGameOverRef.current) {
          // Relay immediate action for animation sync
          const playerKey = isLocalHost ? "player1" : "player2";
          socket.emit("player-action", {
            roomId,
            playerKey,
            action,
            meta: {},
            timestamp: Date.now(),
          });
        }
      },

      onTimerUpdate: (timeRemaining) => {
        onGameStateUpdate((prev) => ({
          ...prev,
          timeRemaining,
        }));
      },

      // Called when damage is dealt
      onDamage: ({ defender, damage, newHealth }) => {
        // Update local game state with new health
        onGameStateUpdate((prev) => ({
          ...prev,
          [defender]: {
            ...prev[defender],
            health: newHealth,
          },
        }));

        // Broadcast a hit event (authoritative mutation occurs on server)
        if (roomId) {
          socket.emit("player-hit", {
            roomId,
            defender,
            damage,
          });
        }
      },

      // Called when game ends
      onGameOver: ({ winner, player1Health, player2Health }) => {
        // Update game state with final status
        onGameStateUpdate((prev) => ({
          ...prev,
          gameStatus: getLocalGameStatus(winner),
          winner,
          player1: { ...prev.player1, health: player1Health },
          player2: { ...prev.player2, health: player2Health },
        }));

        // Broadcast game over to opponent
        if (roomId) {
          socket.emit("game-over", {
            roomId,
            winner,
            player1Health,
            player2Health,
          });
        }
      },
    });

    // Start the game
    gameEngineRef.current.start();

    // Periodically emit local player state to server (authoritative merge server-side)
    updateIntervalRef.current = setInterval(() => {
      if (!gameEngineRef.current || !roomId) return;
      const state = gameEngineRef.current.getState();
      const playerKey = isLocalHost ? "player1" : "player2";
      const payloadState = isLocalHost ? state.player1 : state.player2;
      socket.emit("player-state", {
        roomId,
        playerKey,
        state: payloadState,
      });
    }, 50);

    // Setup socket listeners for opponent actions and damage
    const handleOpponentAction = (data) => {
      const { playerKey, action, meta } = data || {};
      // Ignore actions that originate from this client (they were applied locally)
      const localKey = isLocalHost ? "player1" : "player2";
      if (playerKey === localKey) return;
      if (gameEngineRef.current) {
        gameEngineRef.current.applyOpponentAction(playerKey, action, meta);
      }
    };

    const handleOpponentDamage = (data) => {
      const { defender, damage, newHealth } = data;

      if (gameEngineRef.current) {
        gameEngineRef.current.applyDamage(defender, damage, newHealth);
      }

      onGameStateUpdate((prev) => ({
        ...prev,
        [defender]: {
          ...prev[defender],
          health:
            typeof newHealth === "number"
              ? newHealth
              : Math.max(0, prev[defender].health - damage),
        },
      }));
    };

    const handleOpponentGameOver = (data) => {
      const { winner, player1Health, player2Health } = data;

      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
      }

      onGameStateUpdate((prev) => ({
        ...prev,
        gameStatus: getLocalGameStatus(winner),
        winner,
        player1: { ...prev.player1, health: player1Health },
        player2: { ...prev.player2, health: player2Health },
      }));
    };

    socket.on("game-action-opponent", handleOpponentAction);
    socket.on("game-damage-from-opponent", handleOpponentDamage);
    socket.on("game-over-opponent", handleOpponentGameOver);

    // Listen for authoritative game state updates from server
    const handleGameStateUpdate = (payload) => {
      const { state } = payload || {};
      if (!state) return;

      // Apply authoritative positions/animations/health to engine and React state
      if (gameEngineRef.current) {
        gameEngineRef.current.applyServerState(state);
      }

      // Update React game state as single source of truth
      onGameStateUpdate((prev) => ({
        ...prev,
        player1: { ...prev.player1, ...(state.player1 || {}) },
        player2: { ...prev.player2, ...(state.player2 || {}) },
        timeRemaining:
          typeof state.timeRemaining === "number"
            ? state.timeRemaining
            : prev.timeRemaining,
        gameStatus: state.gameOver
          ? getLocalGameStatus(state.winner)
          : prev.gameStatus,
        winner: state.winner || prev.winner,
      }));
    };

    socket.on("game-state-update", handleGameStateUpdate);

    // Relay immediate player action broadcasts (for smoother animation)
    const handlePlayerActionBroadcast = (payload) => {
      const { playerKey, action, meta } = payload || {};
      const localKey = isLocalHost ? "player1" : "player2";
      // Ignore our own broadcasts (we already animated locally)
      if (playerKey === localKey) return;
      if (gameEngineRef.current) {
        gameEngineRef.current.applyOpponentAction(playerKey, action, meta);
      }
    };
    socket.on("player-action-broadcast", handlePlayerActionBroadcast);

    // Cleanup
    return () => {
      socket.off("game-action-opponent", handleOpponentAction);
      socket.off("game-damage-from-opponent", handleOpponentDamage);
      socket.off("game-over-opponent", handleOpponentGameOver);
      socket.off("game-state-update", handleGameStateUpdate);
      socket.off("player-action-broadcast", handlePlayerActionBroadcast);

      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [roomId, onGameStateUpdate]);

  return (
    <canvas ref={canvasRef} className="game-canvas" width={1024} height={430} />
  );
}
