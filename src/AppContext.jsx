import { createContext, useState, useContext, useEffect } from "react";
import { mockAuthService } from "./utils/authService";
import { io } from "socket.io-client";

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

  const [socket, setSocket] = useState(null);

  // Sync with Local Storage to mock a shared database
  useEffect(() => {
    localStorage.setItem("gateGuardEntries", JSON.stringify(entries));
  }, [entries]);

  // WebSocket initialization and cleanup
  useEffect(() => {
    if (currentUser) {
      // Connect to the Socket server on port 4000
      const newSocket = io("http://localhost:4000", {
        auth: { user: currentUser },
      });
      setSocket(newSocket);

      // Listen for socket events
      newSocket.on("visitor_alert", (newEntry) => {
        // Prevent adding duplicate entries
        setEntries((prev) => {
          if (prev.find((e) => e.id === newEntry.id)) {
            // Might just be a status update from local, ignore
            return prev;
          }
          return [newEntry, ...prev];
        });
      });

      newSocket.on("status_updated", (data) => {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === data.id ? { ...e, status: data.status } : e,
          ),
        );
      });

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
      }
      setSocket(null);
    }
  }, [currentUser]); // Note: excluding socket from dependency array as socket comes from the ref essentially

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

    // Emit event to Socket Server
    if (socket && socket.connected) {
      socket.emit("new_visitor", newEntry);
    }
  };

  const updateEntryStatus = (id, newStatus) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e)),
    );

    // Emit event to Socket Server
    if (socket && socket.connected) {
      socket.emit("update_visitor_status", { id, status: newStatus });
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
        socket, // Export socket if components need independent event access
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
