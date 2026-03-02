require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Entry = require("./models/Entry");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for the demo
    methods: ["GET", "POST"],
  },
});

// MongoDB Connection
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/gate-guard";
const JWT_SECRET =
  process.env.JWT_SECRET || "secure_jwt_secret_key_mock_for_demo";

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    // Initialize default users if db is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log("Initializing default users...");
      const hashedAdminPassword = bcrypt.hashSync("admin123", 10);
      const hashedGuardPassword = bcrypt.hashSync("guard123", 10);
      const hashedResidentPassword = bcrypt.hashSync("resident123", 10);

      await User.insertMany([
        {
          id: "A1",
          role: "ADMIN",
          name: "System Admin",
          email: "admin@system.com",
          passwordHash: hashedAdminPassword,
        },
        {
          id: "G1",
          role: "GUARD",
          name: "Guard Rakesh",
          email: "rakesh@guard.com",
          passwordHash: hashedGuardPassword,
        },
        {
          id: "R1",
          role: "RESIDENT",
          name: "Resident A",
          email: "resi101@society.com",
          houseId: "101",
          passwordHash: hashedResidentPassword,
        },
      ]);
      console.log("Default users created.");
    }
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// -- REST API ROUTES --

// POST /api/auth/signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { role, name, email, password, houseId } = req.body;
    if (!role || !name || !email || !password)
      return res.status(400).json({ error: "All fields are required" });
    if (role === "RESIDENT" && !houseId)
      return res
        .status(400)
        .json({ error: "House ID is required for Residents" });

    const sanitizedEmail = email.trim().toLowerCase();
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(sanitizedEmail)) {
      return res
        .status(400)
        .json({
          error:
            "Registration failed: Only official @gmail.com addresses are permitted.",
        });
    }

    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser)
      return res
        .status(400)
        .json({ error: "An account with this email already exists" });

    if (role === "ADMIN") {
      const adminCount = await User.countDocuments({ role: "ADMIN" });
      if (adminCount >= 5)
        return res
          .status(403)
          .json({
            error:
              "403 Forbidden: Maximum limit of 5 Admin accounts has been reached.",
          });
    }

    if (role === "RESIDENT") {
      const existingHouse = await User.findOne({ role: "RESIDENT", houseId });
      if (existingHouse)
        return res
          .status(400)
          .json({
            error: `An account already exists for House No: ${houseId}`,
          });
    }

    const newUser = new User({
      id: `${role.charAt(0)}${Date.now()}`,
      role,
      name: name.trim(),
      email: sanitizedEmail,
      houseId: houseId || null,
      passwordHash: bcrypt.hashSync(password, 10),
    });

    await newUser.save();
    res.json({
      success: true,
      message: "Account created successfully. Please log in.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const sanitizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: sanitizedEmail });
    if (!user)
      return res
        .status(401)
        .json({ error: "Invalid credentials or user not found" });

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    const tokenPayload = {
      id: user.id,
      role: user.role,
      name: user.name,
      houseId: user.houseId || null,
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: tokenPayload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/entries
app.get("/api/entries", async (req, res) => {
  try {
    const entries = await Entry.find().sort({ entryTime: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -- WEBSOCKETS LOGIC --

io.use((socket, next) => {
  const user = socket.handshake.auth.user;
  if (!user) {
    return next(new Error("Unauthorized"));
  }
  socket.user = user;
  next();
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}, Role: ${socket.user.role}`);

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
  socket.on("new_visitor", async (data) => {
    try {
      // Save it to MongoDB
      const newEntry = new Entry(data);
      await newEntry.save();

      console.log(
        `New visitor for House ${data.houseId}: ${data.guestName} saved to DB`,
      );

      // Push real-time event exactly to the resident associated with houseId
      io.to(`house_${data.houseId}`).emit("visitor_alert", data);

      // Also push to all other guards so their queues stay synced
      socket.to("guards_room").emit("visitor_alert", data);
    } catch (err) {
      console.error("Error saving new visitor event:", err.message);
    }
  });

  // Resident approves/rejects
  socket.on("update_visitor_status", async (data) => {
    try {
      // Update in MongoDB
      await Entry.findOneAndUpdate({ id: data.id }, { status: data.status });
      console.log(`Visitor ${data.id} status updated to ${data.status} in DB`);

      // Notify all guards
      io.to("guards_room").emit("status_updated", data);

      // Need to notify the resident themselves so they stay in sync if multiple tabs are open (or other devices)
      if (socket.user && socket.user.houseId) {
        socket.to(`house_${socket.user.houseId}`).emit("status_updated", data);
      }
    } catch (err) {
      console.error("Error updating visitor status:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Real-Time Socket Server running on port ${PORT}`);
});
