import React, { useCallback, useEffect, useRef, useState } from "react";
import "./GamePage.css";
import { useLocation, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar/Navbar";
import PlayerCard from "../components/PlayerCard/PlayerCard";
import Arena from "../components/GameArena/Arena";
import MatchStats from "../components/MatchStats/MatchStats";
import MatchInfo from "../components/MatchInfo/MatchInfo";
import ControlPanel from "../components/ControlPanel/ControlPanel";
import StatsStrip from "../components/StatsBar/StatsBar";
import OpponentLeftModal from "../components/OpponentLeftModal";
import socket from "../services/socket";
import {
  createOffer,
  initializePeerConnection,
  sendIceCandidate,
  sendOffer,
  setupSignaling,
} from "../services/webrtc";

export default function GamePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [indiaTime, setIndiaTime] = useState("");
  const [showOpponentLeftModal, setShowOpponentLeftModal] = useState(false);
  const [players, setPlayers] = useState(location.state?.players || []);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isOpponentCameraOn, setIsOpponentCameraOn] = useState(true);
  const [isOpponentMicOn, setIsOpponentMicOn] = useState(true);
  const [mediaError, setMediaError] = useState("");
  const [roomId, setRoomId] = useState(location.state?.roomId || "");
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const signalingCleanupRef = useRef(null);
  const offerSentRef = useRef(false);

  // Update India time every second
  useEffect(() => {
    const updateIndiaTime = () => {
      const now = new Date();
      const indiaTimeString = new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      }).format(now);
      setIndiaTime(indiaTimeString);
    };

    updateIndiaTime();
    const interval = setInterval(updateIndiaTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle leave game
  const handleLeaveGame = () => {
    socket.emit("leave-game");
    navigate("/");
  };

  const handleToggleCamera = () => {
    const nextCameraState = !isCameraOn;

    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = nextCameraState;
    });

    setIsCameraOn(nextCameraState);

    if (roomId) {
      socket.emit("video-visibility-changed", {
        roomId,
        enabled: nextCameraState,
      });
    }
  };

  const handleToggleMic = () => {
    const nextMicState = !isMicOn;

    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = nextMicState;
    });

    setIsMicOn(nextMicState);

    if (roomId) {
      socket.emit("audio-visibility-changed", {
        roomId,
        enabled: nextMicState,
      });
    }
  };

  const startOffer = useCallback(
    async (rid, playerList) => {
      const peerConnection = peerConnectionRef.current;

      if (
        !peerConnection ||
        offerSentRef.current ||
        playerList[0]?.socketId !== socket.id ||
        playerList.length < 2
      ) {
        return;
      }

      const offer = await createOffer(peerConnection);

      if (offer) {
        offerSentRef.current = true;
        sendOffer(rid, offer);
      }
    },
    [],
  );

  const initializeWebRTC = useCallback(async (rid, playerList) => {
    if (!rid || peerConnectionRef.current) {
      return;
    }

    let stream = null;

    try {
      stream = await navigator.mediaDevices?.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      stream.getVideoTracks().forEach((track) => {
        track.enabled = isCameraOn;
      });
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isMicOn;
      });
    } catch (error) {
      console.error("Error accessing media devices:", error);
      setMediaError(
        "Camera or microphone access failed. Allow permissions and refresh to enable video.",
      );
    }

    const peerConnection = initializePeerConnection(
      setRemoteStream,
      (candidate) => sendIceCandidate(rid, candidate),
      stream,
    );

    if (!stream) {
      peerConnection.addTransceiver("video", { direction: "recvonly" });
      peerConnection.addTransceiver("audio", { direction: "recvonly" });
    }

    peerConnectionRef.current = peerConnection;
    signalingCleanupRef.current = setupSignaling(peerConnection, rid);
    socket.emit("webrtc-ready", { roomId: rid });
  }, []);

  // Initialize from route state after both players enter the game
  useEffect(() => {
    const rid = location.state?.roomId;
    const playerList = location.state?.players || [];

    if (!rid || playerList.length < 2) {
      navigate("/");
      return undefined;
    }

    setRoomId(rid);
    setPlayers(playerList);
    initializeWebRTC(rid, playerList);

    const handlePeerReady = () => startOffer(rid, playerList);
    const handleOpponentLeft = () => setShowOpponentLeftModal(true);
    const handleOpponentVideoVisibility = ({ enabled }) => {
      setIsOpponentCameraOn(enabled);
    };
    const handleOpponentAudioVisibility = ({ enabled }) => {
      setIsOpponentMicOn(enabled);
    };

    socket.on("webrtc-peer-ready", handlePeerReady);
    socket.on("opponent-left", handleOpponentLeft);
    socket.on(
      "opponent-video-visibility-changed",
      handleOpponentVideoVisibility,
    );
    socket.on(
      "opponent-audio-visibility-changed",
      handleOpponentAudioVisibility,
    );

    return () => {
      socket.off("webrtc-peer-ready", handlePeerReady);
      socket.off("opponent-left", handleOpponentLeft);
      socket.off(
        "opponent-video-visibility-changed",
        handleOpponentVideoVisibility,
      );
      socket.off(
        "opponent-audio-visibility-changed",
        handleOpponentAudioVisibility,
      );
    };
  }, [initializeWebRTC, location.state, navigate, startOffer]);

  // Cleanup media and WebRTC resources
  useEffect(() => {
    return () => {
      signalingCleanupRef.current?.();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnectionRef.current?.close();
    };
  }, []);

  // Handle modal close
  const handleModalClose = () => {
    setShowOpponentLeftModal(false);
    navigate("/");
  };

  const localPlayer = players.find((player) => player.socketId === socket.id);
  const opponentPlayer = players.find((player) => player.socketId !== socket.id);
  const getPlayerProfile = (player) => {
    const playerIndex = players.findIndex(
      (entry) => entry.socketId === player?.socketId,
    );

    if (playerIndex === 0) {
      return {
        character: "KING ARTHUR",
        health: 95,
        ping: 32,
      };
    }

    return {
      character: "SHADOW NINJA",
      health: 80,
      ping: 28,
    };
  };
  const localProfile = getPlayerProfile(localPlayer);
  const opponentProfile = getPlayerProfile(opponentPlayer);

  return (
    <div className="game-page">
      <OpponentLeftModal
        show={showOpponentLeftModal}
        onClose={handleModalClose}
      />
      <Navbar />
      {mediaError && <div className="media-error">{mediaError}</div>}

      {/* Top Section */}
      <div className="main-row">
        <PlayerCard
          label="OPPONENT"
          player={opponentProfile.character}
          username={opponentPlayer?.username || "Waiting..."}
          health={opponentProfile.health}
          ping={opponentProfile.ping}
          side="left"
          stream={remoteStream}
          videoEnabled={isOpponentCameraOn}
          audioEnabled={isOpponentMicOn}
          muted={false}
        />

        <div className="center-column">
          <Arena />
          <StatsStrip />
        </div>

        <PlayerCard
          label="YOU"
          player={localProfile.character}
          username={localPlayer?.username || "You"}
          health={localProfile.health}
          ping={localProfile.ping}
          side="right"
          stream={localStream}
          videoEnabled={isCameraOn}
          audioEnabled={isMicOn}
          muted
        />
      </div>

      {/* Bottom Section */}
      <div className="bottom-row">
        <MatchStats indiaTime={indiaTime} />

        <ControlPanel
          micEnabled={isMicOn}
          cameraEnabled={isCameraOn}
          onToggleMic={handleToggleMic}
          onToggleCamera={handleToggleCamera}
          onLeave={handleLeaveGame}
        />

        <MatchInfo />
      </div>
    </div>
  );
}
