import { auth, db, secondaryAuth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

export const mockAuthService = {
  signup: async (
    role,
    name,
    email,
    password,
    houseId,
    societyCode,
    createdByAdmin = false,
  ) => {
    try {
      if (!role || !name || !email || !password)
        throw new Error("All fields are required");
      if (role === "RESIDENT" && !houseId)
        throw new Error("House ID is required for Residents");
      if (role !== "ADMIN" && role !== "SUPERADMIN" && !societyCode)
        throw new Error("Society Code is required");

      const sanitizedEmail = email.trim().toLowerCase();

      // Allow demo accounts to bypass the @gmail.com restriction
      const isDemoAccount = [
        "admin@system.com",
        "rakesh@guard.com",
        "resi101@society.com",
      ].includes(sanitizedEmail);

      if (!isDemoAccount) {
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailRegex.test(sanitizedEmail)) {
          throw new Error(
            "Registration failed: Only official @gmail.com addresses are permitted.",
          );
        }
      }

      const usersRef = collection(db, "users");

      // Rate limit check or constraint checks
      if (role === "ADMIN") {
        const adminQ = query(usersRef, where("role", "==", "ADMIN"));
        const adminSnapshot = await getDocs(adminQ);
        if (adminSnapshot.size >= 5) {
          throw new Error(
            "Maximum limit of 5 Admin accounts has been reached.",
          );
        }
      }

      if (role === "RESIDENT") {
        const houseQ = query(
          usersRef,
          where("role", "==", "RESIDENT"),
          where("houseId", "==", houseId),
          where("societyCode", "==", societyCode),
        );
        const houseSnapshot = await getDocs(houseQ);
        if (!houseSnapshot.empty && !isDemoAccount) {
          throw new Error(
            `An account already exists for House No: ${houseId} in this society`,
          );
        }
      }

      // Create in Firebase Auth
      const authInstance = createdByAdmin ? secondaryAuth : auth;
      const userCredential = await createUserWithEmailAndPassword(
        authInstance,
        sanitizedEmail,
        password,
      );
      const firebaseUser = userCredential.user;

      // Save custom user metadata to Firestore
      const userId = `${role.charAt(0)}${Date.now()}`;

      const userData = {
        id: userId,
        role,
        uid: firebaseUser.uid, // Firebase's true auth ID
        name: name.trim(),
        email: sanitizedEmail,
        houseId: houseId || null,
        societyCode: societyCode || null,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", firebaseUser.uid), userData);

      return {
        success: true,
        message: "Account created successfully. Please log in.",
      };
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        throw new Error("An account with this email already exists.");
      }
      throw new Error(err.message || "Signup failed");
    }
  },

  login: async (email, password) => {
    try {
      if (email === "admin@gmail.com" && password === "Admin@123") {
        const superadminSession = {
          role: "SUPERADMIN",
          id: "SA1",
          uid: "SUPERADMIN_MOCK_UID",
          name: "Super Admin",
          houseId: null,
          societyCode: "ALL",
        };
        localStorage.setItem(
          "gateGuardUser",
          JSON.stringify(superadminSession),
        );
        return { user: superadminSession };
      }

      const sanitizedEmail = email.trim().toLowerCase();

      // Auto-provision demo accounts in Firebase if they don't exist
      const demoAccounts = {
        "admin@system.com": {
          role: "ADMIN",
          name: "Demo Admin",
          pass: "admin123",
          houseId: null,
          societyCode: "DEMO101",
        },
        "rakesh@guard.com": {
          role: "GUARD",
          name: "Rakesh Guard",
          pass: "guard123",
          houseId: null,
          societyCode: "DEMO101",
        },
        "resi101@society.com": {
          role: "RESIDENT",
          name: "Resident 101",
          pass: "resident123",
          houseId: "101",
          societyCode: "DEMO101",
        },
      };

      if (
        demoAccounts[sanitizedEmail] &&
        password === demoAccounts[sanitizedEmail].pass
      ) {
        try {
          await signInWithEmailAndPassword(auth, sanitizedEmail, password);
        } catch (err) {
          const isNotFound =
            err.code === "auth/user-not-found" ||
            err.code === "auth/invalid-login-credentials" ||
            err.code === "auth/invalid-credential";
          if (isNotFound) {
            const demo = demoAccounts[sanitizedEmail];
            await mockAuthService.signup(
              demo.role,
              demo.name,
              sanitizedEmail,
              password,
              demo.houseId,
              demo.societyCode,
            );
            // Re-authenticate after successful signup to ensure auth state is valid
            await signInWithEmailAndPassword(auth, sanitizedEmail, password);
          } else {
            throw err;
          }
        }
      } else {
        await signInWithEmailAndPassword(auth, sanitizedEmail, password);
      }

      const firebaseUser = auth.currentUser;

      // Fetch user role info from Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid);

      // Add a slight delay just in case firestore needs a moment after setDoc
      await new Promise((resolve) => setTimeout(resolve, 500));

      let userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        if (demoAccounts[sanitizedEmail]) {
          const demo = demoAccounts[sanitizedEmail];
          const userId = `${demo.role.charAt(0)}${Date.now()}`;
          const userData = {
            id: userId,
            role: demo.role,
            uid: firebaseUser.uid,
            name: demo.name,
            email: sanitizedEmail,
            houseId: demo.houseId || null,
            societyCode: demo.societyCode || null,
            createdAt: serverTimestamp(),
          };
          await setDoc(userDocRef, userData);
          userDoc = await getDoc(userDocRef);
        } else {
          throw new Error(
            "User record not found in system. Please contact admin, or ensure ad-blockers are disabled.",
          );
        }
      }
      const userData = userDoc.data();

      const userSession = {
        role: userData.role,
        id: userData.id,
        uid: firebaseUser.uid,
        name: userData.name,
        houseId: userData.houseId,
        societyCode: userData.societyCode || null,
      };

      // Set localStorage session for synchronous AppContext re-hydration
      localStorage.setItem("gateGuardUser", JSON.stringify(userSession));

      return {
        user: userSession,
      };
    } catch (err) {
      if (
        err.code === "auth/invalid-login-credentials" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        throw new Error("Invalid credentials");
      }
      throw new Error(err.message || "Login failed");
    }
  },

  logout: async () => {
    await signOut(auth);
    localStorage.removeItem("gateGuardUser");
  },

  verifySession: () => {
    const saved = localStorage.getItem("gateGuardUser");
    if (saved) return JSON.parse(saved);
    return null;
  },
};
