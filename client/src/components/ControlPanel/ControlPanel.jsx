import React from "react";
import "./ControlPanel.css";

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Repeat,
  Settings,
  PhoneOff,
} from "lucide-react";

export default function ControlPanel({
  micEnabled = true,
  cameraEnabled = true,
  onToggleMic,
  onToggleCamera,
  onLeave,
}) {
  const MicIcon = micEnabled ? Mic : MicOff;
  const CameraIcon = cameraEnabled ? Video : VideoOff;

  return (
    <div className="control-panel">
      <button
        className={`control-btn purple ${micEnabled ? "" : "off"}`}
        onClick={onToggleMic}
      >
        <MicIcon />
        <span>{micEnabled ? "MIC" : "MUTED"}</span>
      </button>

      <button
        className={`control-btn blue ${cameraEnabled ? "" : "off"}`}
        onClick={onToggleCamera}
      >
        <CameraIcon />
        <span>{cameraEnabled ? "CAMERA" : "CAM OFF"}</span>
      </button>

      <button className="control-btn cyan">
        <Repeat />
        <span>SHARE</span>
      </button>

      <button className="control-btn orange">
        <Settings />
        <span>SETTINGS</span>
      </button>

      <button className="control-btn red" onClick={onLeave}>
        <PhoneOff />
        <span>LEAVE</span>
      </button>
    </div>
  );
}
