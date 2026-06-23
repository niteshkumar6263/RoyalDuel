import React, { useEffect, useRef } from "react";
import "./PlayerCard.css";
import { Crown, Wifi, Mic, MicOff } from "lucide-react";

export default function PlayerCard({
  player,
  label,
  username,
  health,
  ping,
  side,
  stream,
  videoEnabled = true,
  audioEnabled = true,
  muted = false,
}) {
  const videoRef = useRef(null);

  // Handle video stream display
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null;

      if (stream) {
        videoRef.current.play().catch((error) => {
          console.warn("Video playback blocked:", error);
        });
      }
    }
  }, [stream]);

  return (
    <div className={`player-card ${side}`}>
      <div className="player-label">{label}</div>

      <div className="video-container">
        <div className="status-badge">
          <span className="status-dot"></span>
          CONNECTED
        </div>

        <video
          ref={videoRef}
          className={`video-element ${videoEnabled ? "" : "video-hidden"}`}
          autoPlay
          playsInline
          muted={muted}
        />

        {!videoEnabled && <div className="video-off-overlay">CAMERA OFF</div>}
      </div>

      <div className="player-info">
        <div className="character-name">
          <Crown size={18} />
          {player}
        </div>

        <div className="username">{username}</div>
      </div>

      <div className="player-meta">
        <div>
          <Wifi size={16} />
          {ping}ms
        </div>

        <div className={audioEnabled ? "" : "muted-meta"}>
          {audioEnabled ? <Mic size={16} /> : <MicOff size={16} />}
          <span>{audioEnabled ? "ON" : "MUTED"}</span>
        </div>
      </div>

      <div className="health-section">
        <div className="health-top">
          <span>HEALTH</span>
          <span>{health}%</span>
        </div>

        <div className="health-bar">
          <div className="health-fill" style={{ width: `${health}%` }} />
        </div>
      </div>
    </div>
  );
}
