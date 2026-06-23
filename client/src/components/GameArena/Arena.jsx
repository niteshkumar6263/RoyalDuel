import React, { useState, useEffect } from "react";
import "./Arena.css";
import GameCanvas from "../../gameCanvas";

export default function Arena() {
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes = 300 seconds

  // Countdown timer from 5 min to 0
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="arena">
      <div className="arena-top">
        <div className="round-indicator">
          <span className="active"></span>
          <span></span>
          <span></span>
        </div>

        <div className="timer-box">
          <h1>{formatTime(timeRemaining)}</h1>
          <p>ROUND 1 / 3</p>
        </div>

        <div className="round-indicator">
          <span></span>
          <span></span>
          <span className="enemy-active"></span>
        </div>
      </div>

      <div className="game-screen">
        <div className="game-placeholder">GAME CANVAS</div>
        {/* <GameCanvas /> */}
      </div>
    </div>
  );
}
