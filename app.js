const express = require("express");
const socket = require("socket.io");
const http = require("http");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const allusers = {};
let players = {};
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Royal duel" });
});

io.on("connection", function (socket) {
  //new use connection
  console.log("a new user connected");
  let role;
  if (!players.player1) {
    players.player1 = socket.id;
    console.log(`${players.player1} we got connected`);
    role = "player1";
    socket.emit("role", "player1");
  } else if (!players.player2) {
    players.player2 = socket.id;
    role = "player2";
    console.log(`${players.player2} we got connected`);
    socket.emit("role", "player2");
  } else {
    role = "spectator";
    socket.emit("role", "spectator");
  }
  // let count = Object.keys(allusers).length;
  // console.log(count);
  // if (count == 2) io.emit("joined", allusers);
  // <---------------webtrc-------------->

  socket.on("join-user", (username) => {
    console.log(`${username} joined socket connection`);
    console.log(username, socket.id);
    allusers[username] = { username, id: socket.id };
    // inform everyone that someone joined
    io.emit("joined", allusers);
  });

  socket.on("offer", ({ from, to, offer }) => {
    console.log({ from, to, offer });
    io.to(allusers[to].id).emit("offer", { from, to, offer });
  });

  socket.on("answer", ({ from, to, answer }) => {
    io.to(allusers[from].id).emit("answer", { from, to, answer });
  });

  socket.on("end-call", ({ from, to }) => {
    io.to(allusers[to].id).emit("end-call", { from, to });
  });

  socket.on("call-ended", (caller) => {
    const [from, to] = caller;
    io.to(allusers[from].id).emit("call-ended", caller);
    io.to(allusers[to].id).emit("call-ended", caller);
  });

  socket.on("icecandidate", (candidate) => {
    console.log({ candidate });
    //broadcast to other peers
    socket.broadcast.emit("icecandidate", candidate);
  });
  // <---------game movement------>
  // move
  socket.on("keydown", ({ key, role }) => {
    // Send this to all clients except sender
    console.log(`${key} and ${role}`);
    io.emit("remoteKeydown", { key, role });
  });
  socket.on("keyup", ({ key, role }) => {
    // Send this to all clients except sender
    console.log(`${key} and ${role}`);
    io.emit("remoteKeyup", { key, role });
  });

  //disconnection
  socket.on("disconnect", function () {
    console.log("disconnected");
    if (socket.id === players.player1 || socket.id === players.player2) {
      delete players.player1;
      delete players.player2;
    }
  });
});

server.listen(8000, () => {
  console.log("server listening to port 8000");
});
