import React, { useEffect, useRef } from "react";
import "./PlayerCard.css";
import { Crown, Wifi, Mic, MicOff } from "lucide-react";

/**
 * PlayerCard Component - Displays player information and health
 * Shows:
 * - Character name (King Arthur or Shadow Ninja - Kenji)
 * - Player username
 * - Health bar synchronized with game engine
 * - Ping/connection status
 * - Audio status
 * - Video stream
 */
export default function PlayerCard({
  player = "King Arthur", // Character name: "King Arthur" or "Kenji"
  label = "PLAYER 1", // "PLAYER 1" or "PLAYER 2"
  username = "Anonymous", // Player username
  health = 100, // Health from game state (0-100)
  ping = 0, // Ping in milliseconds
  side = "left", // "left" or "right"
  stream = null, // Video stream
  videoEnabled = true, // Is camera on
  audioEnabled = true, // Is mic on
  muted = false, // Is video muted (for local player)
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

  // Determine character display name
  const getCharacterDisplay = () => {
    if (player === "King" || player.includes("King")) {
      return "King Arthur";
    } else if (player === "Kenji" || player.includes("Kenji")) {
      return "Shadow Ninja";
    }
    return player || "Unknown";
  };

  // Determine health color based on current value
  const getHealthColor = () => {
    if (health > 50) return "#4ade80"; // Green
    if (health > 25) return "#facc15"; // Yellow
    return "#ef4444"; // Red
  };

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
          className="video-element"
          autoPlay
          playsInline
          muted={muted}
        />

        {(!stream || !videoEnabled) && (
          <div className="video-off-overlay">
            {videoEnabled ? "CONNECTING VIDEO" : "CAMERA OFF"}
          </div>
        )}
      </div>

      <div className="player-info">
        <div className="character-name">
          <Crown size={18} />
          {getCharacterDisplay()}
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

      {/* Health Section - Real-time synchronized with game engine */}
      <div className="health-section">
        <div className="health-top">
          <span>HEALTH</span>
          <span>{Math.max(0, Math.round(health))}%</span>
        </div>

        <div className="health-bar">
          <div
            className="health-fill"
            style={{
              width: `${Math.max(0, Math.min(100, health))}%`,
              backgroundColor: getHealthColor(),
              transition: "width 0.3s ease, background-color 0.3s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}
