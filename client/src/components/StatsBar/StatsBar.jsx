import React from "react";
import "./StatsBar.css";
import { Zap, Target, Flame, Bomb, Trophy } from "lucide-react";

export default function StatsBar() {
  return (
    <div className="stats-strip">
      <div className="stat-item ping">
        <Zap size={26} />
        <div>
          <h3>32ms</h3>
          <p>PING</p>
        </div>
      </div>

      <div className="divider"></div>

      <div className="stat-item hits">
        <Target size={26} />
        <div>
          <h3>12</h3>
          <p>HITS</p>
        </div>
      </div>

      <div className="divider"></div>

      <div className="stat-item combo">
        <Flame size={26} />
        <div>
          <h3>x4</h3>
          <p>COMBO</p>
        </div>
      </div>

      <div className="divider"></div>

      <div className="stat-item damage">
        <Bomb size={26} />
        <div>
          <h3>324</h3>
          <p>DAMAGE</p>
        </div>
      </div>

      <div className="divider"></div>

      <div className="stat-item round">
        <Trophy size={26} />
        <div>
          <h3>2 / 3</h3>
          <p>ROUND</p>
        </div>
      </div>
    </div>
  );
}
