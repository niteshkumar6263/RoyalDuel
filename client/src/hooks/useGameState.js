import { useState, useEffect, useCallback, useRef } from "react";
import socket from "../services/socket";

/**
 * Custom hook to manage game state synchronization
 * Single source of truth for player health, actions, and game status
 * Syncs state across components and with remote opponent via socket.io
 */
export function useGameState(roomId, players, isLocalHost = true) {
  // Game state
  const [gameState, setGameState] = useState({
    player1: {
      username: players[0]?.username || "Player 1",
      character: "King", // Always King Arthur
      health: 100,
      position: { x: 100, y: 250 },
      isAttacking: false,
      lastAction: null,
      isDead: false,
    },
    player2: {
      username: players[1]?.username || "Player 2",
      character: "Kenji", // Always Shadow Ninja
      health: 100,
      position: { x: 700, y: 250 },
      isAttacking: false,
      lastAction: null,
      isDead: false,
    },
    gameStatus: "playing", // playing, won, lost, tie
    winner: null,
    round: 1,
    timeRemaining: 300, // 5 minutes
  });

  const gameStateRef = useRef(gameState);
  const playerIndexRef = useRef(isLocalHost ? 0 : 1); // 0 for player1, 1 for player2

  // Update ref whenever gameState changes (for socket handlers)
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  /**
   * Update player health - called when damage is dealt
   * @param {string} playerKey - "player1" or "player2"
   * @param {number} damage - damage amount to subtract
   */
  const updateHealth = useCallback((playerKey, damage) => {
    setGameState((prev) => {
      const newHealth = Math.max(0, prev[playerKey].health - damage);
      const isDead = newHealth <= 0;

      return {
        ...prev,
        [playerKey]: {
          ...prev[playerKey],
          health: newHealth,
          isDead,
        },
      };
    });
  }, []);

  /**
   * Broadcast player action to opponent
   * @param {string} action - action type (attack1, attack2, move, block, etc.)
   * @param {object} data - additional action data
   */
  const broadcastAction = useCallback(
    (action, data = {}) => {
      if (!roomId) return;

      // Determine which player is local
      const playerKey = isLocalHost ? "player1" : "player2";

      // Emit to server
      socket.emit("game-action", {
        roomId,
        playerKey,
        action,
        timestamp: Date.now(),
        ...data,
      });

      // Update local state
      setGameState((prev) => ({
        ...prev,
        [playerKey]: {
          ...prev[playerKey],
          lastAction: action,
          isAttacking: action.includes("attack"),
        },
      }));
    },
    [roomId, isLocalHost],
  );

  /**
   * Handle incoming action from opponent
   */
  const handleOpponentAction = useCallback((payload) => {
    const { playerKey, action, data } = payload;

    setGameState((prev) => ({
      ...prev,
      [playerKey]: {
        ...prev[playerKey],
        lastAction: action,
        isAttacking: action.includes("attack"),
        ...(data || {}),
      },
    }));
  }, []);

  /**
   * Detect winner and broadcast game-over
   */
  const checkWinnerAndBroadcast = useCallback(() => {
    const { player1, player2 } = gameStateRef.current;

    if (player1.isDead || player2.isDead) {
      let status = "playing";
      let winner = null;

      if (player1.isDead && !player2.isDead) {
        status = "lost"; // Local player lost
        winner = "player2";
      } else if (!player1.isDead && player2.isDead) {
        status = "won"; // Local player won
        winner = "player1";
      } else if (player1.isDead && player2.isDead) {
        status = "tie";
      }

      setGameState((prev) => ({
        ...prev,
        gameStatus: status,
        winner,
      }));

      // Broadcast game over event
      if (status !== "playing") {
        socket.emit("game-over", {
          roomId,
          winner,
          player1Health: player1.health,
          player2Health: player2.health,
        });
      }

      return status !== "playing";
    }

    return false;
  }, [roomId]);

  /**
   * Handle incoming damage from opponent
   */
  const handleOpponentDamage = useCallback((payload) => {
    const { playerKey, damage } = payload;

    setGameState((prev) => {
      const newHealth = Math.max(0, prev[playerKey].health - damage);
      const isDead = newHealth <= 0;

      return {
        ...prev,
        [playerKey]: {
          ...prev[playerKey],
          health: newHealth,
          isDead,
        },
      };
    });
  }, []);

  /**
   * Handle game-over event from opponent
   */
  const handleGameOver = useCallback(
    (payload) => {
      const { winner, player1Health, player2Health } = payload;

      let status = "playing";
      if (isLocalHost && winner === "player1") status = "won";
      else if (isLocalHost && winner === "player2") status = "lost";
      else if (!isLocalHost && winner === "player1") status = "lost";
      else if (!isLocalHost && winner === "player2") status = "won";
      else if (!winner) status = "tie";

      setGameState((prev) => ({
        ...prev,
        gameStatus: status,
        winner,
        player1: { ...prev.player1, health: player1Health },
        player2: { ...prev.player2, health: player2Health },
      }));
    },
    [isLocalHost],
  );

  /**
   * Reset game state for new match
   */
  const resetGame = useCallback(() => {
    setGameState({
      player1: {
        username: players[0]?.username || "Player 1",
        character: "King",
        health: 100,
        position: { x: 100, y: 250 },
        isAttacking: false,
        lastAction: null,
        isDead: false,
      },
      player2: {
        username: players[1]?.username || "Player 2",
        character: "Kenji",
        health: 100,
        position: { x: 700, y: 250 },
        isAttacking: false,
        lastAction: null,
        isDead: false,
      },
      gameStatus: "playing",
      winner: null,
      round: 1,
      timeRemaining: 300,
    });
  }, [players]);

  // Socket listeners for fine-grained game events are handled in GameCanvas

  return {
    gameState,
    setGameState,
    updateHealth,
    broadcastAction,
    checkWinnerAndBroadcast,
    resetGame,
    playerIndex: playerIndexRef.current,
  };
}

export default useGameState;
