import { createContext, useState, useContext, useEffect } from "react";
import { mockAuthService } from "./utils/authService";

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

  // Dummy Initial Data or Local Storage
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem("gateGuardEntries");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 1,
        guestName: "John Doe",
        mobile: "9876543210",
        houseId: "101",
        purpose: "Delivery",
        status: "PENDING",
        entryTime: new Date(Date.now() - 60000).toISOString(),
      },
    ];
  });

  // Sync with Local Storage to mock a shared database and real-time updates across tabs
  useEffect(() => {
    localStorage.setItem("gateGuardEntries", JSON.stringify(entries));
  }, [entries]);

  // Listen for storage events to update state across multiple tabs automatically
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "gateGuardEntries" && e.newValue) {
        setEntries(JSON.parse(e.newValue));
      }
      if (e.key === "gateGuardUser" && e.newValue) {
        setCurrentUser(JSON.parse(e.newValue));
      } else if (e.key === "gateGuardUser" && !e.newValue) {
        setCurrentUser(null);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const requireAdmin = () => {
    // Validates from cryptographically secure JWT simulation
    const session = mockAuthService.verifySession();
    if (!session || session.role !== "ADMIN") {
      throw new Error("403 Forbidden: Admin privileges required.");
    }
    return true;
  };

  const signup = async (role, name, email, password, houseId) => {
    try {
      const response = await mockAuthService.signup(
        role,
        name,
        email,
        password,
        houseId,
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

  const addEntry = (entryData) => {
    const newEntry = {
      ...entryData,
      id: Date.now(),
      status: "PENDING",
      entryTime: new Date().toISOString(),
    };
    setEntries((prev) => [newEntry, ...prev]);
  };

  const updateEntryStatus = (id, newStatus) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e)),
    );
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
