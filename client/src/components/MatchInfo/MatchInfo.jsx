import React from "react";
import "./MatchInfo.css";
import { Home, Users, Globe, Swords } from "lucide-react";

export default function MatchInfo() {
  return (
    <div className="match-info">
      <h3 className="info-title">MATCH INFO</h3>

      <div className="info-row">
        <div className="info-left">
          <Home size={18} />
          ROOM ID
        </div>
        <span>#AB123</span>
      </div>

      <div className="info-row">
        <div className="info-left">
          <Users size={18} />
          PLAYERS
        </div>
        <span>2 / 2</span>
      </div>

      <div className="info-row">
        <div className="info-left">
          <Globe size={18} />
          SERVER
        </div>
        <span>India</span>
      </div>

      <div className="info-row">
        <div className="info-left">
          <Swords size={18} />
          MODE
        </div>
        <span>1v1 Duel</span>
      </div>
    </div>
  );
}
