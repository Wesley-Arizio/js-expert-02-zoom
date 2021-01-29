const http = require("http").createServer((request, response) => {
  response.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
  });
  response.end("Salve");
});

const socketIo = require("socket.io");
const io = socketIo(http, {
  cors: {
    origin: "*",
    credentials: false,
  },
});

io.on("connection", (socket) => {
  console.log("connection", socket.id);
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);
    socket.on("disconnect", () => {
      console.log("disconnect ", roomId, userId);
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
});

const startServer = () => {
  const { address, port } = http.address();
  console.info(`App running at ${address}:${port}`);
};

http.listen(3000, startServer);
