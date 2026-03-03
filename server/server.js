require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

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

const JWT_SECRET =
  process.env.JWT_SECRET || "secure_jwt_secret_key_mock_for_demo";

// --- FIREBASE FIRESTORE CONNECTION ---
let db;
try {
  let serviceAccount;
  const serviceAccountPath = path.join(
    __dirname,
    "firebaseServiceAccountKey.json",
  );

  // If deployed on Vercel/Render, you might inject it as an environment variable
  // (e.g. stringified JSON named FIREBASE_SERVICE_ACCOUNT)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = require(serviceAccountPath);
  } else {
    throw new Error(
      "Missing firebaseServiceAccountKey.json file or FIREBASE_SERVICE_ACCOUNT environment variable.",
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  db = admin.firestore();
  console.log("Connected to Firebase Firestore Successfully.");

  // Initialize default users if users collection is empty
  const initializeUsers = async () => {
    try {
      const usersRef = db.collection("users");
      const snapshot = await usersRef.limit(1).get();
      if (snapshot.empty) {
        console.log("Initializing default users in Firebase...");
        const hashedAdminPassword = bcrypt.hashSync("admin123", 10);
        const hashedGuardPassword = bcrypt.hashSync("guard123", 10);
        const hashedResidentPassword = bcrypt.hashSync("resident123", 10);

        await usersRef
          .doc("A1")
          .set({
            id: "A1",
            role: "ADMIN",
            name: "System Admin",
            email: "admin@system.com",
            passwordHash: hashedAdminPassword,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        await usersRef
          .doc("G1")
          .set({
            id: "G1",
            role: "GUARD",
            name: "Guard Rakesh",
            email: "rakesh@guard.com",
            passwordHash: hashedGuardPassword,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        await usersRef
          .doc("R1")
          .set({
            id: "R1",
            role: "RESIDENT",
            name: "Resident A",
            email: "resi101@society.com",
            houseId: "101",
            passwordHash: hashedResidentPassword,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

        console.log("Default mock users created in Firestore.");
      }
    } catch (e) {
      console.error("Warning: Could not initialize default users.", e.message);
    }
  };

  initializeUsers();
} catch (err) {
  console.error("Firebase Initialization Error:", err.message);
  console.log(
    "Please download your Service Account JSON from Firebase Console -> Project Settings -> Service Accounts, rename it to 'firebaseServiceAccountKey.json', and place it in the server folder.",
  );
}

// -- REST API ROUTES --

// POST /api/auth/signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    if (!db)
      return res
        .status(500)
        .json({ error: "Firebase Database not initialized" });
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

    const usersRef = db.collection("users");

    // Check Email unique
    const emailCheckSnapshot = await usersRef
      .where("email", "==", sanitizedEmail)
      .limit(1)
      .get();
    if (!emailCheckSnapshot.empty) {
      return res
        .status(400)
        .json({ error: "An account with this email already exists" });
    }

    if (role === "ADMIN") {
      const adminSnapshot = await usersRef.where("role", "==", "ADMIN").get();
      if (adminSnapshot.size >= 5) {
        return res
          .status(403)
          .json({
            error: "Maximum limit of 5 Admin accounts has been reached.",
          });
      }
    }

    if (role === "RESIDENT") {
      const houseSnapshot = await usersRef
        .where("role", "==", "RESIDENT")
        .where("houseId", "==", houseId)
        .get();
      if (!houseSnapshot.empty) {
        return res
          .status(400)
          .json({
            error: `An account already exists for House No: ${houseId}`,
          });
      }
    }

    const userId = `${role.charAt(0)}${Date.now()}`;
    await usersRef.doc(userId).set({
      id: userId,
      role,
      name: name.trim(),
      email: sanitizedEmail,
      houseId: houseId || null,
      passwordHash: bcrypt.hashSync(password, 10),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

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
    if (!db)
      return res
        .status(500)
        .json({ error: "Firebase Database not initialized" });

    const { email, password } = req.body;
    const sanitizedEmail = email.trim().toLowerCase();

    const usersRef = db.collection("users");
    const snapshot = await usersRef
      .where("email", "==", sanitizedEmail)
      .limit(1)
      .get();

    if (snapshot.empty)
      return res
        .status(401)
        .json({ error: "Invalid credentials or user not found" });

    let user;
    snapshot.forEach((doc) => {
      user = doc.data();
    });

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
    if (!db)
      return res
        .status(500)
        .json({ error: "Firebase Database not initialized" });

    const entriesRef = db.collection("entries");
    // Sort descending by numeric ID or entryTime.
    const snapshot = await entriesRef.orderBy("id", "desc").get();

    const entries = [];
    snapshot.forEach((doc) => {
      entries.push(doc.data());
    });

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
  } else if (socket.user.role === "GUARD") {
    socket.join("guards_room");
  }

  // Guard emits new visitor entry
  socket.on("new_visitor", async (data) => {
    try {
      if (db) {
        const entryId = data.id.toString();
        await db
          .collection("entries")
          .doc(entryId)
          .set({
            ...data,
            entryTime: data.entryTime || new Date().toISOString(),
          });
        console.log(`Saved new visitor: ${data.guestName} to Firebase`);
      }

      // Push real-time event exactly to the resident associated with houseId
      io.to(`house_${data.houseId}`).emit("visitor_alert", data);
      // Also push to all other guards
      socket.to("guards_room").emit("visitor_alert", data);
    } catch (err) {
      console.error("Error saving new visitor event:", err.message);
    }
  });

  // Resident approves/rejects
  socket.on("update_visitor_status", async (data) => {
    try {
      if (db) {
        const entryId = data.id.toString();
        await db
          .collection("entries")
          .doc(entryId)
          .update({ status: data.status });
        console.log(
          `Visitor ${data.id} status updated to ${data.status} in Firebase`,
        );
      }

      // Notify all guards
      io.to("guards_room").emit("status_updated", data);

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
  console.log(`Real-Time Server backed by Firebase running on port ${PORT}`);
});
