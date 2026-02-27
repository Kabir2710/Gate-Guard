import { createContext, useState, useContext, useEffect } from "react";

const ExtensionContext = createContext();

export const ExtensionProvider = ({ children }) => {
  // Guidelines state
  const [guidelines, setGuidelines] = useState(() => {
    const saved = localStorage.getItem("gateGuardGuidelines");
    return saved
      ? JSON.parse(saved)
      : "1. All guests must provide valid ID.\n2. Delivery personnel are allowed only up to the lobby.\n3. Keep the gate area clear at all times.";
  });

  // Residents list state
  const [residents, setResidents] = useState(() => {
    const saved = localStorage.getItem("gateGuardResidents");
    return saved
      ? JSON.parse(saved)
      : [
          { id: "R1", name: "Resident A", houseId: "101", isActive: true },
          { id: "R2", name: "Resident B", houseId: "102", isActive: true },
        ];
  });

  // Soft deleted logs state (for guard)
  const [deletedLogs, setDeletedLogs] = useState(() => {
    const saved = localStorage.getItem("gateGuardDeletedLogs");
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("gateGuardGuidelines", JSON.stringify(guidelines));
  }, [guidelines]);

  useEffect(() => {
    localStorage.setItem("gateGuardResidents", JSON.stringify(residents));
  }, [residents]);

  useEffect(() => {
    localStorage.setItem("gateGuardDeletedLogs", JSON.stringify(deletedLogs));
  }, [deletedLogs]);

  const updateGuidelines = (newGuidelines) => setGuidelines(newGuidelines);

  const addResident = (resident) =>
    setResidents((prev) => [
      ...prev,
      { ...resident, id: Date.now().toString() },
    ]);
  const updateResident = (id, updated) =>
    setResidents((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updated } : r)),
    );
  const deleteResident = (id) =>
    setResidents((prev) => prev.filter((r) => r.id !== id));

  const softDeleteLog = (logId) => setDeletedLogs((prev) => [...prev, logId]);

  return (
    <ExtensionContext.Provider
      value={{
        guidelines,
        updateGuidelines,
        residents,
        addResident,
        updateResident,
        deleteResident,
        deletedLogs,
        softDeleteLog,
      }}
    >
      {children}
    </ExtensionContext.Provider>
  );
};

export const useExtensionContext = () => useContext(ExtensionContext);
