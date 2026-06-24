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
import { useGameState } from "../hooks/useGameState";
import {
  createOffer,
  initializePeerConnection,
  sendIceCandidate,
  sendOffer,
  setupSignaling,
} from "../services/webrtc";

/**
 * GamePage - Main game container
 * Manages:
 * - Game state via useGameState hook
 * - Player information and health
 * - WebRTC video/audio streams
 * - Game-over detection
 * - Room synchronization
 */
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

  // Initialize game state - single source of truth for health and game status
  const isLocalHost = players[0]?.socketId === socket.id;
  const {
    gameState,
    setGameState,
    updateHealth,
    broadcastAction,
    checkWinnerAndBroadcast,
    resetGame,
  } = useGameState(roomId, players, isLocalHost);

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
    socket.emit("leave-game", { roomId });
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

  const startOffer = useCallback(async (rid, playerList) => {
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
  }, []);

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
        track.enabled = true; // Default to enabled
      });
      stream.getAudioTracks().forEach((track) => {
        track.enabled = true; // Default to enabled
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
  const opponentPlayer = players.find(
    (player) => player.socketId !== socket.id,
  );

  return (
    <div className="game-page">
      <OpponentLeftModal
        show={showOpponentLeftModal}
        onClose={handleModalClose}
      />
      <Navbar roomId={roomId} />
      {mediaError && <div className="media-error">{mediaError}</div>}

      {/* Top Section */}
      <div className="main-row">
        {/* Left: opponent */}
        <PlayerCard
          label="OPPONENT"
          player={
            isLocalHost
              ? gameState.player2.character
              : gameState.player1.character
          }
          username={
            isLocalHost
              ? gameState.player2.username
              : gameState.player1.username
          }
          health={
            isLocalHost ? gameState.player2.health : gameState.player1.health
          }
          ping={32}
          side="left"
          stream={remoteStream}
          videoEnabled={isOpponentCameraOn}
          audioEnabled={isOpponentMicOn}
          muted={false}
        />

        {/* Center: Game Arena and Stats */}
        <div className="center-column">
          <Arena
            gameState={gameState}
            onGameStateUpdate={setGameState}
            isLocalHost={isLocalHost}
            roomId={roomId}
          />
          <StatsStrip />
        </div>

        {/* Right: local player */}
        <PlayerCard
          label="YOU"
          player={
            isLocalHost
              ? gameState.player1.character
              : gameState.player2.character
          }
          username={
            isLocalHost
              ? gameState.player1.username
              : gameState.player2.username
          }
          health={
            isLocalHost ? gameState.player1.health : gameState.player2.health
          }
          ping={28}
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

        <MatchInfo roomId={roomId} />
      </div>
    </div>
  );
}
