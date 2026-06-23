import React, { useState, useEffect } from "react";

import "./HomePage.css";

import Lobby from "../components/Lobby";
import WaitingRoom from "../components/WaitingRoom";
import JoinRoomModal from "../components/JoinRoomModal";
import socket from "../services/socket";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [players, setPlayers] = useState([]);
  const [roomCreated, setRoomCreated] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const [showJoin, setShowJoin] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState("");

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Listen for room created event
    socket.on("room-created", ({ roomId, players }) => {
      setRoomId(roomId);
      setPlayers(players || []);
      setRoomCreated(true);
      setLoading(false);
      setError("");
      console.log("Room created:", roomId);
    });

    // Listen for player joined event
    socket.on("player-joined", ({ roomId, players }) => {
      console.log("Player joined:", players);
      setRoomId(roomId);
      setPlayers(players || []);
      setRoomCreated(true);
    });

    // Listen for game start event
    socket.on("game-start", ({ roomId: startedRoomId, players: startedPlayers }) => {
      console.log("Game starting!");
      navigate("/game", {
        state: {
          roomId: startedRoomId,
          username,
          players: startedPlayers || players,
        },
      });
    });

    // Listen for error messages
    socket.on("error-message", (message) => {
      setError(message);
      setLoading(false);
      console.error("Error:", message);
    });

    return () => {
      socket.off("room-created");
      socket.off("player-joined");
      socket.off("game-start");
      socket.off("error-message");
    };
  }, [navigate, players, username]);

  const createRoom = () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setLoading(true);
    setError("");
    socket.emit("create-room", { username });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const joinRoom = () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    if (!joinRoomId.trim()) {
      setError("Please enter a room ID");
      return;
    }

    setLoading(true);
    setError("");
    socket.emit("join-room", { roomId: joinRoomId, username });
    setShowJoin(false);
  };

  return (
    <div className="home-container">
      {!roomCreated ? (
        <Lobby
          username={username}
          setUsername={setUsername}
          createRoom={createRoom}
          setShowJoin={setShowJoin}
          error={error}
          loading={loading}
        />
      ) : (
        <WaitingRoom roomId={roomId} copied={copied} copyCode={copyCode} />
      )}

      <JoinRoomModal
        showJoin={showJoin}
        joinRoomId={joinRoomId}
        setJoinRoomId={setJoinRoomId}
        setShowJoin={setShowJoin}
        joinRoom={joinRoom}
        error={error}
        loading={loading}
      />
    </div>
  );
}
