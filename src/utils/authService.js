import bcrypt from "bcryptjs";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

const JWT_SECRET = "secure_jwt_secret_key_mock_for_demo"; // In a real app, this MUST be on the backend. This is a mock API service.

// Pre-hashed passwords for demo - we'll initialize the DB with them if empty
const hashedAdminPassword = bcrypt.hashSync("admin123", 10);
const hashedGuardPassword = bcrypt.hashSync("guard123", 10);
const hashedResidentPassword = bcrypt.hashSync("resident123", 10);

const getMockDB = () => {
  const saved = localStorage.getItem("mock_users_db");
  if (saved) return JSON.parse(saved);
  const defaultDB = [
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
  ];
  localStorage.setItem("mock_users_db", JSON.stringify(defaultDB));
  return defaultDB;
};

const saveMockDB = (db) => {
  localStorage.setItem("mock_users_db", JSON.stringify(db));
};

const loginAttempts = new Map(); // IP or Session tracking simulation

export const mockAuthService = {
  signup: async (role, name, email, password, houseId) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!role || !name || !email || !password)
          return reject(new Error("All fields are required"));
        if (role === "RESIDENT" && !houseId)
          return reject(new Error("House ID is required for Residents"));

        // Sanitize and Validate Email
        const sanitizedEmail = email.trim().toLowerCase();

        // Strict Validation: Only accept @gmail.com, reject any temporary domains
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailRegex.test(sanitizedEmail)) {
          return reject(
            new Error(
              "Registration failed: Only official @gmail.com addresses are permitted. Temporary or disposable domains are restricted.",
            ),
          );
        }

        const db = getMockDB();

        // Check for duplicate email
        if (db.some((u) => u.email === sanitizedEmail)) {
          return reject(new Error("An account with this email already exists"));
        }

        // Check Admin limit
        if (role === "ADMIN") {
          const adminCount = db.filter((u) => u.role === "ADMIN").length;
          if (adminCount >= 5) {
            return reject(
              new Error(
                "403 Forbidden: Maximum limit of 5 Admin accounts has been reached.",
              ),
            );
          }
        }

        // Check Resident duplicate house ID
        if (role === "RESIDENT") {
          if (db.some((u) => u.role === "RESIDENT" && u.houseId === houseId)) {
            return reject(
              new Error(`An account already exists for House No: ${houseId}`),
            );
          }
        }

        const newUser = {
          id: `${role.charAt(0)}${Date.now()}`,
          role,
          name: name.trim(),
          email: sanitizedEmail,
          houseId: houseId || null,
          passwordHash: bcrypt.hashSync(password, 10),
        };

        db.push(newUser);
        saveMockDB(db);

        resolve({
          success: true,
          message: "Account created successfully. Please log in.",
        });
      }, 500);
    });
  },

  login: async (email, password) => {
    return new Promise((resolve, reject) => {
      // Sanitize input
      const sanitizedEmail = email.trim().toLowerCase();

      // Basic Local Rate Limiting based on email
      const key = `login_${sanitizedEmail}`;
      const attempts = loginAttempts.get(key) || { count: 0, time: Date.now() };

      // Reset attempts after 15 mins (900000 ms)
      if (Date.now() - attempts.time > 900000) {
        attempts.count = 0;
        attempts.time = Date.now();
      }

      if (attempts.count >= 5) {
        return reject(
          new Error(
            "429 Too Many Requests: Account temporarily locked due to multiple failed login attempts. Try again in 15 minutes.",
          ),
        );
      }

      setTimeout(() => {
        const db = getMockDB();
        const user = db.find((u) => u.email === sanitizedEmail);

        if (!user) {
          attempts.count += 1;
          loginAttempts.set(key, attempts);
          return reject(new Error("Invalid credentials or user not found"));
        }

        // Securely verify hashed password
        const isMatch = bcrypt.compareSync(password, user.passwordHash);

        if (!isMatch) {
          attempts.count += 1;
          loginAttempts.set(key, attempts);
          return reject(new Error("Invalid password"));
        }

        // Clear attempts on success
        loginAttempts.delete(key);

        // Generate a mock JWT token containing user role and ID
        const tokenPayload = btoa(
          JSON.stringify({
            id: user.id,
            role: user.role,
            name: user.name,
            houseId: user.houseId || null,
            exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days expiration
          }),
        );

        // Format: header.payload.signature (mocked)
        const mockJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${tokenPayload}.MockSignatureVerify`;

        // Determine environment to fix localhost session dropout issue
        const isSecureEnv = window.location.protocol === "https:";

        // Store JWT securely in an HTTPOnly-like cookie for the frontend to manage stateless sessions
        // In real backend, set it with: res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict', path: '/' })
        Cookies.set("auth_token", mockJwt, {
          expires: 7, // 7 days
          secure: isSecureEnv,
          sameSite: "strict",
          path: "/",
        });

        resolve({
          token: mockJwt,
          user: {
            role: user.role,
            id: user.id,
            name: user.name,
            houseId: user.houseId,
          },
        });
      }, 500); // simulate network latency
    });
  },

  logout: () => {
    const isSecureEnv = window.location.protocol === "https:";
    Cookies.remove("auth_token", {
      secure: isSecureEnv,
      sameSite: "strict",
      path: "/",
    });
  },

  verifySession: () => {
    const token = Cookies.get("auth_token");
    if (!token) return null;

    try {
      // Decode JWT
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(""),
      );

      const decoded = JSON.parse(jsonPayload);

      // Check basic expiration
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        mockAuthService.logout();
        return null;
      }
      return decoded;
    } catch (err) {
      console.error("Invalid token:", err);
      mockAuthService.logout();
      return null;
    }
  },
};
