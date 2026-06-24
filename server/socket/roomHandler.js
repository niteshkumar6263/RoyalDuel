const rooms = {};
const gameHandler = require("./gameHandler");

function roomHandler(io, socket) {
  socket.on("create-room", ({ username }) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    rooms[roomId] = {
      host: socket.id,
      readySockets: [],
      peerReadySent: false,
      players: [
        {
          socketId: socket.id,
          username,
        },
      ],
    };

    socket.join(roomId);

    // Initialize game handlers for room creator
    gameHandler(io, socket, roomId);

    socket.emit("room-created", {
      roomId,
      players: rooms[roomId].players,
    });

    console.log("Room Created:", roomId);
  });

  socket.on("join-room", ({ roomId, username }) => {
    const room = rooms[roomId];

    if (!room) {
      return socket.emit("error-message", "Room not found");
    }

    if (room.players.length >= 2) {
      return socket.emit("error-message", "Room full");
    }

    room.players.push({
      socketId: socket.id,
      username,
    });

    socket.join(roomId);

    const payload = {
      roomId,
      players: room.players,
    };

    // When both players are in the room, initialize game handlers and start game
    if (room.players.length === 2) {
      io.to(roomId).emit("player-joined", payload);
      io.to(roomId).emit("game-start", payload);

      // Initialize game event handlers for this room
      // Game handlers will be called for both players in the room
      gameHandler(io, socket, roomId);
    } else {
      io.to(roomId).emit("player-joined", payload);
    }
  });

  socket.on("leave-game", () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(
        (p) => p.socketId === socket.id,
      );

      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        room.readySockets = room.readySockets.filter((id) => id !== socket.id);

        // Notify remaining player that opponent left
        io.to(roomId).emit("opponent-left", {
          message: "Opponent left the game",
        });

        // If no players left, delete the room
        if (room.players.length === 0) {
          delete rooms[roomId];
        }

        socket.leave(roomId);
        console.log("Player left room:", roomId);
        break;
      }
    }
  });

  // WebRTC signaling events
  socket.on("webrtc-offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("webrtc-offer", { offer });
  });

  socket.on("webrtc-answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("webrtc-answer", { answer });
  });

  socket.on("webrtc-ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("webrtc-ice-candidate", { candidate });
  });

  socket.on("video-visibility-changed", ({ roomId, enabled }) => {
    socket.to(roomId).emit("opponent-video-visibility-changed", { enabled });
  });

  socket.on("audio-visibility-changed", ({ roomId, enabled }) => {
    socket.to(roomId).emit("opponent-audio-visibility-changed", { enabled });
  });

  socket.on("webrtc-ready", ({ roomId }) => {
    const room = rooms[roomId];

    if (!room) {
      return;
    }

    if (!room.readySockets.includes(socket.id)) {
      room.readySockets.push(socket.id);
    }

    if (room.readySockets.length >= 2 && !room.peerReadySent) {
      room.peerReadySent = true;
      io.to(roomId).emit("webrtc-peer-ready");
    }
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      rooms[roomId].players = rooms[roomId].players.filter(
        (p) => p.socketId !== socket.id,
      );
      rooms[roomId].readySockets = rooms[roomId].readySockets.filter(
        (id) => id !== socket.id,
      );

      if (rooms[roomId].players.length === 0) {
        delete rooms[roomId];
      }
    }
  });
}

module.exports = roomHandler;
