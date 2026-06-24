import React from "react";
import "./Navbar.css";
import { Volume2, Users, Settings } from "lucide-react";

export default function Navbar({ roomId = "" }) {
  const displayRoomId = roomId ? `#${roomId}` : "Joining...";

  return (
    <header className="navbar">
      <div className="room-card">
        <p className="room-label">ROOM ID</p>
        <h3>{displayRoomId}</h3>
      </div>

      <div className="logo-section">
        <h1>⚔ ROYAL DUEL ⚔</h1>
        <p>REAL-TIME MULTIPLAYER FIGHTING</p>
      </div>

      <div className="nav-right">
        <button className="icon-btn">
          <Volume2 size={18} />
        </button>

        <button className="icon-btn">
          <Users size={18} />
        </button>

        <button className="icon-btn">
          <Settings size={18} />
        </button>

        <div className="online-box">
          <span className="online-dot"></span>
          Online
        </div>
      </div>
    </header>
  );
}
