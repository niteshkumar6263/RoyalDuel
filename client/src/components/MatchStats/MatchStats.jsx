import React from "react";
import "./MatchStats.css";
import { Swords, Flame, Target, Clock3 } from "lucide-react";

export default function MatchStats({ indiaTime = "00:00:00 AM" }) {
  return (
    <div className="match-stats">
      <h3 className="stats-title">MATCH STATS</h3>

      <div className="stats-row">
        <div className="stats-left">
          <Swords size={20} />
          <span>TOTAL DAMAGE</span>
        </div>
        <span>324</span>
      </div>

      <div className="stats-row">
        <div className="stats-left">
          <Flame size={20} />
          <span>HIGHEST COMBO</span>
        </div>
        <span>8</span>
      </div>

      <div className="stats-row">
        <div className="stats-left">
          <Target size={20} />
          <span>ACCURACY</span>
        </div>
        <span>81%</span>
      </div>

      <div className="stats-row">
        <div className="stats-left">
          <Clock3 size={20} />
          <span>MATCH TIME</span>
        </div>
        <span>{indiaTime}</span>
      </div>
    </div>
  );
}
