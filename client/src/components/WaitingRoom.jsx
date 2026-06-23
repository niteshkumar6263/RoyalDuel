import React from "react";

export default function WaitingRoom({ roomId, copied, copyCode }) {
  return (
    <div className="waiting-room">
      <h1>Room Created</h1>

      <div className="room-id">{roomId}</div>

      <p>Share this code with your friend</p>

      <button className="copy-btn" onClick={copyCode}>
        {copied ? "Copied ✓" : "Copy Code"}
      </button>

      <p>Waiting for opponent...</p>

      <div className="loader"></div>
    </div>
  );
}
