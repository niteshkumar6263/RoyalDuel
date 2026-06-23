const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const roomHandler = require("./socket/roomHandler");
require("dotenv").config();

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("Royal Duel Server Running");
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  roomHandler(io, socket);

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
