import React from "react";

export default function JoinRoomModal({
  showJoin,
  joinRoomId,
  setJoinRoomId,
  setShowJoin,
  joinRoom,
  error,
  loading,
}) {
  if (!showJoin) return null;

  return (
    <div className="modal-overlay">
      <div className="join-modal">
        <h2>Join Room</h2>

        <input
          placeholder="Enter Room ID"
          value={joinRoomId}
          onChange={(e) => setJoinRoomId(e.target.value)}
          disabled={loading}
        />

        {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}

        <div className="modal-btns">
          <button onClick={() => setShowJoin(false)} disabled={loading}>
            Cancel
          </button>

          <button onClick={joinRoom} disabled={loading}>
            {loading ? "Joining..." : "Join"}
          </button>
        </div>
      </div>
    </div>
  );
}
