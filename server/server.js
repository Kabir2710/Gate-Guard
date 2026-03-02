const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for the demo
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {
  // In a real app, verify JWT here
  // For this mock auth system, we expect the client to send user details during handshake
  const user = socket.handshake.auth.user;
  if (!user) {
    return next(new Error("Unauthorized"));
  }
  socket.user = user;
  next();
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}, Role: ${socket.user.role}`);

  // Map users to appropriate rooms based on their roles
  if (socket.user.role === "RESIDENT" && socket.user.houseId) {
    socket.join(`house_${socket.user.houseId}`);
    console.log(
      `Resident ${socket.user.name} joined room house_${socket.user.houseId}`,
    );
  } else if (socket.user.role === "GUARD") {
    socket.join("guards_room");
    console.log(`Guard ${socket.user.name} joined guards_room`);
  }

  // Guard emits new visitor entry
  socket.on("new_visitor", (data) => {
    // Expected data: { id, guestName, mobile, houseId, purpose, status, entryTime }
    console.log(`New visitor for House ${data.houseId}: ${data.guestName}`);
    // Push real-time event exactly to the resident associated with houseId
    io.to(`house_${data.houseId}`).emit("visitor_alert", data);
    // Also push to all other guards so their queues stay synced across different devices
    socket.to("guards_room").emit("visitor_alert", data);
  });

  // Resident approves/rejects
  socket.on("update_visitor_status", (data) => {
    // Expected data: { id, status }
    console.log(`Visitor ${data.id} status updated to ${data.status}`);
    // Notify all guards
    io.to("guards_room").emit("status_updated", data);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Real-Time Socket Server running on port ${PORT}`);
});
