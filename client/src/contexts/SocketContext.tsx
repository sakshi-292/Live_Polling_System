import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
});

export function SocketProvider({ children }: { children: ReactNode }) {
  // ✅ Using useState (not useRef) so that setting the socket triggers a
  //    re-render and the context value updates for all consumers immediately.
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    console.log("[SocketProvider] Creating singleton socket →", API_URL);

    const s = io(API_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    // Make socket available to context consumers immediately
    // (socket.io queues emits until connection is established)
    setSocket(s);

    s.on("connect", () => {
      setConnected(true);
      console.log("[SocketProvider] ✅ Connected:", s.id);
    });

    s.on("disconnect", (reason) => {
      setConnected(false);
      console.log("[SocketProvider] ❌ Disconnected:", reason);
    });

    s.on("connect_error", (err) => {
      console.error("[SocketProvider] Connection error:", err.message);
    });

    return () => {
      console.log("[SocketProvider] Cleaning up socket");
      s.disconnect();
      setSocket(null);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
