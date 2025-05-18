import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "https://collaborative-whiteboard-teal.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store active rooms and their shapes
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join room
  socket.on("room:join", ({ user, roomId }) => {
    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        name: `Room ${roomId.substring(0, 5)}`,
        users: [],
        shapes: [],
        background: {
          type: "color",
          value: "#ffffff",
        },
      });
    }

    const room = rooms.get(roomId);

    // Add user to room
    room.users.push(user);

    // Join socket room
    socket.join(roomId);

    // Store user info on socket
    socket.data.user = user;
    socket.data.roomId = roomId;

    // Send room info to the user
    socket.emit("room:joined", {
      room: {
        id: room.id,
        name: room.name,
        users: room.users,
        background: room.background,
      },
      user,
    });

    // Broadcast to other users in room
    socket.to(roomId).emit("user:joined", user);

    // Send current shapes to the new user
    socket.emit("shapes:init", room.shapes);

    console.log(`User ${user.name} joined room ${roomId}`);
  });

  // Leave room
  socket.on("room:leave", ({ roomId }) => {
    handleUserLeaving(socket);
  });

  // Cursor movement
  socket.on("cursor:move", ({ roomId, userId, x, y }) => {
    socket.to(roomId).emit("cursor:move", { userId, x, y });
  });

  // Shape operations
  socket.on("shape:add", ({ roomId, shape }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.shapes.push(shape);
    socket.to(roomId).emit("shape:added", shape);
  });

  socket.on("shape:update", ({ roomId, shapeId, changes }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const shapeIndex = room.shapes.findIndex((shape) => shape.id === shapeId);
    if (shapeIndex === -1) return;

    room.shapes[shapeIndex] = { ...room.shapes[shapeIndex], ...changes };
    socket.to(roomId).emit("shape:updated", { shapeId, changes });
  });

  socket.on("shape:delete", ({ roomId, shapeId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.shapes = room.shapes.filter((shape) => shape.id !== shapeId);
    socket.to(roomId).emit("shape:deleted", shapeId);
  });

  socket.on("shapes:clear", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.shapes = [];
    socket.to(roomId).emit("shapes:cleared");
  });

  // Background update
  socket.on("background:update", ({ roomId, background }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.background = background;
    socket.to(roomId).emit("background:updated", background);
  });

  // Disconnect
  socket.on("disconnect", () => {
    handleUserLeaving(socket);
    console.log("A user disconnected:", socket.id);
  });
});

// Handle user leaving (from disconnect or explicit leave)
function handleUserLeaving(socket) {
  const { user, roomId } = socket.data;
  if (!user || !roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  // Remove user from room
  room.users = room.users.filter((u) => u.id !== user.id);

  // Broadcast to other users in room
  socket.to(roomId).emit("user:left", user.id);

  // Leave socket room
  socket.leave(roomId);

  console.log(`User ${user.name} left room ${roomId}`);

  // Clean up empty rooms
  if (room.users.length === 0) {
    rooms.delete(roomId);
    console.log(`Room ${roomId} deleted (empty)`);
  }

  // Clear user data from socket
  delete socket.data.user;
  delete socket.data.roomId;
}

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
