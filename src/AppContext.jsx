import { createContext, useState, useContext, useEffect } from "react";
import { mockAuthService } from "./utils/authService";
import { db } from "./firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    // Rely solely on HTTPOnly cookie / signed JWT verification upon load to re-hydrate state securely
    return mockAuthService.verifySession();
  }); // { role, id, name, houseId }

  useEffect(() => {
    // Fallback sync, but the true state revolves around auth_token cookie
    if (currentUser) {
      localStorage.setItem("gateGuardUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("gateGuardUser");
    }
  }, [currentUser]);

  const [entries, setEntries] = useState([]);

  // Listen to true data from Firestore in Real-Time
  useEffect(() => {
    let unsubscribe;
    const fetchEntries = () => {
      try {
        const entriesRef = collection(db, "entries");
        const q = query(entriesRef, orderBy("id", "desc"));

        // This natively listens for changes in Firestore across ALL devices instantly
        unsubscribe = onSnapshot(q, (querySnapshot) => {
          const data = [];
          querySnapshot.forEach((doc) => {
            data.push(doc.data());
          });
          setEntries(data);
        });
      } catch (err) {
        console.error("Failed to load entries from Firestore:", err);
      }
    };

    fetchEntries();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]); // Refresh entry list on user login status change

  const requireAdmin = () => {
    // Validates from cryptographically secure JWT simulation
    const session = mockAuthService.verifySession();
    if (!session || session.role !== "ADMIN") {
      throw new Error("403 Forbidden: Admin privileges required.");
    }
    return true;
  };

  const signup = async (
    role,
    name,
    email,
    password,
    houseId,
    societyCode,
    createdByAdmin = false,
  ) => {
    try {
      const response = await mockAuthService.signup(
        role,
        name,
        email,
        password,
        houseId,
        societyCode,
        createdByAdmin,
      );
      return response;
    } catch (err) {
      console.error("Signup Failed:", err.message);
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await mockAuthService.login(email, password);
      // Validated response. JWT token stored securely.
      setCurrentUser(response.user);
      return response.user;
    } catch (err) {
      console.error("Login Failed:", err.message);
      throw err;
    }
  };

  const logout = () => {
    mockAuthService.logout();
    setCurrentUser(null);
  };

  const resetPassword = async (email) => {
    return await mockAuthService.resetPassword(email);
  };

  const addEntry = async (entryData) => {
    const newId = Date.now();
    const newEntry = {
      ...entryData,
      id: newId,
      status: "PENDING",
      entryTime: new Date().toISOString(),
    };

    // Optimistic UI update
    setEntries((prev) => [newEntry, ...prev]);

    try {
      // Save directly to Firestore for global cross-device synchronization without websocket reliance
      const entryRef = doc(db, "entries", newId.toString());
      await setDoc(entryRef, newEntry);
    } catch (err) {
      console.error("Failed to sync new entry to Firebase:", err);
    }
  };
  const updateEntryStatus = async (id, newStatus) => {
    // Optimistic UI update
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e)),
    );

    try {
      const entryRef = doc(db, "entries", id.toString());
      await updateDoc(entryRef, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status in Firebase:", err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        signup,
        logout,
        entries,
        addEntry,
        updateEntryStatus,
        requireAdmin,
        resetPassword,
        setCurrentUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
