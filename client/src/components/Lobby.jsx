import React from "react";
import { Video, Zap, Globe } from "lucide-react";

export default function Lobby({
  username,
  setUsername,
  createRoom,
  setShowJoin,
  error,
  loading,
}) {
  return (
    <>
      <h1 className="title">⚔ ROYAL DUEL ⚔</h1>

      <p className="subtitle">Real-Time Multiplayer Fighting Game</p>

      <input
        className="username-input"
        placeholder="Enter Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={loading}
      />

      {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}

      <div className="btn-group">
        <button
          className="create-btn"
          disabled={!username.trim() || loading}
          onClick={createRoom}
        >
          {loading ? "Creating..." : "Create Room"}
        </button>

        <button
          className="join-btn"
          disabled={!username.trim() || loading}
          onClick={() => setShowJoin(true)}
        >
          Join Room
        </button>
      </div>

      <div className="features">
        <div className="feature-item">
          <Video />
          <span>Video Call</span>
        </div>

        <div className="feature-item">
          <Zap />
          <span>Socket.IO</span>
        </div>

        <div className="feature-item">
          <Globe />
          <span>Real-Time Sync</span>
        </div>
      </div>
    </>
  );
}
