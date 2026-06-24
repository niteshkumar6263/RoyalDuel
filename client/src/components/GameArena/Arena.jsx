import React from "react";
import "./Arena.css";
import GameCanvas from "../../GameCanvas";

/**
 * Arena Component - Main game battle screen
 * Manages:
 * - Game canvas rendering via GameCanvas
 * - Timer for the match
 * - Real-time health synchronization
 * - Socket.io event broadcasting and receiving
 * - Winner detection and game-over state
 */
export default function Arena({
  gameState,
  onGameStateUpdate,
  roomId,
  isLocalHost,
}) {
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Determine round indicator display
  const getRoundIndicators = () => {
    const rounds = [false, false, false];
    if (gameState.round >= 1) rounds[0] = true;
    if (gameState.round >= 2) rounds[1] = true;
    if (gameState.round >= 3) rounds[2] = true;
    return rounds;
  };

  const playerRounds = getRoundIndicators();
  const enemyRounds = getRoundIndicators().reverse();
  const localPlayerKey = isLocalHost ? "player1" : "player2";
  const opponentPlayerKey = isLocalHost ? "player2" : "player1";
  const healthWinner =
    gameState.player1.health <= 0
      ? "player2"
      : gameState.player2.health <= 0
        ? "player1"
        : null;
  const winner = gameState.winner || healthWinner;
  const isGameFinished = gameState.gameStatus !== "playing" || !!winner;
  const resultTitle = !winner
    ? "MATCH DRAW"
    : winner === localPlayerKey
      ? "YOU WIN"
      : "OPPONENT WINS";
  const winnerName = winner
    ? gameState[winner]?.username || winner.toUpperCase()
    : "No winner";

  return (
    <div className="arena">
      {/* Top section with round indicators and timer */}
      <div className="arena-top">
        {/* Player 1 round indicator */}
        <div className="round-indicator">
          <span className={playerRounds[0] ? "active" : ""}></span>
          <span className={playerRounds[1] ? "active" : ""}></span>
          <span className={playerRounds[2] ? "active" : ""}></span>
        </div>

        {/* Timer section */}
        <div className="timer-box">
          <h1>{formatTime(gameState.timeRemaining)}</h1>
          <p>
            ROUND {gameState.round} / 3
            {gameState.gameStatus !== "playing" && (
              <span className="game-status">
                {gameState.gameStatus === "won" && " - YOU WIN! 🎉"}
                {gameState.gameStatus === "lost" && " - YOU LOST"}
                {gameState.gameStatus === "tie" && " - TIE"}
              </span>
            )}
          </p>
        </div>

        {/* Enemy round indicator */}
        <div className="round-indicator">
          <span className={enemyRounds[0] ? "enemy-active" : ""}></span>
          <span className={enemyRounds[1] ? "enemy-active" : ""}></span>
          <span className={enemyRounds[2] ? "enemy-active" : ""}></span>
        </div>
      </div>

      {/* Game canvas - where the actual battle is rendered */}
      <div className="game-screen">
        <GameCanvas
          gameState={gameState}
          onGameStateUpdate={onGameStateUpdate}
          roomId={roomId}
          isGameOver={isGameFinished}
          isLocalHost={isLocalHost}
        />

        {isGameFinished && (
          <div className="winner-overlay">
            <div className="winner-panel">
              <span className="winner-kicker">MATCH OVER</span>
              <h2>{resultTitle}</h2>
              <p>
                Winner:{" "}
                <strong>
                  {winner === localPlayerKey
                    ? "You"
                    : winner === opponentPlayerKey
                      ? "Opponent"
                      : winnerName}
                </strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
