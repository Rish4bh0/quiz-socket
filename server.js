const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
const server = app.listen(4000, () => {
  console.log("Server is running on port 4000");
});

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const MAX_USERS = 6;
let users = {};

io.on("connection", (socket) => {
  if (Object.keys(users).length >= MAX_USERS) {
    socket.emit("userLimitReached", "Sorry, the room is full.");
    socket.disconnect(true);
    return;
  }

  console.log(`User connected: ${socket.id}`);
  users[socket.id] = {
    score: 0,
  };
  socket.emit("userConnected", socket.id);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    delete users[socket.id];
    io.emit("userDisconnected", socket.id);
  });

  socket.on("submitAnswer", (data) => {
    const { question, answer } = data;
    if (answer === question.correctAnswer) {
      users[socket.id].score += 1;
    }
    socket.emit("answerSubmitted");
    io.emit("userScores", users);
  });
});
